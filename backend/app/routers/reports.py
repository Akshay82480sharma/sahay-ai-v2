from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.incident import IncidentListResponse
from app.models.report import Report
from app.models.incident import Incident
from app.models.audit import AuditLog
from app.services.classifier import classify
from app.services.events import broadcast_nowait
from app.services.geocode import geocode_location
from app.utils.geo import haversine_km
from pydantic import BaseModel
from datetime import datetime, timezone
import logging
from app.models.enums import Source

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportCreateResponse(BaseModel):
    report: ReportResponse
    incident: IncidentListResponse

MERGE_RADIUS_KM = 2.0

def calculate_emergency_score(severity: int, report_count: int, req_res: list) -> tuple[int, str]:
    # severity (1-5) -> 40% of score
    # report_count (1-10+) -> 30% of score
    # required_resources (0-5+) -> 30% of score
    s_score = (severity / 5) * 40
    r_score = min(report_count / 10, 1.0) * 30
    c_score = min(len(req_res) / 4, 1.0) * 30
    
    total = int(s_score + r_score + c_score)
    
    if total >= 80:
        priority = "critical"
    elif total >= 60:
        priority = "high"
    elif total >= 40:
        priority = "medium"
    else:
        priority = "low"
        
    return min(total, 100), priority

def create_report_from_text(
    db: Session, 
    text: str, 
    source: Source, 
    lat: float | None = None, 
    lng: float | None = None, 
    location_name: str | None = None
) -> tuple[Report, Incident]:
    # 1. Classify the report text
    try:
        classification = classify(text, source.value if isinstance(source, Source) else source)
    except Exception as e:
        logger.error(f"Classification failed completely: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")
        
    if classification.get("is_likely_false"):
        pass

    # 1.5 Geocode if lat/lng are missing
    loc_name = classification.get("location_name") or location_name
    
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
        
        # Recalculate deterministic score
        score, new_priority = calculate_emergency_score(
            matched_incident.severity, 
            matched_incident.report_count, 
            matched_incident.required_resources or []
        )
        matched_incident.score = score
        if matched_incident.priority != "critical":
            matched_incident.priority = new_priority
            
        matched_incident.updated_at = datetime.now(timezone.utc)
        incident = matched_incident
        is_new = False
    else:
        req_res = classification.get("required_resources", [])
        score, priority = calculate_emergency_score(classification["severity"], 1, req_res)
        
        # Create new Incident
        incident = Incident(
            type=classification["type"],
            severity=classification["severity"],
            priority=priority,
            score=score,
            status="new",
            lat=lat,
            lng=lng,
            location_name=loc_name,
            summary=classification["summary"],
            confidence=0.6,
            report_count=1,
            required_resources=req_res
        )
        db.add(incident)
        db.flush() # Get incident.id
        is_new = True
    
    # 3. Create Report
    report = Report(
        raw_text=text,
        source=source,
        lat=lat,
        lng=lng,
        language=classification.get("language"),
        incident_id=incident.id
    )
    db.add(report)
    
    # 3.5 Create Audit Log
    action_type = "INCIDENT_CREATED" if is_new else "REPORT_MERGED"
    details = {
        "source": source.value if hasattr(source, 'value') else str(source),
        "score": incident.score,
        "confidence": incident.confidence
    }
    audit = AuditLog(
        incident_id=incident.id,
        action=action_type,
        actor="AI_CLASSIFIER",
        details=details
    )
    db.add(audit)
    
    db.commit()
    db.refresh(incident)
    db.refresh(report)
    
    # 4. Broadcast event
    incident_dict = IncidentListResponse.model_validate(incident).model_dump(mode='json')
    if is_new:
        broadcast_nowait("incident_created", incident_dict)
    else:
        broadcast_nowait("incident_updated", incident_dict)
    
    return report, incident

@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    report, incident = create_report_from_text(
        db=db,
        text=report_in.text,
        source=report_in.source,
        lat=report_in.lat,
        lng=report_in.lng,
        location_name=report_in.location_name
    )
    return {"report": report, "incident": incident}