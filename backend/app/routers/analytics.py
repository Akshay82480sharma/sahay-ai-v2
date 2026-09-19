from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.core.database import get_db
from app.schemas.analytics import AnalyticsSummary, ResourceShortage, Hotspot
from app.models.incident import Incident
from app.models.assignment import Assignment
from app.models.resource import Resource
from app.models.enums import IncidentType, IncidentStatus, ResourceType, ResourceStatus
from datetime import timezone

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    # incidents_by_type
    incidents_by_type = {t.value: 0 for t in IncidentType}
    type_counts = db.query(Incident.type, func.count(Incident.id)).group_by(Incident.type).all()
    for t, count in type_counts:
        if t in incidents_by_type:
            incidents_by_type[t] = count
            
    # avg_response_seconds
    # Time from incident created_at to assignment dispatched_at
    assignments = db.query(Assignment, Incident).join(Incident).filter(Assignment.dispatched_at.isnot(None)).all()
    total_sec = 0.0
    valid_count = 0
    for assign, inc in assignments:
        if assign.dispatched_at and inc.created_at:
            # Ensure both are UTC
            d_at = assign.dispatched_at
            if d_at.tzinfo is None:
                d_at = d_at.replace(tzinfo=timezone.utc)
            c_at = inc.created_at
            if c_at.tzinfo is None:
                c_at = c_at.replace(tzinfo=timezone.utc)
                
            diff = (d_at - c_at).total_seconds()
            if diff >= 0:
                total_sec += diff
                valid_count += 1
                
    avg_response = total_sec / valid_count if valid_count > 0 else 0.0
    
    # resource_shortages
    # Return all resource types that exist and their availability, prioritizing those with low availability
    res_stats = db.query(
        Resource.type, 
        func.count(Resource.id).label('total'),
        func.sum(case((Resource.status == ResourceStatus.available.value, 1), else_=0)).label('avail')
    ).group_by(Resource.type).all()
    
    shortages = []
    for r_type, total, avail in res_stats:
        shortages.append(ResourceShortage(type=r_type, available=avail or 0, total=total or 0))
    # Sort so those with lowest available are first
    shortages.sort(key=lambda x: (x.available, -x.total))
    
    # hotspots
    hotspots = []
    hs_query = db.query(Incident.lat, Incident.lng, func.count(Incident.id).label('count')).group_by(Incident.lat, Incident.lng).order_by(func.count(Incident.id).desc()).limit(5).all()
    for lat, lng, count in hs_query:
        if lat is not None and lng is not None:
            hotspots.append(Hotspot(lat=lat, lng=lng, count=count))
            
    # status_counts
    status_counts = {s.value: 0 for s in IncidentStatus}
    sc_query = db.query(Incident.status, func.count(Incident.id)).group_by(Incident.status).all()
    for s, count in sc_query:
        if s in status_counts:
            status_counts[s] = count
            
    return AnalyticsSummary(
        incidents_by_type=incidents_by_type,
        avg_response_seconds=round(avg_response, 1),
        resource_shortages=shortages,
        hotspots=hotspots,
        status_counts=status_counts
    )
