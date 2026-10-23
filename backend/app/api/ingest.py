import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.db.session import get_db
from backend.app.services.csv_service import csv_service
from backend.app.models import CsvImportModel
from backend.app.core.security import get_current_user, CurrentUser

router = APIRouter()

@router.post("/ingest/csv")
async def upload_csv(
    file: UploadFile = File(...),
    imported_by: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files (.csv) are supported for ingestion.",
        )

    content_bytes = await file.read()
    if len(content_bytes) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum limit of 50MB.",
        )

    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode CSV file. Must be UTF-8 or ASCII encoded.",
            )

    analyst_id = imported_by or user.id or "ANALYST-104"

    try:
        summary = csv_service.ingest_csv(
            file_content=content_str,
            filename=file.filename,
            imported_by=analyst_id,
            db=db,
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CSV processing error: {str(e)}",
        )

@router.get("/ingest/history")
def get_ingest_history(db: Session = Depends(get_db)):
    records = db.query(CsvImportModel).order_by(CsvImportModel.created_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "format": r.file_format,
            "totalRows": r.total_rows,
            "acceptedRows": r.accepted_rows,
            "rejectedRows": r.rejected_rows,
            "duplicateRows": r.duplicate_rows,
            "createdAlerts": r.created_alerts_count,
            "importedBy": r.imported_by,
            "createdAt": r.created_at.isoformat() + "Z",
        }
        for r in records
    ]

@router.get("/ingest/sample/{sample_type}")
def download_sample_csv(sample_type: str):
    if sample_type == "transactions":
        file_path = "sample_data/transactions_sample.csv"
        filename = "synthetic_transactions_sample.csv"
    elif sample_type == "soa":
        file_path = "sample_data/soa_sample.csv"
        filename = "synthetic_soa_sample.csv"
    else:
        raise HTTPException(status_code=404, detail="Invalid sample type. Use 'transactions' or 'soa'.")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found on disk.")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
