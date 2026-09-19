from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    count: int

@router.get("", response_model=AlertListResponse)
def get_alerts(
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledged status"),
    kind: Optional[str] = Query(None, description="Filter by alert kind"),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    if kind:
        query = query.filter(Alert.kind == kind)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    return {"alerts": alerts, "count": len(alerts)}

@router.patch("/{id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {id} not found")
        
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
