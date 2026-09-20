from pydantic import BaseModel
from typing import Optional, List, Any
from app.schemas.common import UtcDatetime
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
    created_at: UtcDatetime
    updated_at: UtcDatetime

    class Config:
        from_attributes = True

class IncidentDetailResponse(IncidentListResponse):
    reports: List[ReportResponse] = []
    assignments: List[AssignmentResponse] = []

    class Config:
        from_attributes = True

class IncidentPaginatedResponse(BaseModel):
    incidents: List[IncidentListResponse]
    count: int