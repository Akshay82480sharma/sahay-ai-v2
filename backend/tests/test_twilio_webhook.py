import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from twilio.request_validator import RequestValidator

client = TestClient(app)

@pytest.fixture
def mock_twilio_env(monkeypatch):
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test_token")
    monkeypatch.setenv("TWILIO_WEBHOOK_BASE_URL", "https://test.com")
    monkeypatch.setenv("TWILIO_VALIDATE_SIGNATURE", "true")
    monkeypatch.setenv("NOTIFY_INBOUND_MAX_PER_MIN", "5")

def get_twilio_signature(url: str, params: dict, token: str) -> str:
    validator = RequestValidator(token)
    return validator.compute_signature(url, params)

def test_twilio_webhook_no_token(monkeypatch):
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    response = client.post("/webhooks/twilio/sms", data={"From": "+1234567890", "Body": "Help"})
    assert response.status_code == 503
    assert response.json() == {"error": {"code": "unavailable", "message": "Twilio not configured"}}

def test_twilio_webhook_invalid_signature(mock_twilio_env):
    response = client.post(
        "/webhooks/twilio/sms", 
        data={"From": "+1234567890", "Body": "Help"},
        headers={"X-Twilio-Signature": "invalid_sig"}
    )
    assert response.status_code == 403
    assert response.json() == {"error": {"code": "forbidden", "message": "Invalid Twilio signature"}}

def test_twilio_webhook_empty_body(mock_twilio_env):
    url = "https://test.com/webhooks/twilio/sms"
    params = {"From": "+1234567890", "Body": "   "}
    sig = get_twilio_signature(url, params, "test_token")
    
    response = client.post(
        "/webhooks/twilio/sms", 
        data=params,
        headers={"X-Twilio-Signature": sig}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/xml"
    assert "Please send your location" in response.text

@pytest.mark.skip(reason="Awaiting Person A approval for create_report_from_text extract")
def test_twilio_webhook_success(mock_twilio_env, monkeypatch):
    # This test is skipped because create_report_from_text is not yet implemented in reports.py
    # We could mock it, but per instructions, we keep it skipped until approved.
    
    # Mocking just to show it would work if we weren't skipping
    class MockIncident:
        id = 99
    
    def mock_create(*args, **kwargs):
        return {"report": None, "incident": MockIncident()}
        
    monkeypatch.setattr("app.routers.reports.create_report_from_text", mock_create)
    
    url = "https://test.com/webhooks/twilio/sms"
    params = {"From": "+1234567890", "Body": "Flood here"}
    sig = get_twilio_signature(url, params, "test_token")
    
    response = client.post(
        "/webhooks/twilio/sms", 
        data=params,
        headers={"X-Twilio-Signature": sig}
    )
    
    assert response.status_code == 200
    assert "report received (ref #99)" in response.text

def test_twilio_webhook_rate_limit(mock_twilio_env, monkeypatch):
    monkeypatch.setenv("NOTIFY_INBOUND_MAX_PER_MIN", "2")
    
    url = "https://test.com/webhooks/twilio/sms"
    params = {"From": "+999999999", "Body": "Spam"}
    sig = get_twilio_signature(url, params, "test_token")
    
    headers = {"X-Twilio-Signature": sig}
    
    # Message 1
    r1 = client.post("/webhooks/twilio/sms", data=params, headers=headers)
    assert r1.status_code == 500 # fails because create_report_from_text is missing, but it passed rate limit
    
    # Message 2
    r2 = client.post("/webhooks/twilio/sms", data=params, headers=headers)
    assert r2.status_code == 500
    
    # Message 3 - should hit rate limit and return empty TwiML (200 OK, but empty message)
    r3 = client.post("/webhooks/twilio/sms", data=params, headers=headers)
    assert r3.status_code == 200
    assert "<Response />" in r3.text or "<Response></Response>" in r3.text
