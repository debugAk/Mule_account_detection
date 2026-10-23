import io
import csv
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models import (
    TransactionModel,
    AccountModel,
    AlertModel,
    CaseModel,
    AuditModel,
    CsvImportModel,
)
from backend.app.services.ml_service import ml_service
from backend.app.services.rules_engine import rules_engine
from backend.app.core.config import settings, redact_sensitive_text

class CsvIngestionService:
    COLUMN_ALIASES = {
        "transaction_id": ["transaction_id", "txn_id", "tran_id", "tx_id", "id", "reference_id"],
        "timestamp": ["timestamp", "tran_date", "txn_date", "date", "time", "date_of_transaction"],
        "source_account": ["source_account", "ac_no", "account_no", "account_number", "from_account", "src"],
        "destination_account": ["destination_account", "beneficiary_account", "to_account", "dest", "counterparty"],
        "amount": ["amount", "amt", "txn_amount"],
        "debit_amount": ["dr_amt", "debit_amount", "debit amount", "debit"],
        "credit_amount": ["cr_amt", "credit_amount", "credit amount", "credit"],
        "currency": ["currency", "crncy"],
        "channel": ["channel", "instrument_type", "inst_type", "type", "sub_type"],
        "narration": ["narration", "remarks", "rmks", "particulars", "txn particulars"],
        "account_holder": ["customer_name", "customer name", "ac_name", "account name", "holder_name"],
        "balance": ["balance", "line_balance"],
    }

    @classmethod
    def match_column(cls, header: str, target: str) -> bool:
        clean = re.sub(r'[^a-z0-9_]', '_', header.lower().strip())
        aliases = cls.COLUMN_ALIASES.get(target, [])
        return clean in [a.lower() for a in aliases]

    @classmethod
    def parse_timestamp(cls, raw: str) -> Optional[datetime]:
        raw = raw.strip()
        # ISO formats
        for fmt in (
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%d-%m-%Y %H:%M:%S",
            "%d/%m/%Y %H:%M:%S",
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
        ):
            try:
                return datetime.strptime(raw.split(".")[0], fmt)
            except ValueError:
                pass
        return None

    @classmethod
    def ingest_csv(
        cls,
        file_content: str,
        filename: str,
        imported_by: str,
        db: Session,
    ) -> Dict[str, Any]:
        reader = csv.reader(io.StringIO(file_content.strip()))
        try:
            raw_headers = next(reader)
        except StopIteration:
            raise ValueError("CSV file is empty")

        headers = [h.strip() for h in raw_headers]
        headers_lower = [h.lower().strip() for h in headers]

        # Detect schema: SOA statement vs Transaction level
        is_soa_format = any("dr_amt" in h or "cr_amt" in h or "debit amount" in h for h in headers_lower)

        # Build column index mapping
        col_map: Dict[str, int] = {}
        for target in cls.COLUMN_ALIASES:
            for idx, h in enumerate(headers):
                if cls.match_column(h, target):
                    col_map[target] = idx
                    break

        total_rows = 0
        accepted_rows = 0
        rejected_rows = 0
        duplicate_rows = 0
        errors: List[Dict[str, Any]] = []

        seen_tx_ids = set()
        existing_tx_ids = set(r[0] for r in db.query(TransactionModel.id).all())

        new_transactions: List[TransactionModel] = []
        affected_accounts: set = set()

        for row_idx, row in enumerate(reader, start=2):
            if not row or all(not cell.strip() for cell in row):
                continue
            total_rows += 1

            if total_rows > settings.MAX_UPLOAD_ROWS:
                errors.append({
                    "row": row_idx,
                    "reason": f"File exceeded maximum allowed rows ({settings.MAX_UPLOAD_ROWS}). Ingestion halted."
                })
                rejected_rows += 1
                break

            # Process based on detected format
            if is_soa_format:
                ac_idx = col_map.get("source_account")
                tx_id_idx = col_map.get("transaction_id")
                time_idx = col_map.get("timestamp")
                dr_idx = col_map.get("debit_amount")
                cr_idx = col_map.get("credit_amount")
                narr_idx = col_map.get("narration")

                if ac_idx is None or tx_id_idx is None or time_idx is None:
                    errors.append({
                        "row": row_idx,
                        "reason": "Missing required SOA headers (Account, Transaction ID, or Date)"
                    })
                    rejected_rows += 1
                    continue

                ac_val = row[ac_idx].strip() if ac_idx < len(row) else ""
                tx_id = row[tx_id_idx].strip() if tx_id_idx < len(row) else ""
                time_val = row[time_idx].strip() if time_idx < len(row) else ""
                dr_val = row[dr_idx].strip() if dr_idx and dr_idx < len(row) else "0"
                cr_val = row[cr_idx].strip() if cr_idx and cr_idx < len(row) else "0"
                narr_val = row[narr_idx].strip() if narr_idx and narr_idx < len(row) else ""

                if not ac_val or not tx_id:
                    errors.append({"row": row_idx, "reason": "Missing Account No or Transaction ID"})
                    rejected_rows += 1
                    continue

                if tx_id in seen_tx_ids or tx_id in existing_tx_ids:
                    duplicate_rows += 1
                    continue

                parsed_time = cls.parse_timestamp(time_val)
                if not parsed_time:
                    errors.append({"row": row_idx, "reason": f"Unparseable date: '{redact_sensitive_text(time_val)}'"})
                    rejected_rows += 1
                    continue

                try:
                    dr_amt = float(dr_val.replace(",", "")) if dr_val else 0.0
                    cr_amt = float(cr_val.replace(",", "")) if cr_val else 0.0
                except ValueError:
                    errors.append({"row": row_idx, "reason": "Non-numeric debit or credit amount"})
                    rejected_rows += 1
                    continue

                amount = dr_amt if dr_amt > 0 else cr_amt
                if amount <= 0:
                    errors.append({"row": row_idx, "reason": "Amount must be strictly greater than zero"})
                    rejected_rows += 1
                    continue

                is_debit = dr_amt > 0
                src_acc = f"ACC-{ac_val[-4:]}" if len(ac_val) >= 4 else f"ACC-{ac_val}"
                dest_acc = f"COUNTERPARTY-{narr_val[:12].replace('/', '_').strip()}" if narr_val else "BEN-EXTERNAL"

                seen_tx_ids.add(tx_id)
                new_transactions.append(TransactionModel(
                    id=tx_id,
                    timestamp=parsed_time,
                    source_account=src_acc if is_debit else dest_acc,
                    destination_account=dest_acc if is_debit else src_acc,
                    amount=round(amount, 2),
                    currency="INR",
                    channel="SOA_TRANSFER",
                    narration=narr_val[:255],
                    is_flagged=False,
                ))
                affected_accounts.add(src_acc)
                accepted_rows += 1

            else:
                # Standard transaction level format
                tx_id_idx = col_map.get("transaction_id")
                time_idx = col_map.get("timestamp")
                src_idx = col_map.get("source_account")
                dest_idx = col_map.get("destination_account")
                amt_idx = col_map.get("amount")
                curr_idx = col_map.get("currency")
                chan_idx = col_map.get("channel")

                if any(idx is None for idx in (tx_id_idx, time_idx, src_idx, dest_idx, amt_idx)):
                    missing = [k for k in ("transaction_id", "timestamp", "source_account", "destination_account", "amount") if col_map.get(k) is None]
                    errors.append({"row": row_idx, "reason": f"Missing required column(s): {', '.join(missing)}"})
                    rejected_rows += 1
                    continue

                tx_id = row[tx_id_idx].strip() if tx_id_idx < len(row) else ""
                time_val = row[time_idx].strip() if time_idx < len(row) else ""
                src_val = row[src_idx].strip() if src_idx < len(row) else ""
                dest_val = row[dest_idx].strip() if dest_idx < len(row) else ""
                amt_val = row[amt_idx].strip() if amt_idx < len(row) else ""
                curr_val = row[curr_idx].strip() if curr_idx and curr_idx < len(row) else "INR"
                chan_val = row[chan_idx].strip() if chan_idx and chan_idx < len(row) else "UPI"

                if not tx_id or not src_val or not dest_val or not amt_val:
                    errors.append({"row": row_idx, "reason": "Empty required fields"})
                    rejected_rows += 1
                    continue

                if tx_id in seen_tx_ids or tx_id in existing_tx_ids:
                    duplicate_rows += 1
                    continue

                parsed_time = cls.parse_timestamp(time_val)
                if not parsed_time:
                    errors.append({"row": row_idx, "reason": f"Invalid timestamp format '{time_val}'"})
                    rejected_rows += 1
                    continue

                try:
                    amount = float(amt_val.replace(",", ""))
                except ValueError:
                    errors.append({"row": row_idx, "reason": f"Non-numeric amount '{amt_val}'"})
                    rejected_rows += 1
                    continue

                if amount <= 0:
                    errors.append({"row": row_idx, "reason": f"Amount must be positive, got {amount}"})
                    rejected_rows += 1
                    continue

                seen_tx_ids.add(tx_id)
                new_transactions.append(TransactionModel(
                    id=tx_id,
                    timestamp=parsed_time,
                    source_account=src_val,
                    destination_account=dest_val,
                    amount=round(amount, 2),
                    currency=curr_val.upper()[:8],
                    channel=chan_val.upper()[:32],
                    narration=f"Imported transfer {src_val} -> {dest_val}",
                    is_flagged=False,
                ))
                affected_accounts.add(src_val)
                affected_accounts.add(dest_val)
                accepted_rows += 1

        # Commit transactions
        if new_transactions:
            db.bulk_save_objects(new_transactions)
            db.commit()

        # Re-evaluate accounts and generate/update alerts
        created_alerts_count = cls._recalculate_accounts_and_alerts(affected_accounts, db)

        # Log import record
        import uuid
        import_id = f"IMP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        import_record = CsvImportModel(
            id=import_id,
            filename=filename,
            file_format="SOA_STATEMENT" if is_soa_format else "TRANSACTION_LEVEL",
            total_rows=total_rows,
            accepted_rows=accepted_rows,
            rejected_rows=rejected_rows,
            duplicate_rows=duplicate_rows,
            created_alerts_count=created_alerts_count,
            error_summary=errors[:25],
            imported_by=imported_by,
        )
        db.add(import_record)

        # Log audit entry
        db.add(AuditModel(
            audit_id=f"AUDIT-IMP-{import_id}",
            action="CSV_IMPORT",
            actor_id=imported_by,
            target_id=filename,
            details=f"Accepted {accepted_rows} txns, rejected {rejected_rows}, duplicates {duplicate_rows}, generated {created_alerts_count} alerts.",
        ))
        db.commit()

        return {
            "import_id": import_id,
            "filename": filename,
            "format_detected": "SOA_STATEMENT" if is_soa_format else "TRANSACTION_LEVEL",
            "total_rows": total_rows,
            "accepted_rows": accepted_rows,
            "rejected_rows": rejected_rows,
            "duplicate_rows": duplicate_rows,
            "created_alerts_count": created_alerts_count,
            "analyzed_accounts_count": len(affected_accounts),
            "errors": errors[:25],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    @classmethod
    def _recalculate_accounts_and_alerts(cls, account_ids: set, db: Session) -> int:
        alerts_created = 0
        now = datetime.utcnow()

        for acc_id in account_ids:
            if not acc_id or acc_id.startswith("BEN-"):
                continue

            # Query all incoming and outgoing transactions
            out_txs = db.query(TransactionModel).filter(TransactionModel.source_account == acc_id).all()
            in_txs = db.query(TransactionModel).filter(TransactionModel.destination_account == acc_id).all()

            total_dr = sum(t.amount for t in out_txs)
            total_cr = sum(t.amount for t in in_txs)
            tx_count = len(out_txs) + len(in_txs)

            if tx_count == 0:
                continue

            counterparties = set(t.destination_account for t in out_txs) | set(t.source_account for t in in_txs)
            counterparties.discard(acc_id)
            unique_cp = len(counterparties)

            denom = max(total_dr, total_cr)
            pass_through = round(min(total_dr, total_cr) / denom, 4) if denom > 0 else 0.0
            end_balance = max(0.0, total_cr - total_dr)

            # ML Anomaly inference
            ml_pred = ml_service.predict(
                pass_through_ratio=pass_through,
                tx_count=tx_count,
                total_credit_inr=total_cr,
                end_balance=end_balance,
                unique_counterparties=unique_cp,
            )
            ml_score = ml_pred["ml_anomaly_score"]

            # Rules evaluation
            rule_score, triggered_rules, signals = rules_engine.evaluate_account(
                pass_through_ratio=pass_through,
                tx_count=tx_count,
                total_credit_inr=total_cr,
                end_balance=end_balance,
                unique_counterparties=unique_cp,
            )

            # Composite risk calculation
            final_risk, tier = rules_engine.calculate_composite_risk(
                rule_score=rule_score,
                ml_anomaly_score=ml_score,
                pass_through_ratio=pass_through,
                total_credit_inr=total_cr,
            )

            # Update or create account
            acc = db.query(AccountModel).filter(AccountModel.id == acc_id).first()
            if not acc:
                bank_code = acc_id.split("-")[0] if "-" in acc_id else "HDFC"
                acc = AccountModel(
                    id=acc_id,
                    raw_account_no=f"900000{acc_id[-4:] if len(acc_id)>=4 else '0000'}",
                    account_holder_masked=f"User {acc_id[-4:]}",
                    bank_name=f"{bank_code} Bank",
                    ifsc=f"{bank_code}0001245",
                    risk_score=final_risk,
                    risk_tier=tier,
                    pass_through_ratio=pass_through,
                    graph_degree=unique_cp,
                    amount_at_risk_inr=max(total_cr, total_dr),
                    total_credit_inr=total_cr,
                    total_debit_inr=total_dr,
                    balance=end_balance,
                )
                db.add(acc)
            else:
                acc.risk_score = final_risk
                acc.risk_tier = tier
                acc.pass_through_ratio = pass_through
                acc.graph_degree = unique_cp
                acc.amount_at_risk_inr = max(total_cr, total_dr)
                acc.total_credit_inr = total_cr
                acc.total_debit_inr = total_dr
                acc.balance = end_balance

            # If risk is elevated (>= 65), generate or update Alert
            if final_risk >= 65:
                existing_alert = db.query(AlertModel).filter(AlertModel.account_id == acc_id).first()
                if not existing_alert:
                    alert_id = f"ALT-INGEST-{datetime.utcnow().strftime('%H%M%S')}-{acc_id[-4:]}"
                    new_alert = AlertModel(
                        id=alert_id,
                        account_id=acc_id,
                        risk_score=final_risk,
                        risk_tier=tier,
                        queue_category="HIGH_RISK" if final_risk >= 75 else "NEW_TODAY",
                        signals=signals,
                        status="NEW",
                    )
                    db.add(new_alert)
                    alerts_created += 1

                    # If risk is >= 75, create Case
                    if final_risk >= 75:
                        case_id = f"CAS-INGEST-{datetime.utcnow().strftime('%H%M%S')}-{acc_id[-4:]}"
                        db.add(CaseModel(
                            id=case_id,
                            alert_id=alert_id,
                            primary_account=acc_id,
                            title=f"Mule Anomaly on {acc_id} (Post-CSV Ingest)",
                            risk_score=final_risk,
                            status="OPEN",
                            assigned_analyst="ANALYST-104",
                            total_exposed_inr=max(total_cr, total_dr),
                            summary=f"Generated from transaction ingestion. {signals[0]} with {unique_cp} counterparty edges.",
                        ))
                else:
                    existing_alert.risk_score = final_risk
                    existing_alert.risk_tier = tier
                    existing_alert.signals = signals

        db.commit()
        return alerts_created

csv_service = CsvIngestionService()
