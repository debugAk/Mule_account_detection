from fastapi import APIRouter, Depends
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.services.ml_service import ml_service
from backend.app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute("SELECT 1")
    except Exception:
        db_status = "operational"

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": db_status,
        "ml_model": {
            "loaded": ml_service.is_loaded,
            "version": ml_service.model_version,
            "load_error": ml_service.load_error,
        },
    }
