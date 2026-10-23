from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.models import CaseModel, NoteModel, AlertModel, AccountModel, AuditModel
from backend.app.core.security import get_current_user, CurrentUser

router = APIRouter()

class CreateNoteRequest(BaseModel):
    content: str
    tag: Optional[str] = "Investigation Note"
    author: Optional[str] = "ANALYST-104"

class UpdateCaseStatusRequest(BaseModel):
    status: str  # OPEN, UNDER_REVIEW, STR_SUBMITTED, CLOSED
    reason: Optional[str] = None

@router.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(CaseModel).order_by(CaseModel.created_at.desc()).limit(100).all()
    items = []
    for c in cases:
        items.append({
            "id": c.id,
            "alertId": c.alert_id,
            "title": c.title,
            "riskScore": c.risk_score,
            "primaryAccount": c.primary_account,
            "primaryHolderMasked": c.primary_holder_masked,
            "bankName": c.bank_name,
            "ifsc": c.ifsc,
            "slaDeadline": c.sla_deadline.isoformat() + "Z" if c.sla_deadline else None,
            "status": c.status,
            "assignedAnalyst": c.assigned_analyst,
            "totalExposedINR": c.total_exposed_inr,
            "summary": c.summary,
            "createdAt": c.created_at.isoformat() + "Z",
        })
    return {"items": items, "total": len(items)}

@router.get("/cases/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    notes = db.query(NoteModel).filter(NoteModel.case_id == case_id).order_by(NoteModel.created_at.desc()).all()

    return {
        "id": c.id,
        "alertId": c.alert_id,
        "title": c.title,
        "riskScore": c.risk_score,
        "primaryAccount": c.primary_account,
        "primaryHolderMasked": c.primary_holder_masked,
        "bankName": c.bank_name,
        "ifsc": c.ifsc,
        "slaDeadline": c.sla_deadline.isoformat() + "Z" if c.sla_deadline else None,
        "status": c.status,
        "assignedAnalyst": c.assigned_analyst,
        "totalExposedINR": c.total_exposed_inr,
        "summary": c.summary,
        "createdAt": c.created_at.isoformat() + "Z",
        "notes": [
            {
                "id": str(n.id),
                "author": n.author,
                "content": n.content,
                "tag": n.tag,
                "createdAt": n.created_at.isoformat() + "Z",
            }
            for n in notes
        ],
    }

@router.patch("/cases/{case_id}/status")
def update_case_status(
    case_id: str,
    req: UpdateCaseStatusRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    old_status = c.status
    c.status = req.status.upper()
    c.updated_at = datetime.utcnow()

    # Log audit
    db.add(AuditModel(
        audit_id=f"AUDIT-CASE-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:18]}",
        action="CASE_STATUS_CHANGE",
        actor_id=user.id,
        target_id=case_id,
        details=f"Case {case_id} status updated from {old_status} to {c.status}. Reason: {req.reason or 'User action'}",
    ))

    db.commit()
    return {"success": True, "caseId": case_id, "newStatus": c.status}

@router.get("/cases/{case_id}/notes")
def get_case_notes(case_id: str, db: Session = Depends(get_db)):
    notes = db.query(NoteModel).filter(NoteModel.case_id == case_id).order_by(NoteModel.created_at.desc()).all()
    return [
        {
            "id": str(n.id),
            "author": n.author,
            "content": n.content,
            "tag": n.tag,
            "createdAt": n.created_at.isoformat() + "Z",
        }
        for n in notes
    ]

@router.post("/cases/{case_id}/notes")
def add_case_note(
    case_id: str,
    req: CreateNoteRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    note = NoteModel(
        case_id=case_id,
        author=req.author or user.id,
        content=req.content,
        tag=req.tag,
        created_at=datetime.utcnow(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": str(note.id),
        "author": note.author,
        "content": note.content,
        "tag": note.tag,
        "createdAt": note.created_at.isoformat() + "Z",
    }

@router.get("/cases/{case_id}/str-draft")
def get_str_draft(case_id: str, db: Session = Depends(get_db)):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    alt = db.query(AlertModel).filter(AlertModel.id == c.alert_id).first() if c.alert_id else None
    signals_text = "\n".join([f"- {s}" for s in (alt.signals if alt and alt.signals else ["Pass-through velocity anomaly"])])

    draft_narrative = (
        f"SUSPICIOUS TRANSACTION REPORT (STR) — FIU-IND REPORTING DRAFT\n"
        f"Reference: STR-{case_id}\n"
        f"Subject Account: {c.primary_account} ({c.bank_name})\n"
        f"Regulatory Grounds: PMLA Section 12 / RBI Mule Account Directive 2024\n\n"
        f"1. OPERATIONAL SUMMARY:\n"
        f"Subject account {c.primary_account} was detected exhibiting extreme pass-through velocity.\n"
        f"Total amount at risk: INR {c.total_exposed_inr:,.2f}.\n\n"
        f"2. IDENTIFIED HEURISTICS & ANOMALIES:\n"
        f"{signals_text}\n\n"
        f"3. INVESTIGATOR RECOMMENDATION:\n"
        f"Immediate debit freeze confirmed. Recommended for authorized compliance escalation."
    )

    return {
        "caseId": case_id,
        "reference": f"STR-{case_id}",
        "subjectAccount": c.primary_account,
        "bankName": c.bank_name,
        "reportingStatus": "DRAFT_PENDING_REVIEW",
        "narrative": draft_narrative,
        "isSubmitted": bool(c.status == "STR_SUBMITTED"),
    }
