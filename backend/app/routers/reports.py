from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.incident import IncidentListResponse
from app.models.report import Report
from app.models.incident import Incident
from app.services.classifier import classify
from app.services.events import broadcast_nowait
from app.services.geocode import geocode_location
from app.utils.geo import haversine_km
from pydantic import BaseModel
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportCreateResponse(BaseModel):
    report: ReportResponse
    incident: IncidentListResponse

MERGE_RADIUS_KM = 2.0

@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    # 1. Classify the report text
    try:
        classification = classify(report_in.text, report_in.source)
    except Exception as e:
        logger.error(f"Classification failed completely: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")
        
    if classification.get("is_likely_false"):
        pass

    # 1.5 Geocode if lat/lng are missing
    lat = report_in.lat
    lng = report_in.lng
    loc_name = classification.get("location_name") or report_in.location_name
    
    if (lat is None or lng is None) and loc_name:
        coords = geocode_location(loc_name)
        if coords:
            lat, lng = coords

    # 2. Deduplication check
    # Find all active incidents of the same type
    active_incidents = db.query(Incident).filter(
        Incident.status != "resolved",
        Incident.type == classification["type"]
    ).all()
    
    matched_incident = None
    if lat is not None and lng is not None:
        for inc in active_incidents:
            if inc.lat is not None and inc.lng is not None:
                dist = haversine_km(lat, lng, inc.lat, inc.lng)
                if dist <= MERGE_RADIUS_KM:
                    matched_incident = inc
                    break

    if matched_incident:
        # Merge with existing incident
        matched_incident.report_count += 1
        matched_incident.confidence = min(1.0, matched_incident.confidence + 0.15)
        if classification["severity"] > matched_incident.severity:
            matched_incident.severity = classification["severity"]
        
        # Optionally append to summary if it's getting more critical, but for now just update timestamp
        matched_incident.updated_at = datetime.now(timezone.utc)
        incident = matched_incident
        is_new = False
    else:
        # Create new Incident
        incident = Incident(
            type=classification["type"],
            severity=classification["severity"],
            priority=classification.get("priority", "low"),
            status="new",
            lat=lat,
            lng=lng,
            location_name=loc_name,
            summary=classification["summary"],
            confidence=0.6, # Start lower since it's only 1 report
            report_count=1,
            required_resources=classification.get("required_resources", [])
        )
        db.add(incident)
        db.flush() # Get incident.id
        is_new = True
    
    # 3. Create Report
    report = Report(
        raw_text=report_in.text,
        source=report_in.source,
        lat=lat,
        lng=lng,
        language=classification.get("language"),
        incident_id=incident.id
    )
    db.add(report)
    db.commit()
    db.refresh(incident)
    db.refresh(report)
    
    # 4. Broadcast event
    incident_dict = IncidentListResponse.model_validate(incident).model_dump(mode='json')
    if is_new:
        broadcast_nowait("incident_created", incident_dict)
    else:
        broadcast_nowait("incident_updated", incident_dict)
    
    return {"report": report, "incident": incident}