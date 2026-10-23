from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.db.session import get_db
from backend.app.services.graph_service import graph_service

router = APIRouter()

@router.get("/graph/network")
def get_graph_network(
    account_id: Optional[str] = None,
    min_amount: float = Query(0.0, ge=0.0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    return graph_service.get_network_graph(
        db=db,
        focus_account=account_id,
        min_amount=min_amount,
        limit_edges=limit,
    )
