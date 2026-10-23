import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models import (
    Base,
    AccountModel,
    TransactionModel,
    AlertModel,
    CaseModel,
    NoteModel,
)
from backend.app.db.session import engine

BANKS = [
    {"code": "HDFC", "name": "HDFC Bank", "ifsc": "HDFC0001245"},
    {"code": "SBIN", "name": "State Bank of India", "ifsc": "SBIN0004521"},
    {"code": "ICIC", "name": "ICICI Bank", "ifsc": "ICIC0000047"},
    {"code": "AXIS", "name": "Axis Bank", "ifsc": "UTIB0000192"},
    {"code": "KKBK", "name": "Kotak Mahindra Bank", "ifsc": "KKBK0000981"},
    {"code": "PUNB", "name": "Punjab National Bank", "ifsc": "PUNB0002104"},
]

def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    now = datetime.utcnow()

    # 1. Seed accounts and alerts if empty
    if db.query(AccountModel).count() == 0:
        print("Seeding initial financial crime detection database with synthetic & SOA-trained data...")
        trained_file = "apps/web/src/mocks/trained-accounts.json"
        trained_data = []
        if os.path.exists(trained_file):
            try:
                with open(trained_file, "r") as f:
                    trained_data = json.load(f)
            except Exception as e:
                print(f"Warning: could not load trained accounts: {e}")

        seeded_accounts = []

        # Seed trained accounts from SOA dataset
        for idx, t in enumerate(trained_data):
            bank = BANKS[idx % len(BANKS)]
            last4 = str(t.get("raw_account_no", "1000"))[-4:].zfill(4)
            acc_id = f"{bank['code']}-XXXX{last4}"
            name_parts = t.get("holder_name", "Unknown User").split()
            first = name_parts[0] if name_parts else "Mule"
            last = name_parts[1] if len(name_parts) > 1 else ""
            masked_name = f"{first[0]}*** {last[0] + '***' if last else ''}".strip()
            risk_score = t.get("mule_risk_score", 88)
            tier = "CRITICAL" if risk_score >= 85 else "HIGH" if risk_score >= 70 else "MEDIUM"

            acc = AccountModel(
                id=acc_id,
                raw_account_no=str(t.get("raw_account_no", "")),
                account_holder_masked=masked_name,
                bank_name=bank["name"],
                ifsc=t.get("ifsc", bank["ifsc"]),
                upi_handle_masked=f"{first.lower()}.{last[0].lower() if last else 'x'}**@{bank['code'].lower()}",
                risk_score=risk_score,
                risk_tier=tier,
                pass_through_ratio=float(t.get("pass_through_ratio", 0.95)),
                graph_degree=min(250, max(5, int(t.get("tx_count", 20) // 100 + 4))),
                account_age_days=max(7, (idx * 17) % 360),
                amount_at_risk_inr=float(t.get("total_credit_inr", 450000.0)),
                status="ACTIVE" if idx % 7 != 0 else "UNDER_REVIEW",
                total_credit_inr=float(t.get("total_credit_inr", 450000.0)),
                total_debit_inr=float(t.get("total_debit_inr", 445000.0)),
                balance=float(t.get("end_balance", 2500.0)),
                is_restricted=(idx == 3 or idx == 11),
                created_at=now - timedelta(days=max(7, (idx * 17) % 360)),
            )
            db.add(acc)
            seeded_accounts.append(acc)

            # Alert
            alert_id = f"ALT-SOA-{8000 + idx}"
            db.add(AlertModel(
                id=alert_id,
                account_id=acc_id,
                risk_score=risk_score,
                risk_tier=tier,
                queue_category="HIGH_RISK" if risk_score >= 75 else "MY_QUEUE",
                signals=t.get("signals", [
                    f"{round(float(t.get('pass_through_ratio', 0.95)) * 100, 1)}% fund pass-through ratio",
                    f"Turnover INR {round(float(t.get('total_credit_inr', 500000))):,} with near-zero retention",
                    "Rapid dispersal to multiple outward counterparty nodes"
                ]),
                status="INVESTIGATING" if idx % 5 == 0 else "NEW",
                assigned_to="ANALYST-104" if idx % 2 == 0 else None,
                ring_id="RING-MH-8812" if idx % 4 == 0 else None,
                created_at=now - timedelta(minutes=(idx * 24 + 12)),
            ))

            # Sample transactions
            tx_count = min(8, max(3, int(t.get("tx_count", 5)) % 10))
            for j in range(tx_count):
                dest_acc = f"BEN-COUNTERPARTY-{j+1}" if j % 2 == 0 else f"{BANKS[(idx+j) % len(BANKS)]['code']}-XXXX{(1000 + j*13)%9000}"
                db.add(TransactionModel(
                    id=f"TXN-SOA-{idx}-{j+1}",
                    timestamp=now - timedelta(hours=j * 3 + 1),
                    source_account=acc_id,
                    destination_account=dest_acc,
                    amount=round(float(t.get("total_credit_inr", 500000.0)) / (tx_count + 1), 2),
                    currency="INR",
                    channel="IMPS" if j % 2 == 0 else "UPI",
                    narration=f"Dispersal transfer tranche {j+1}",
                    is_flagged=True,
                ))

        # Synthetic accounts
        for i in range(len(seeded_accounts) + 1, 121):
            bank = BANKS[i % len(BANKS)]
            last4 = str(1000 + ((i * 37) % 9000))
            acc_id = f"{bank['code']}-XXXX{last4}"
            risk_score = 88 + (i % 12) if i % 4 == 0 else 65 + (i % 25) if i % 2 == 0 else 35 + (i % 30)
            tier = "CRITICAL" if risk_score >= 80 else "HIGH" if risk_score >= 65 else "MEDIUM"
            turnover = float((50000 + (i * 24100) % 2500000))

            acc = AccountModel(
                id=acc_id,
                raw_account_no=f"91000000{last4}",
                account_holder_masked=f"A*** {chr(65 + (i % 26))}***",
                bank_name=bank["name"],
                ifsc=f"{bank['code']}000{1000 + (i % 8999)}",
                upi_handle_masked=f"synthetic.{i%100}@axis",
                risk_score=risk_score,
                risk_tier=tier,
                pass_through_ratio=round(0.70 + (i % 28) * 0.01, 2),
                graph_degree=3 + (i % 20),
                account_age_days=10 + (i % 300),
                amount_at_risk_inr=turnover,
                status="ACTIVE",
                total_credit_inr=turnover,
                total_debit_inr=turnover * 0.98,
                balance=1500.0,
                is_restricted=(i % 25 == 0),
                created_at=now - timedelta(days=10 + (i % 300)),
            )
            db.add(acc)

            alt_id = f"ALT-{80000 + i}"
            db.add(AlertModel(
                id=alt_id,
                account_id=acc_id,
                risk_score=risk_score,
                risk_tier=tier,
                queue_category="HIGH_RISK" if risk_score >= 75 else "NEW_TODAY",
                signals=[
                    "High pass-through ratio within short window of credit",
                    "Device fingerprint linked to multiple dormant accounts",
                    "Rapid UPI velocity followed by immediate ATM cash-out"
                ],
                status="NEW",
                assigned_to="ANALYST-104" if i % 4 == 0 else None,
                ring_id="RING-JH-4409" if i % 9 == 0 else None,
                created_at=now - timedelta(minutes=(i * 15 + 10)),
            ))

        db.commit()

    # 2. Seed Cases / Investigations if empty
    if db.query(CaseModel).count() == 0:
        top_alerts = db.query(AlertModel).filter(AlertModel.risk_score >= 75).limit(25).all()
        for idx, alt in enumerate(top_alerts):
            case_id = f"CAS-2026-{1000 + idx}"
            db.add(CaseModel(
                id=case_id,
                alert_id=alt.id,
                primary_account=alt.account_id,
                primary_holder_masked="U*** K***" if idx == 0 else "R*** K***",
                bank_name="HDFC Bank" if "HDFC" in alt.account_id else "State Bank of India",
                ifsc="HDFC0001245",
                title=f"Rapid Mule Layering on {alt.account_id}",
                risk_score=alt.risk_score,
                status="UNDER_REVIEW" if idx % 3 == 0 else "OPEN",
                assigned_analyst="ANALYST-104",
                sla_deadline=now + timedelta(hours=max(1.5, 12 - idx * 0.4)),
                total_exposed_inr=float(alt.risk_score * 18000),
                summary=f"Automated rule and Isolation Forest trigger on {alt.account_id}. Suspicious high velocity routing observed.",
                created_at=alt.created_at,
            ))

            db.add(NoteModel(
                case_id=case_id,
                account_id=alt.account_id,
                author="ANALYST-104",
                content=f"Initial review underway for {alt.account_id}. Noted pass-through pattern matching telegram phishing ring.",
                tag="Dispersal Observed",
                created_at=alt.created_at + timedelta(minutes=5),
            ))
        db.commit()

    print("Database initialization and verification completed.")
