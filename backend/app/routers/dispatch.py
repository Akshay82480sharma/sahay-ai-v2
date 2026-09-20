from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.assignment import Assignment
from app.models.enums import IncidentStatus, ResourceStatus, AssignmentStatus
from app.services import dispatcher
from app.services import events
from app.utils.timeutil import utcnow, format_iso8601_z

router = APIRouter(prefix="/incidents", tags=["Dispatch"])

class AssignRequest(BaseModel):
    resource_ids: List[int]

class RecommendationResponse(BaseModel):
    incident_id: int
    recommendations: List[Dict[str, Any]]
    mutual_aid: bool
    mutual_aid_reason: Optional[str] = None

@router.post("/{id}/recommend", response_model=RecommendationResponse)
def recommend_resources(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    return dispatcher.recommend(db, incident)

@router.post("/{id}/assign", status_code=status.HTTP_201_CREATED)
def assign_resources(id: int, req: AssignRequest, db: Session = Depends(get_db)):
    if not req.resource_ids:
        raise HTTPException(status_code=422, detail="Empty resource_ids list.")
        
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    now = utcnow()
    
    # Get recommendation to populate ETA and reasoning
    rec_result = dispatcher.recommend(db, incident)
    rec_map = {r["resource_id"]: r for r in rec_result.get("recommendations", [])}
    
    assignments_created = []
    
    for r_id in req.resource_ids:
        resource = db.query(Resource).filter(Resource.id == r_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail=f"Resource {r_id} not found.")
        
        if resource.status != ResourceStatus.available:
            raise HTTPException(
                status_code=422, 
                detail=f"Resource {r_id} is not available."
            )
            
        # Extract ETA/reasoning if it was in the recommendation
        rec_data = rec_map.get(r_id, {})
        eta = rec_data.get("eta_seconds")
        reasoning = rec_data.get("reasoning", "Manual override or not recommended.")
        
        # Create assignment
        assignment = Assignment(
            incident_id=incident.id,
            resource_id=resource.id,
            status=AssignmentStatus.dispatched.value,
            eta_seconds=eta,
            dispatched_at=now,
            reasoning=reasoning
        )
        db.add(assignment)
        
        # Update resource status
        resource.status = ResourceStatus.dispatched.value
        
        assignments_created.append(assignment)
        
    # Update incident status
    incident.status = IncidentStatus.dispatched.value
    incident.updated_at = now
    
    # Audit log
    from app.models.audit import AuditLog
    audit = AuditLog(
        incident_id=incident.id,
        action="RESOURCE_DISPATCHED",
        actor="HUMAN_OPERATOR",
        details={
            "resource_ids": req.resource_ids
        }
    )
    db.add(audit)
    
    db.commit()
    
    # Refresh to get IDs for events
    for a in assignments_created:
        db.refresh(a)
    
    db.refresh(incident)
    
    # Emit events
    events.broadcast_nowait("incident_updated", {
        "id": incident.id,
        "status": incident.status,
        "updated_at": format_iso8601_z(incident.updated_at)
    })
    
    assignment_responses = []
    for a in assignments_created:
        # Also broadcast resource update
        resource = db.query(Resource).filter(Resource.id == a.resource_id).first()
        events.broadcast_nowait("resource_updated", {
            "id": resource.id,
            "status": resource.status
        })
        
        a_dict = {
            "id": a.id,
            "incident_id": a.incident_id,
            "resource_id": a.resource_id,
            "status": a.status,
            "eta_seconds": a.eta_seconds,
            "dispatched_at": format_iso8601_z(a.dispatched_at) if a.dispatched_at else None,
            "arrived_at": format_iso8601_z(a.arrived_at) if a.arrived_at else None,
            "reasoning": a.reasoning
        }
        
        events.broadcast_nowait("assignment_updated", a_dict)
        assignment_responses.append(a_dict)
        
    return {
        "incident_id": incident.id,
        "assignments": assignment_responses
    }
