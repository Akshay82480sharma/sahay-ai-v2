from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.schemas.common import UtcDatetime
from app.models.enums import AssignmentStatus

class AssignmentResponse(BaseModel):
    id: int
    incident_id: int
    resource_id: int
    status: AssignmentStatus
    eta_seconds: Optional[int] = None
    dispatched_at: Optional[UtcDatetime] = None
    arrived_at: Optional[UtcDatetime] = None
    reasoning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)