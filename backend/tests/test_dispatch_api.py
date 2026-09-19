import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import SessionLocal, get_db, Base
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.assignment import Assignment
from app.models.enums import IncidentType, IncidentPriority, IncidentStatus, ResourceType, ResourceStatus, AssignmentStatus
from app.services.dispatcher import get_required_resources
from scripts.seed import seed_if_empty

# Override db_session to use StaticPool so in-memory sqlite doesn't drop tables
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


def setup_test_data(db_session):
    # Incident
    inc = Incident(
        type=IncidentType.fire.value,
        severity=3,
        priority=IncidentPriority.high.value,
        status=IncidentStatus.new.value,
        lat=22.3,
        lng=73.2,
        location_name="Test Loc",
        confidence=0.9,
        report_count=1
    )
    db_session.add(inc)
    
    # Resources
    r1 = Resource(name="F1", type=ResourceType.fire_engine.value, status=ResourceStatus.available.value, lat=22.31, lng=73.21, station="S1")
    r2 = Resource(name="F2", type=ResourceType.fire_engine.value, status=ResourceStatus.available.value, lat=22.32, lng=73.22, station="S2")
    r3 = Resource(name="F3", type=ResourceType.fire_engine.value, status=ResourceStatus.busy.value, lat=22.3, lng=73.2, station="S3")
    r4 = Resource(name="A1", type=ResourceType.ambulance.value, status=ResourceStatus.available.value, lat=22.5, lng=73.5, station="S4") # Far away
    db_session.add_all([r1, r2, r3, r4])
    db_session.commit()
    return inc.id, [r1.id, r2.id, r3.id, r4.id]

def test_recommend_endpoint(client, db_session):
    inc_id, res_ids = setup_test_data(db_session)
    
    response = client.post(f"/incidents/{inc_id}/recommend")
    assert response.status_code == 200
    data = response.json()
    
    assert data["incident_id"] == inc_id
    assert "recommendations" in data
    # Fire severity 3 needs 3 fire_engines and 1 ambulance
    # We only have 2 available fire engines, 1 busy, 1 available ambulance
    assert len(data["recommendations"]) == 3 # 2 fire, 1 amb
    
    # Verify shape
    rec = data["recommendations"][0]
    assert "resource_id" in rec
    assert "eta_seconds" in rec
    assert "reasoning" in rec
    assert len(rec["reasoning"]) > 0
    
    # Mutual aid should be true because A1 is far away (> 8km)
    assert data["mutual_aid"] is True
    assert "No local ambulance available" in data["mutual_aid_reason"]
    
def test_recommend_shortage(client, db_session):
    inc_id, res_ids = setup_test_data(db_session)
    # Make all resources busy
    for r_id in res_ids:
        r = db_session.query(Resource).filter(Resource.id == r_id).first()
        r.status = ResourceStatus.busy.value
    db_session.commit()
    
    response = client.post(f"/incidents/{inc_id}/recommend")
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 0
    
def test_assign_endpoint(client, db_session):
    inc_id, res_ids = setup_test_data(db_session)
    r1_id, r2_id = res_ids[0], res_ids[1]
    
    # Empty list 422
    response = client.post(f"/incidents/{inc_id}/assign", json={"resource_ids": []})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "http_error"
    
    # Assign valid resources
    response = client.post(f"/incidents/{inc_id}/assign", json={"resource_ids": [r1_id, r2_id]})
    assert response.status_code == 201
    data = response.json()
    
    assert data["incident_id"] == inc_id
    assert len(data["assignments"]) == 2
    
    a1 = data["assignments"][0]
    assert a1["status"] == "dispatched"
    assert a1["dispatched_at"].endswith("Z")
    assert a1["reasoning"] is not None
    
    # DB state changes
    inc = db_session.query(Incident).filter(Incident.id == inc_id).first()
    assert inc.status == IncidentStatus.dispatched.value
    
    r1 = db_session.query(Resource).filter(Resource.id == r1_id).first()
    assert r1.status == ResourceStatus.dispatched.value
    
    # Assigning again should be 422 (not available)
    response = client.post(f"/incidents/{inc_id}/assign", json={"resource_ids": [r1_id]})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "http_error"  # core/errors.py overrides code to http_error for 422
    
    # Unknown incident
    response = client.post("/incidents/999/assign", json={"resource_ids": [r1_id]})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    
def test_assignment_lifecycle(client, db_session):
    inc_id, res_ids = setup_test_data(db_session)
    r1_id, r2_id = res_ids[0], res_ids[1]
    
    # Dispatch
    resp = client.post(f"/incidents/{inc_id}/assign", json={"resource_ids": [r1_id, r2_id]})
    data = resp.json()
    a1_id = data["assignments"][0]["id"]
    a2_id = data["assignments"][1]["id"]
    
    # 1. En_route
    resp = client.patch(f"/assignments/{a1_id}", json={"status": "en_route"})
    assert resp.status_code == 200
    
    inc = db_session.query(Incident).filter(Incident.id == inc_id).first()
    assert inc.status == IncidentStatus.in_progress.value
    
    # 2. On_scene
    resp = client.patch(f"/assignments/{a1_id}", json={"status": "on_scene"})
    assert resp.status_code == 200
    assert resp.json()["arrived_at"].endswith("Z")
    
    # 3. Invalid transition (completed -> en_route)
    resp = client.patch(f"/assignments/{a1_id}", json={"status": "completed"})
    assert resp.status_code == 200
    
    resp = client.patch(f"/assignments/{a1_id}", json={"status": "en_route"})
    assert resp.status_code == 422
    
    # Incident should still be in_progress because a2 is not completed
    db_session.refresh(inc)
    assert inc.status == IncidentStatus.in_progress.value
    
    # Complete a2
    client.patch(f"/assignments/{a2_id}", json={"status": "en_route"})
    client.patch(f"/assignments/{a2_id}", json={"status": "on_scene"})
    resp = client.patch(f"/assignments/{a2_id}", json={"status": "completed"})
    
    # Incident should now be resolved
    db_session.refresh(inc)
    assert inc.status == IncidentStatus.resolved.value
    
    # Resource should be available
    r1 = db_session.query(Resource).filter(Resource.id == r1_id).first()
    assert r1.status == ResourceStatus.available.value
    
def test_seed_and_get(client, db_session):
    # Empty db initially
    db_session.query(Resource).delete()
    db_session.commit()
    
    seed_if_empty(db_session)
    # Check count
    count1 = db_session.query(Resource).count()
    assert count1 > 0
    
    # Second time shouldn't duplicate
    seed_if_empty(db_session)
    count2 = db_session.query(Resource).count()
    assert count1 == count2
    
    # Test GET endpoints
    resp_res = client.get("/resources")
    assert resp_res.status_code == 200
    assert resp_res.json()["count"] == count1
    
    resp_fac = client.get("/facilities")
    assert resp_fac.status_code == 200
    assert resp_fac.json()["count"] > 0
    
def test_dispatcher_requirements_edge_cases():
    types = ["fire", "flood", "accident", "medical", "industrial", "other"]
    severities = [1, 5]
    
    for t in types:
        for s in severities:
            req = get_required_resources(t, s)
            assert isinstance(req, dict)
            assert all(v > 0 for v in req.values())
