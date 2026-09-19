from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import AlertKind

class AlertResponse(BaseModel):
    id: int
    incident_id: Optional[int] = None
    kind: AlertKind
    message: str
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True