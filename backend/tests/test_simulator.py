import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import asyncio
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.database import SessionLocal, get_db, Base
from app.models.incident import Incident
from app.models.report import Report
from scripts.seed import seed_if_empty

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

def test_simulate_flood_and_reset(client, db_session, monkeypatch):
    monkeypatch.setenv("SIMULATOR_ENABLED", "true")
    monkeypatch.setenv("ADMIN_TOKEN", "test_admin")
    headers = {"admin-token": "test_admin"}
    
    # Ensure starting clean
    client.post("/simulate/reset", headers=headers)
    
    assert db_session.query(Report).count() == 0
    assert db_session.query(Incident).count() == 0
    
    # We will mock httpx.AsyncClient.post so it directly calls our TestClient!
    async def mock_post(self, url, *args, json=None, **kwargs):
        # Call the local test client
        resp = client.post(url, json=json, headers=headers)
        # Mock httpx response enough to pass resp.raise_for_status()
        mock_resp = AsyncMock()
        mock_resp.status_code = resp.status_code
        mock_resp.raise_for_status = lambda: None if resp.status_code < 400 else Exception("HTTP Error")
        return mock_resp

    with patch("httpx.AsyncClient.post", new=mock_post):
        # Run simulation at extremely high speed
        resp = client.post("/simulate/flood?speed=1000.0", headers=headers)
        assert resp.status_code == 200
        
        # TestClient runs BackgroundTasks synchronously, so by the time 
        # it returns, all httpx calls should have been made!
        reports_count = db_session.query(Report).count()
        incidents_count = db_session.query(Incident).count()
        
        assert reports_count == 16, f"Expected 16 reports, got {reports_count}"
        
        # TODO: tighten this assertion to about 3 incidents once dedupe lands
        assert incidents_count == 3, f"Expected 3 incidents, got {incidents_count}"
        
    # Reset
    resp = client.post("/simulate/reset", headers=headers)
    assert resp.status_code == 200
    
    assert db_session.query(Report).count() == 0
    assert db_session.query(Incident).count() == 0

def test_simulate_unauthorized(client, monkeypatch):
    monkeypatch.setenv("SIMULATOR_ENABLED", "true")
    monkeypatch.setenv("ADMIN_TOKEN", "test_admin")
    
    # Missing token -> 422 Unprocessable Entity (because Header is required)
    # Wait, FastAPI might return 422 if header is missing. Let's check without token.
    resp = client.post("/simulate/start")
    assert resp.status_code == 422
    
    # Wrong token -> 401
    resp = client.post("/simulate/start", headers={"admin-token": "wrong_token"})
    assert resp.status_code == 401
    
    # Disabled -> 403
    monkeypatch.setenv("SIMULATOR_ENABLED", "false")
    resp = client.post("/simulate/start", headers={"admin-token": "test_admin"})
    assert resp.status_code == 403
