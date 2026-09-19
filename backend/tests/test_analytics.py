import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
from app.main import app
from app.core.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.models.incident import Incident
from app.models.assignment import Assignment
from app.models.resource import Resource
from app.models.enums import IncidentType, IncidentStatus, IncidentPriority, ResourceType, ResourceStatus

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

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

def test_analytics_summary(client, db_session):
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    
    # 1. Incidents
    inc1 = Incident(
        type=IncidentType.flood.value,
        severity=4,
        priority=IncidentPriority.high.value,
        status=IncidentStatus.new.value,
        lat=22.3072, lng=73.1812, location_name="A",
        summary="A",
        confidence=1.0,
        report_count=1,
        created_at=now - timedelta(minutes=10)
    )
    inc2 = Incident(
        type=IncidentType.fire.value,
        severity=5,
        priority=IncidentPriority.critical.value,
        status=IncidentStatus.dispatched.value,
        lat=22.3072, lng=73.1812, location_name="A", # Same location as inc1 to test hotspots
        summary="B",
        confidence=1.0,
        report_count=1,
        created_at=now - timedelta(minutes=5)
    )
    db_session.add(inc1)
    db_session.add(inc2)
    db_session.commit()
    
    # 2. Resources
    res1 = Resource(
        name="RB-1",
        type=ResourceType.rescue_boat.value,
        status=ResourceStatus.available.value,
        lat=0.0, lng=0.0, station="Station 1", capacity=1
    )
    res2 = Resource(
        name="AMB-1",
        type=ResourceType.ambulance.value,
        status=ResourceStatus.dispatched.value,
        lat=0.0, lng=0.0, station="Station 1", capacity=1
    )
    db_session.add(res1)
    db_session.add(res2)
    db_session.commit()
    
    # 3. Assignment
    assign1 = Assignment(
        incident_id=inc2.id,
        resource_id=res2.id,
        status="dispatched",
        dispatched_at=now - timedelta(minutes=1) # Diff is 4 minutes (240s) from inc2 created_at
    )
    db_session.add(assign1)
    db_session.commit()
    
    # Call endpoint
    response = client.get("/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    
    # Check incidents_by_type
    assert data["incidents_by_type"]["flood"] == 1
    assert data["incidents_by_type"]["fire"] == 1
    assert data["incidents_by_type"]["accident"] == 0 # Defaults populated
    
    # Check avg_response_seconds
    assert data["avg_response_seconds"] == 240.0
    
    # Check hotspots
    assert len(data["hotspots"]) == 1
    assert data["hotspots"][0]["lat"] == 22.3072
    assert data["hotspots"][0]["lng"] == 73.1812
    assert data["hotspots"][0]["count"] == 2
    
    # Check status_counts
    assert data["status_counts"]["new"] == 1
    assert data["status_counts"]["dispatched"] == 1
    assert data["status_counts"]["resolved"] == 0
    
    # Check resource_shortages
    ambulance_stat = next(r for r in data["resource_shortages"] if r["type"] == "ambulance")
    assert ambulance_stat["total"] == 1
    assert ambulance_stat["available"] == 0
    
    boat_stat = next(r for r in data["resource_shortages"] if r["type"] == "rescue_boat")
    assert boat_stat["total"] == 1
    assert boat_stat["available"] == 1
