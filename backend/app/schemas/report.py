from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from app.schemas.common import UtcDatetime
from app.models.enums import Source

class ReportCreate(BaseModel):
    text: str = Field(..., max_length=2000)
    source: Source
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    location_name: Optional[str] = None

    @field_validator('text')
    @classmethod
    def check_text_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Text cannot be empty or just whitespace")
        return stripped

class ReportResponse(BaseModel):
    id: int
    raw_text: str
    source: Source
    lat: Optional[float] = None
    lng: Optional[float] = None
    language: Optional[str] = None
    created_at: UtcDatetime
    incident_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)