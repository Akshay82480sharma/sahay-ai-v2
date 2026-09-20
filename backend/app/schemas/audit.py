from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.schemas.common import UtcDatetime

class AuditLogResponse(BaseModel):
    id: int
    incident_id: int
    action: str
    actor: str
    details: Optional[Dict[str, Any]] = None
    timestamp: UtcDatetime

    class Config:
        from_attributes = True
