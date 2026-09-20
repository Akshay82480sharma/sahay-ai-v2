from pydantic import BaseModel
from typing import Optional
from app.schemas.common import UtcDatetime
from app.models.enums import Source

class ReportCreate(BaseModel):
    text: str
    source: Source
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    raw_text: str
    source: Source
    lat: Optional[float] = None
    lng: Optional[float] = None
    language: Optional[str] = None
    created_at: UtcDatetime
    incident_id: Optional[int] = None

    class Config:
        from_attributes = True