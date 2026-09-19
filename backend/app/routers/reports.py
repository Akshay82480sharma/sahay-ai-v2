from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.incident import IncidentListResponse
from app.models.report import Report
from app.models.incident import Incident
from app.services.classifier import classify
from app.services.events import broadcast_nowait
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportCreateResponse(BaseModel):
    report: ReportResponse
    incident: IncidentListResponse

@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    # 1. Classify the report text
    try:
        classification = classify(report_in.text, report_in.source)
    except Exception as e:
        logger.error(f"Classification failed completely: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")
        
    if classification.get("is_likely_false"):
        # If it's fake, we could just save the report without an incident
        # But for the thin slice, let's just make an incident anyway, or skip it.
        # Spec doesn't say. Let's create an incident with status 'resolved' maybe?
        # Actually, let's just create the incident normally for now to ensure flow works,
        # or maybe raise 400? Let's just create it.
        pass

    # 2. Create Incident
    incident = Incident(
        type=classification["type"],
        severity=classification["severity"],
        priority=classification.get("priority", "low"),
        status="new",
        lat=report_in.lat,
        lng=report_in.lng,
        location_name=classification.get("location_name") or report_in.location_name,
        summary=classification["summary"],
        confidence=1.0,
        report_count=1,
        required_resources=classification.get("required_resources", [])
    )
    db.add(incident)
    db.flush() # Get incident.id
    
    # 3. Create Report
    report = Report(
        raw_text=report_in.text,
        source=report_in.source,
        lat=report_in.lat,
        lng=report_in.lng,
        language=classification.get("language"),
        incident_id=incident.id
    )
    db.add(report)
    db.commit()
    db.refresh(incident)
    db.refresh(report)
    
    # 4. Broadcast event
    incident_dict = IncidentListResponse.model_validate(incident).model_dump(mode='json')
    broadcast_nowait("incident_created", incident_dict)
    
    return {"report": report, "incident": incident}