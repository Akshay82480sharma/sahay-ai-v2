import os
import time
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.events import ConnectionManager, WS_MAX_CONNECTIONS
from app.services.notifications import recent_messages, _notified_alerts, send_sms
from app.routers.webhooks import check_rate_limit, _rate_limits
from app.models.alert import Alert
from app.models.enums import AlertKind

@pytest.mark.asyncio
async def test_ws_max_connections_cap():
    manager = ConnectionManager()
    
    # Mock WebSocket
    class MockWS:
        def __init__(self):
            self.accepted = False
            self.closed_code = None
        async def accept(self):
            self.accepted = True
        async def close(self, code):
            self.closed_code = code

    # Fill manager to cap
    for _ in range(WS_MAX_CONNECTIONS):
        ws = MockWS()
        await manager.connect(ws)
        assert ws.accepted
        assert ws.closed_code is None
        
    # Extra connection should close with 1013
    extra_ws = MockWS()
    await manager.connect(extra_ws)
    assert extra_ws.accepted
    assert extra_ws.closed_code == 1013
    assert len(manager._connections) == WS_MAX_CONNECTIONS
    
def test_webhooks_rate_limit_cap():
    _rate_limits.clear()
    
    # Fill to 10000
    for i in range(10000):
        _rate_limits[f"user_{i}"] = [time.time()]
        
    # Next new user should fail
    assert check_rate_limit("user_extra") == False
    
    # But existing users should still be able to pass if under limit
    assert check_rate_limit("user_1") == True
    
    _rate_limits.clear()

def test_notifications_memory_bounds():
    # recent_messages is a deque with maxlen=100
    recent_messages.clear()
    
    # Mock environment for testing mock sends
    os.environ.pop("TWILIO_ACCOUNT_SID", None)
    os.environ.pop("TWILIO_AUTH_TOKEN", None)
    
    for i in range(150):
        send_sms(f"+1000000000{i%10}", f"test {i}")
    
    assert len(recent_messages) == 100
    
    # _notified_alerts is a deque with maxlen=1000
    _notified_alerts.clear()
    for i in range(1050):
        _notified_alerts.append(f"alert_{i}")
        
    assert len(_notified_alerts) == 1000
