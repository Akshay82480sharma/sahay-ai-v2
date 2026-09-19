from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.enums import IncidentType, IncidentPriority, IncidentStatus
from .report import ReportResponse
from .assignment import AssignmentResponse

class RequiredResource(BaseModel):
    type: str
    count: int

class IncidentListResponse(BaseModel):
    id: int
    type: IncidentType
    severity: int
    priority: IncidentPriority
    status: IncidentStatus
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None
    summary: Optional[str] = None
    confidence: float
    report_count: int
    required_resources: Optional[List[RequiredResource]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IncidentDetailResponse(IncidentListResponse):
    reports: List[ReportResponse] = []
    assignments: List[AssignmentResponse] = []

    class Config:
        from_attributes = True