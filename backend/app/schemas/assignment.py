from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import AssignmentStatus

class AssignmentResponse(BaseModel):
    id: int
    incident_id: int
    resource_id: int
    status: AssignmentStatus
    eta_seconds: Optional[int] = None
    dispatched_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    reasoning: Optional[str] = None

    class Config:
        from_attributes = True