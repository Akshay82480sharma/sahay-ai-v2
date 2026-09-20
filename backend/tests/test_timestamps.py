from datetime import datetime
from app.schemas.incident import IncidentListResponse, IncidentDetailResponse
from app.schemas.report import ReportResponse
from app.schemas.assignment import AssignmentResponse
from app.schemas.alert import AlertResponse
from app.models.enums import IncidentType, IncidentPriority, IncidentStatus, Source, AssignmentStatus, AlertKind

def test_timestamps_end_with_z():
    dt = datetime(2026, 9, 20, 12, 0, 0) # naive

    report = ReportResponse(
        id=1, raw_text="test", source=Source.citizen, created_at=dt
    )
    assert report.model_dump_json().find("2026-09-20T12:00:00Z") != -1

    incident = IncidentListResponse(
        id=1, type=IncidentType.flood, severity=1, priority=IncidentPriority.low, status=IncidentStatus.new,
        confidence=0.5, report_count=1, created_at=dt, updated_at=dt
    )
    assert incident.model_dump_json().find("2026-09-20T12:00:00Z") != -1

    incident_detail = IncidentDetailResponse(
        id=1, type=IncidentType.flood, severity=1, priority=IncidentPriority.low, status=IncidentStatus.new,
        confidence=0.5, report_count=1, created_at=dt, updated_at=dt
    )
    assert incident_detail.model_dump_json().find("2026-09-20T12:00:00Z") != -1

    assignment = AssignmentResponse(
        id=1, incident_id=1, resource_id=1, status=AssignmentStatus.dispatched,
        dispatched_at=dt, arrived_at=dt
    )
    assert assignment.model_dump_json().find("2026-09-20T12:00:00Z") != -1

    alert = AlertResponse(
        id=1, kind=AlertKind.critical, message="test", acknowledged=False, created_at=dt
    )
    assert alert.model_dump_json().find("2026-09-20T12:00:00Z") != -1
