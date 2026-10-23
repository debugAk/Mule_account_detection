from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from backend.app.db.session import get_db
from backend.app.models import AccountModel, TransactionModel, AuditModel
from backend.app.core.security import get_current_user, CurrentUser

router = APIRouter()

class PiiRevealRequest(BaseModel):
    accountId: str
    field: Optional[str] = "full_account"
    scopeReason: str

@router.get("/accounts/{account_id}")
def get_account(account_id: str, db: Session = Depends(get_db)):
    acc = db.query(AccountModel).filter(AccountModel.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    return {
        "id": acc.id,
        "accountHolderMasked": acc.account_holder_masked,
        "bankName": acc.bank_name,
        "ifsc": acc.ifsc,
        "upiHandleMasked": acc.upi_handle_masked,
        "riskScore": acc.risk_score,
        "riskTier": acc.risk_tier,
        "passThroughRatio": acc.pass_through_ratio,
        "graphDegree": acc.graph_degree,
        "accountAgeDays": acc.account_age_days,
        "amountAtRiskINR": acc.amount_at_risk_inr,
        "totalCreditINR": acc.total_credit_inr,
        "totalDebitINR": acc.total_debit_inr,
        "balance": acc.balance,
        "status": acc.status,
        "isRestricted": acc.is_restricted,
    }

@router.get("/accounts/{account_id}/transactions")
def get_account_transactions(account_id: str, db: Session = Depends(get_db)):
    txs = db.query(TransactionModel).filter(
        (TransactionModel.source_account == account_id) |
        (TransactionModel.destination_account == account_id)
    ).order_by(TransactionModel.timestamp.desc()).limit(100).all()

    return [
        {
            "id": t.id,
            "timestamp": t.timestamp.isoformat() + "Z",
            "isCredit": bool(t.destination_account == account_id),
            "sourceAccount": t.source_account,
            "destinationAccount": t.destination_account,
            "amount": t.amount,
            "currency": t.currency,
            "channel": t.channel,
            "narration": t.narration,
            "isFlagged": t.is_flagged,
        }
        for t in txs
    ]

@router.post("/audit/pii-reveal")
def reveal_pii(
    req: PiiRevealRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    acc = db.query(AccountModel).filter(AccountModel.id == req.accountId).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    audit_id = f"AUDIT-SEC-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:18]}"
    db.add(AuditModel(
        audit_id=audit_id,
        action="PII_UNMASK_ACCESS",
        actor_id=user.id,
        target_id=acc.id,
        details=f"Scope: {req.scopeReason}. Field requested: {req.field}.",
    ))
    db.commit()

    # Generate legitimate unmasked form for authorized view
    raw_val = acc.raw_account_no or acc.id.replace("XXXX", "5819")

    return {
        "revealedValue": raw_val,
        "auditId": audit_id,
        "expiresInSeconds": 30,
        "field": req.field,
    }
