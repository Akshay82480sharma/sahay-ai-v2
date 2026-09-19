import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import SessionLocal, get_db, Base
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.enums import IncidentStatus, ResourceStatus
from scripts.seed import seed_if_empty

# Setup testing DB
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

def test_full_integration_flow(client, db_session):
    # 1. Seed resources
    seed_if_empty(db_session)
    
    # 2. POST /reports with a fire report in Hinglish near Alkapuri
    report_payload = {
        "text": "Alkapuri me aag lag gayi hai, jaldi aao",
        "source": "citizen",
        "lat": 22.31,
        "lng": 73.17,
        "location_name": "Alkapuri"
    }
    resp = client.post("/reports", json=report_payload)
    
    # Check if the endpoint exists (Person A's work)
    assert resp.status_code != 404, "POST /reports endpoint is missing or returns 404"
    assert resp.status_code == 201
    
    data = resp.json()
    incident_id = data["incident"]["id"]
    
    # 3. Find the incident through GET /incidents
    resp = client.get("/incidents")
    assert resp.status_code != 404, "GET /incidents endpoint is missing"
    assert resp.status_code == 200
    
    # and GET /incidents/{id}
    resp = client.get(f"/incidents/{incident_id}")
    assert resp.status_code != 404, f"GET /incidents/{incident_id} endpoint is missing"
    assert resp.status_code == 200
    
    # 4. Recommend resources
    resp = client.post(f"/incidents/{incident_id}/recommend")
    assert resp.status_code == 200
    rec_data = resp.json()
    assert len(rec_data["recommendations"]) > 0
    rec_ids = [r["resource_id"] for r in rec_data["recommendations"]]
    
    # 5. Assign resources
    resp = client.post(f"/incidents/{incident_id}/assign", json={"resource_ids": rec_ids})
    assert resp.status_code == 201
    assign_data = resp.json()
    assignments = assign_data["assignments"]
    assert len(assignments) == len(rec_ids)
    
    # 6. PATCH the assignment through en_route, on_scene, completed
    for assignment in assignments:
        a_id = assignment["id"]
        # en_route
        resp = client.patch(f"/assignments/{a_id}", json={"status": "en_route"})
        assert resp.status_code == 200
        # on_scene
        resp = client.patch(f"/assignments/{a_id}", json={"status": "on_scene"})
        assert resp.status_code == 200
        # completed
        resp = client.patch(f"/assignments/{a_id}", json={"status": "completed"})
        assert resp.status_code == 200
        
    # 7. Assert incident ends resolved and resources return to available
    incident = db_session.query(Incident).filter(Incident.id == incident_id).first()
    assert incident.status == IncidentStatus.resolved.value
    
    for r_id in rec_ids:
        resource = db_session.query(Resource).filter(Resource.id == r_id).first()
        assert resource.status == ResourceStatus.available.value
