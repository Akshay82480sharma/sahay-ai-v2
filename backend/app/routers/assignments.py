from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.database import get_db
from app.models.assignment import Assignment
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.enums import AssignmentStatus, IncidentStatus, ResourceStatus
from app.services import events

router = APIRouter(prefix="/assignments", tags=["Assignments"])

class AssignmentUpdate(BaseModel):
    status: AssignmentStatus

@router.patch("/{id}")
def update_assignment(id: int, req: AssignmentUpdate, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
        
    now = datetime.now(timezone.utc)
    old_status = assignment.status
    
    # Validate transition
    if req.status == old_status:
        # No-op
        pass
    else:
        assignment.status = req.status.value
        
        if req.status == AssignmentStatus.on_scene:
            assignment.arrived_at = now
            
        resource = db.query(Resource).filter(Resource.id == assignment.resource_id).first()
        incident = db.query(Incident).filter(Incident.id == assignment.incident_id).first()
        
        # If completed, free the resource
        if req.status == AssignmentStatus.completed:
            if resource:
                resource.status = ResourceStatus.available.value
                events.broadcast_nowait("resource_updated", {
                    "id": resource.id,
                    "status": resource.status
                })
                
        # Move incident to in_progress if an assignment is en_route or on_scene
        if req.status in [AssignmentStatus.en_route, AssignmentStatus.on_scene]:
            if incident.status == IncidentStatus.dispatched.value:
                incident.status = IncidentStatus.in_progress.value
                incident.updated_at = now
                events.broadcast_nowait("incident_updated", {
                    "id": incident.id,
                    "status": incident.status,
                    "updated_at": incident.updated_at.isoformat()
                })
                
        # If this assignment completed, check if ALL assignments for this incident are completed
        if req.status == AssignmentStatus.completed:
            all_assignments = db.query(Assignment).filter(Assignment.incident_id == incident.id).all()
            if all(a.status == AssignmentStatus.completed.value for a in all_assignments):
                incident.status = IncidentStatus.resolved.value
                incident.updated_at = now
                events.broadcast_nowait("incident_updated", {
                    "id": incident.id,
                    "status": incident.status,
                    "updated_at": incident.updated_at.isoformat()
                })

    db.commit()
    db.refresh(assignment)
    
    a_dict = {
        "id": assignment.id,
        "incident_id": assignment.incident_id,
        "resource_id": assignment.resource_id,
        "status": assignment.status,
        "eta_seconds": assignment.eta_seconds,
        "dispatched_at": assignment.dispatched_at.isoformat() if assignment.dispatched_at else None,
        "arrived_at": assignment.arrived_at.isoformat() if assignment.arrived_at else None,
        "reasoning": assignment.reasoning
    }
    
    events.broadcast_nowait("assignment_updated", a_dict)
    
    return a_dict
