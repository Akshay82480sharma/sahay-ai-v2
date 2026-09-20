from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from app.schemas.common import UtcDatetime
from app.models.enums import IncidentType, IncidentPriority, IncidentStatus
from .report import ReportResponse
from .assignment import AssignmentResponse
from .audit import AuditLogResponse

class RequiredResource(BaseModel):
    type: str
    count: int

class IncidentListResponse(BaseModel):
    id: int
    type: IncidentType
    severity: int
    priority: IncidentPriority
    score: int
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

    model_config = ConfigDict(from_attributes=True)

class IncidentDetailResponse(IncidentListResponse):
    reports: List[ReportResponse] = []
    assignments: List[AssignmentResponse] = []
    audit_logs: List[AuditLogResponse] = []

    model_config = ConfigDict(from_attributes=True)

class IncidentPaginatedResponse(BaseModel):
    incidents: List[IncidentListResponse]
    count: int