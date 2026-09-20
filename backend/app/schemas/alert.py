from pydantic import BaseModel
from typing import Optional
from app.schemas.common import UtcDatetime
from app.models.enums import AlertKind

class AlertResponse(BaseModel):
    id: int
    incident_id: Optional[int] = None
    kind: AlertKind
    message: str
    acknowledged: bool
    created_at: UtcDatetime

    class Config:
        from_attributes = True