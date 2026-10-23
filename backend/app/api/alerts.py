from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.models import AlertModel, AccountModel, AuditModel, CaseModel
from backend.app.core.security import get_current_user, CurrentUser

router = APIRouter()

class TriageRequest(BaseModel):
    action: str  # FREEZE, ESCALATE, DISMISS, ASSIGN
    alertIds: List[str]
    analystId: Optional[str] = "ANALYST-104"
    reason: Optional[str] = None

class UndoTriageRequest(BaseModel):
    alertIds: List[str]

@router.get("/alerts")
def get_alerts(
    category: Optional[str] = "ALL",
    q: Optional[str] = None,
    riskTier: Optional[str] = None,
    limit: int = Query(500, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(AlertModel, AccountModel).join(AccountModel, AlertModel.account_id == AccountModel.id)

    # Filter out dismissed/frozen from active queue unless specifically requested
    query = query.filter(AlertModel.status.notin_(["DISMISSED", "FROZEN"]))

    if category == "MY_QUEUE":
        query = query.filter(AlertModel.assigned_to.isnot(None))
    elif category == "HIGH_RISK":
        query = query.filter(AlertModel.risk_score >= 75)
    elif category == "RINGS":
        query = query.filter(AlertModel.ring_id.isnot(None))
    elif category == "NEW_TODAY":
        query = query.filter(AlertModel.queue_category == "NEW_TODAY")

    if riskTier and riskTier != "ALL":
        query = query.filter(AlertModel.risk_tier == riskTier.upper())

    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            (AlertModel.id.ilike(search_term)) |
            (AlertModel.account_id.ilike(search_term)) |
            (AccountModel.bank_name.ilike(search_term)) |
            (AccountModel.ifsc.ilike(search_term)) |
            (AccountModel.upi_handle_masked.ilike(search_term))
        )

    total_filtered = query.count()
    results = query.order_by(AlertModel.risk_score.desc(), AlertModel.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for alt, acc in results:
        items.append({
            "id": alt.id,
            "accountId": alt.account_id,
            "accountHolderMasked": acc.account_holder_masked,
            "bankName": acc.bank_name,
            "ifsc": acc.ifsc,
            "upiHandleMasked": acc.upi_handle_masked,
            "riskScore": alt.risk_score,
            "riskTier": alt.risk_tier,
            "passThroughRatio": acc.pass_through_ratio,
            "graphDegree": acc.graph_degree,
            "accountAgeDays": acc.account_age_days,
            "amountAtRiskINR": acc.amount_at_risk_inr,
            "timestamp": alt.created_at.isoformat() + "Z",
            "ringId": alt.ring_id,
            "status": alt.status,
            "queueCategory": alt.queue_category,
            "signals": alt.signals if alt.signals else [
                f"{round(acc.pass_through_ratio * 100, 1)}% fund pass-through ratio",
                f"Turnover volume INR {round(acc.amount_at_risk_inr):,} with rapid routing",
                "Transaction velocity heuristic triggered"
            ],
            "assignedTo": alt.assigned_to,
            "isRestricted": acc.is_restricted,
        })

    # Counts
    base = db.query(AlertModel).filter(AlertModel.status.notin_(["DISMISSED", "FROZEN"]))
    counts = {
        "all": base.count(),
        "myQueue": base.filter(AlertModel.assigned_to.isnot(None)).count(),
        "highRisk": base.filter(AlertModel.risk_score >= 75).count(),
        "rings": base.filter(AlertModel.ring_id.isnot(None)).count(),
        "newToday": base.filter(AlertModel.queue_category == "NEW_TODAY").count(),
    }

    return {
        "items": items,
        "total": total_filtered,
        "counts": counts,
        "lastSynced": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/alerts/{alert_id}")
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    res = db.query(AlertModel, AccountModel).join(
        AccountModel, AlertModel.account_id == AccountModel.id
    ).filter(AlertModel.id == alert_id).first()

    if not res:
        raise HTTPException(status_code=404, detail="Alert not found")

    alt, acc = res
    return {
        "id": alt.id,
        "accountId": alt.account_id,
        "accountHolderMasked": acc.account_holder_masked,
        "bankName": acc.bank_name,
        "ifsc": acc.ifsc,
        "riskScore": alt.risk_score,
        "riskTier": alt.risk_tier,
        "passThroughRatio": acc.pass_through_ratio,
        "graphDegree": acc.graph_degree,
        "amountAtRiskINR": acc.amount_at_risk_inr,
        "status": alt.status,
        "signals": alt.signals,
        "assignedTo": alt.assigned_to,
        "createdAt": alt.created_at.isoformat() + "Z",
    }

@router.post("/alerts/triage")
def triage_alerts(
    req: TriageRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    action = req.action.upper()
    alerts = db.query(AlertModel).filter(AlertModel.id.in_(req.alertIds)).all()
    if not alerts:
        raise HTTPException(status_code=404, detail="No matching alerts found for triage.")

    analyst = req.analystId or user.id

    for alt in alerts:
        if action == "FREEZE":
            alt.status = "FROZEN"
            acc = db.query(AccountModel).filter(AccountModel.id == alt.account_id).first()
            if acc:
                acc.status = "FROZEN"
        elif action == "ESCALATE":
            alt.status = "ESCALATED"
        elif action == "DISMISS":
            alt.status = "DISMISSED"
        elif action == "ASSIGN":
            alt.assigned_to = analyst

        db.add(AuditModel(
            audit_id=f"AUDIT-TRIAGE-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:18]}",
            action=f"TRIAGE_{action}",
            actor_id=analyst,
            target_id=alt.id,
            details=f"Alert {alt.id} for account {alt.account_id} triaged to {action}. Reason: {req.reason or 'Analyst action'}",
        ))

    db.commit()

    return {
        "success": True,
        "affectedCount": len(alerts),
        "actionId": f"ACT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.post("/alerts/triage/undo")
def undo_triage(req: UndoTriageRequest, db: Session = Depends(get_db)):
    alerts = db.query(AlertModel).filter(AlertModel.id.in_(req.alertIds)).all()
    for alt in alerts:
        alt.status = "NEW"
        acc = db.query(AccountModel).filter(AccountModel.id == alt.account_id).first()
        if acc and acc.status == "FROZEN":
            acc.status = "ACTIVE"

    db.commit()
    return {"success": True, "restoredCount": len(alerts)}
