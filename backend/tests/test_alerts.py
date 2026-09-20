import pytest
from datetime import datetime, timezone, timedelta
from app.services.alerts import run_checks
from app.models.incident import Incident
from app.models.alert import Alert
from app.models.enums import IncidentStatus, IncidentPriority
from app.core.database import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

engine = create_engine(
    "sqlite:///:memory:", 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_alerts_logic(db_session):
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    
    # Create an incident that's critical and unassigned
    inc = Incident(
        type="flood",
        severity=5,
        priority=IncidentPriority.critical.value,
        status=IncidentStatus.new.value,
        lat=0.0, lng=0.0, location_name="Test",
        summary="Test",
        confidence=1.0,
        report_count=1,
        created_at=now,
        updated_at=now
    )
    db_session.add(inc)
    db_session.commit()
    
    # 1. None before the threshold
    alerts = run_checks(db_session, now)
    assert len(alerts) == 0
    
    # 2. Exactly one after threshold (120s for critical)
    later = now + timedelta(seconds=121)
    alerts = run_checks(db_session, later)
    assert len(alerts) == 1
    assert alerts[0].kind == "critical"
    
    # 3. No duplicates on repeat runs
    alerts_repeat = run_checks(db_session, later)
    assert len(alerts_repeat) == 0
    
    # 4. Escalation for unacknowledged alerts
    # Escalation is > 180s from the alert's created_at (which is `later` = now + 121)
    much_later = later + timedelta(seconds=181) # This is now + 302
    alerts_esc = run_checks(db_session, much_later)
    
    kinds = [a.kind for a in alerts_esc]
    assert "escalation" in kinds
    # At now + 302s, incident hasn't been updated for > 300s, so we also expect a 'delayed' alert
    assert "delayed" in kinds
    assert len(alerts_esc) == 2
    
    # 5. None for acknowledged ones
    # Let's acknowledge all alerts
    all_alerts = db_session.query(Alert).all()
    for a in all_alerts:
        a.acknowledged = True
    db_session.commit()
    
    even_later = much_later + timedelta(seconds=181)
    alerts_after_ack = run_checks(db_session, even_later)
    
    # Since all alerts were acknowledged, no new escalations.
    # The incident delayed alert was already created, no duplicate.
    assert len(alerts_after_ack) == 0

import asyncio
from app.services.alerts import alert_loop
from unittest.mock import MagicMock

@pytest.mark.asyncio
async def test_alert_loop_integration(db_session, monkeypatch):
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    inc = Incident(type='flood', severity=5, priority=IncidentPriority.critical.value, status=IncidentStatus.new.value, lat=0.0, lng=0.0, location_name='Test', summary='Test', confidence=1.0, report_count=1, created_at=now, updated_at=now)
    db_session.add(inc)
    db_session.commit()
    
    mock_notify = MagicMock()
    monkeypatch.setattr('app.services.alerts.notify_alert', mock_notify)
    mock_broadcast = MagicMock()
    monkeypatch.setattr('app.services.alerts.broadcast_nowait', mock_broadcast)
    
    # Make datetime.now return a time that triggers an alert
    class MockDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return now + timedelta(seconds=121)
    monkeypatch.setattr('app.services.alerts.datetime', MockDatetime)
    
    # Run the loop briefly
    task = asyncio.create_task(alert_loop(lambda: db_session, interval=0.1))
    await asyncio.sleep(0.2)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    assert mock_notify.call_count == 1
    assert mock_broadcast.call_count == 1
    
    # Now acknowledge the alert
    alert = db_session.query(Alert).first()
    alert.acknowledged = True
    db_session.commit()
    
    # reset mocks
    mock_notify.reset_mock()
    mock_broadcast.reset_mock()
    
    # Run loop again, no new alerts
    task = asyncio.create_task(alert_loop(lambda: db_session, interval=0.1))
    await asyncio.sleep(0.2)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    assert mock_notify.call_count == 0
    assert mock_broadcast.call_count == 0
    
    # Test exception in notifier doesn't crash the loop
    mock_notify.side_effect = Exception('boom')
    # We need a new alert to trigger the notifier again
    db_session.delete(alert)
    db_session.commit()
    
    task = asyncio.create_task(alert_loop(lambda: db_session, interval=0.1))
    await asyncio.sleep(0.2)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    assert mock_notify.call_count > 0
    assert mock_broadcast.call_count > 0

from app.models.assignment import Assignment
from app.models.enums import AssignmentStatus
from app.services.alerts import (
    ALERT_CRITICAL_UNASSIGNED_SECONDS,
    ALERT_NOT_EN_ROUTE_SECONDS,
    ALERT_NO_UPDATE_SECONDS
)

def test_alert_threshold_boundaries(db_session):
    # Test boundary of 3 critical thresholds
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    
    # 1. Critical Unassigned
    inc_unassigned = Incident(
        type="flood", severity=5, priority=IncidentPriority.critical.value,
        status=IncidentStatus.new.value, lat=0.0, lng=0.0, location_name="Test",
        summary="Test", confidence=1.0, report_count=1, created_at=now, updated_at=now
    )
    
    # 2. Not En Route (Dispatched)
    inc_dispatched = Incident(
        type="flood", severity=5, priority=IncidentPriority.medium.value,
        status=IncidentStatus.dispatched.value, lat=0.0, lng=0.0, location_name="Test",
        summary="Test", confidence=1.0, report_count=1, created_at=now, updated_at=now
    )
    db_session.add(inc_unassigned)
    db_session.add(inc_dispatched)
    db_session.commit()
    
    assign = Assignment(
        incident_id=inc_dispatched.id, resource_id=1,
        status=AssignmentStatus.dispatched.value,
        dispatched_at=now
    )
    db_session.add(assign)
    db_session.commit()
    
    # At exact threshold - no alerts should fire
    # unassigned threshold
    run_now = now + timedelta(seconds=ALERT_CRITICAL_UNASSIGNED_SECONDS)
    alerts = run_checks(db_session, run_now)
    assert len(alerts) == 0, "No alerts at exact unassigned threshold"
    
    # at threshold + 1 -> should fire unassigned
    run_now = now + timedelta(seconds=ALERT_CRITICAL_UNASSIGNED_SECONDS + 1)
    alerts = run_checks(db_session, run_now)
    # Check that "critical" alert is there for inc_unassigned
    assert len([a for a in alerts if a.incident_id == inc_unassigned.id and a.kind == "critical"]) == 1
    
    # 2. Not En-Route threshold
    run_now = now + timedelta(seconds=ALERT_NOT_EN_ROUTE_SECONDS)
    # This also hits No update threshold if ALERT_NO_UPDATE_SECONDS was smaller, but it's 300.
    alerts = run_checks(db_session, run_now)
    # The first run_checks already created the unassigned alert, so new_alerts won't have it again
    assert len([a for a in alerts if a.incident_id == inc_dispatched.id and a.kind == "delayed"]) == 0
    
    # at threshold + 1 -> should fire not en-route
    run_now = now + timedelta(seconds=ALERT_NOT_EN_ROUTE_SECONDS + 1)
    alerts = run_checks(db_session, run_now)
    assert len([a for a in alerts if a.incident_id == inc_dispatched.id and a.kind == "delayed"]) == 1
    
    # 3. No Update threshold
    # Wait, the previous runs might have triggered it if we didn't update updated_at. But No Update is 300s.
    run_now = now + timedelta(seconds=ALERT_NO_UPDATE_SECONDS)
    alerts = run_checks(db_session, run_now)
    assert len([a for a in alerts if a.kind == "delayed" and "no updates" in a.message]) == 0
    
    # at threshold + 1 -> should fire no update
    run_now = now + timedelta(seconds=ALERT_NO_UPDATE_SECONDS + 1)
    alerts = run_checks(db_session, run_now)
    # Should fire for BOTH incidents, as neither was updated
    delayed_alerts = [a for a in alerts if a.kind == "delayed" and "no updates" in a.message]
    assert len(delayed_alerts) == 2
