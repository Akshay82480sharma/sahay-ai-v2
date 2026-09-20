import os
import pytest
import logging
from app.services.notifications import send_sms, notify_alert, _hourly_sends, _notified_alerts, recent_messages, get_twilio_client
from unittest.mock import MagicMock
from twilio.base.exceptions import TwilioRestException

class DummyAlert:
    def __init__(self, id, kind, message):
        self.id = id
        self.kind = kind
        self.message = message

@pytest.fixture(autouse=True)
def reset_globals():
    global _hourly_sends
    import app.services.notifications as notif
    notif._hourly_sends = 0
    notif._notified_alerts.clear()
    notif.recent_messages.clear()
    notif._twilio_client = None

@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "test_sid")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test_token")
    monkeypatch.setenv("TWILIO_FROM_NUMBER", "+1234567890")
    monkeypatch.setenv("ALERT_SMS_TO", "+919876543210")
    monkeypatch.setenv("NOTIFY_MAX_PER_HOUR", "20")
    monkeypatch.setenv("NOTIFY_KINDS", "critical,escalation")
    monkeypatch.setenv("NOTIFY_ENABLED", "true")

@pytest.fixture
def mock_twilio_client(monkeypatch):
    client = MagicMock()
    msg = MagicMock()
    msg.sid = "mocked_twilio_sid"
    client.messages.create.return_value = msg
    monkeypatch.setattr("app.services.notifications.get_twilio_client", lambda: client)
    return client

def test_mock_path_unconfigured(monkeypatch, caplog):
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    
    with caplog.at_level(logging.INFO):
        res = send_sms("+19876543210", "hello")
        
    assert res.ok is True
    assert res.mock is True
    assert res.provider == "mock"
    assert "SMS (mock) to +19*****3210" in caplog.text
    assert "+19876543210" not in caplog.text
    assert len(recent_messages) == 1

def test_success_send(mock_env, mock_twilio_client, caplog):
    res = send_sms("+919876543210", "hello test")
    assert res.ok is True
    assert res.sid == "mocked_twilio_sid"
    assert res.provider == "twilio"
    mock_twilio_client.messages.create.assert_called_once_with(
        to="+919876543210",
        from_="+1234567890",
        body="hello test"
    )
    assert "test_token" not in caplog.text

def test_invalid_number(mock_env, mock_twilio_client):
    res = send_sms("12345", "hello") # not E.164
    assert res.ok is False
    assert res.error_code == "invalid_number"
    mock_twilio_client.messages.create.assert_not_called()

def test_twilio_rest_exception(mock_env, mock_twilio_client, caplog):
    exc = TwilioRestException(400, "https://test", "Not verified", 21608)
    mock_twilio_client.messages.create.side_effect = exc
    
    with caplog.at_level(logging.ERROR):
        res = send_sms("+919876543210", "fail me")
        
    assert res.ok is False
    assert res.error_code == 21608
    assert "recipient not verified" in res.error_message
    assert "21608" in caplog.text
    assert "test_token" not in caplog.text
    assert "+919876543210" not in caplog.text # caplog shouldn't show full phone, well it might not log it anyway

def test_body_truncation(mock_env, mock_twilio_client):
    long_body = "A" * 500
    send_sms("+919876543210", long_body)
    mock_twilio_client.messages.create.assert_called_once()
    called_body = mock_twilio_client.messages.create.call_args[1]["body"]
    assert len(called_body) == 300
    assert called_body == "A" * 300

def test_rate_limit(mock_env, mock_twilio_client, monkeypatch):
    monkeypatch.setenv("NOTIFY_MAX_PER_HOUR", "2")
    
    res1 = send_sms("+919876543210", "1")
    assert res1.ok is True
    res2 = send_sms("+919876543210", "2")
    assert res2.ok is True
    
    # 3rd should fail
    res3 = send_sms("+919876543210", "3")
    assert res3.ok is False
    assert res3.error_message == "rate_limited"
    assert mock_twilio_client.messages.create.call_count == 2

def test_alert_sms_parsing_and_notify(mock_env, mock_twilio_client, monkeypatch):
    monkeypatch.setenv("ALERT_SMS_TO", " +919876543210 , +919876543210, +1234567890, invalid, +1111111111, +2222222222, +3333333333 ")
    alert = DummyAlert(1, "critical", "Test message")
    
    results = notify_alert(alert)
    # The recipients list removes duplicates, blanks, and max 5.
    # parsed: ["+919876543210", "+1234567890", "invalid", "+1111111111", "+2222222222"] (5 items)
    assert len(results) == 5
    ok_count = sum(1 for r in results if r.ok)
    assert ok_count == 4 # 'invalid' will return ok=False
    
    # Check deduplication per alert
    results_dup = notify_alert(alert)
    assert len(results_dup) == 0 # Already notified

def test_notify_kinds(mock_env, mock_twilio_client):
    alert1 = DummyAlert(1, "delayed", "Test message")
    res1 = notify_alert(alert1)
    assert len(res1) == 0 # delayed is not in critical,escalation
    
    alert2 = DummyAlert(2, "escalation", "Test message")
    res2 = notify_alert(alert2)
    assert len(res2) == 1
    assert res2[0].ok is True
