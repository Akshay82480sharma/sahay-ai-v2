import asyncio
import math
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from app.utils.geo import haversine_km, estimate_eta_seconds, EARTH_RADIUS_KM
from app.services.events import manager, broadcast, broadcast_nowait

# ---------------------------------------------------------------------------
# Test Geo Utils
# ---------------------------------------------------------------------------

def test_haversine_km():
    # Known distance: Paris to London is ~343 km
    # Paris: 48.8566 N, 2.3522 E
    # London: 51.5074 N, 0.1278 W
    dist = haversine_km(48.8566, 2.3522, 51.5074, -0.1278)
    assert 340 < dist < 350
    
    # Same point should be 0 distance
    assert haversine_km(22.3, 73.2, 22.3, 73.2) == 0.0

def test_estimate_eta_seconds():
    # Ambulance (40 km/h), distance 10 km, road factor 1.3
    # road distance = 13 km. Time = 13 / 40 = 0.325 hours = 1170 seconds
    eta = estimate_eta_seconds(10.0, "ambulance")
    assert eta == 1170
    
    # Custom road factor
    eta_straight = estimate_eta_seconds(10.0, "ambulance", road_factor=1.0)
    # Time = 10 / 40 = 0.25 hours = 900 seconds
    assert eta_straight == 900

    # Default fallback for unknown resource type
    eta_unknown = estimate_eta_seconds(10.0, "spaceship")
    # Uses 'other' speed (25 km/h). Time = 13 / 25 = 0.52 hours = 1872 seconds
    assert eta_unknown == 1872


# ---------------------------------------------------------------------------
# Test Events Service
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_broadcast(caplog):
    # Setup mock websockets
    ws1 = MagicMock()
    ws1.send_text = AsyncMock()
    ws1.accept = AsyncMock()
    
    ws2 = MagicMock()
    # Simulate a disconnected client that throws an error when sent to
    ws2.send_text = AsyncMock(side_effect=RuntimeError("Disconnected"))
    ws2.accept = AsyncMock()

    # Connect them to the manager
    await manager.connect(ws1)
    await manager.connect(ws2)
    assert manager.client_count == 2

    # Broadcast an event
    await broadcast("test_event", {"key": "value"})

    # Check ws1 received the message
    ws1.send_text.assert_called_once()
    sent_payload = ws1.send_text.call_args[0][0]
    assert '"event": "test_event"' in sent_payload
    assert '"data": {"key": "value"}' in sent_payload

    # Check ws2 was removed because it raised an error
    assert manager.client_count == 1
    
    # Clean up manager state for other tests
    manager.disconnect(ws1)
    assert manager.client_count == 0

def test_broadcast_nowait_no_loop_or_clients(caplog):
    # Ensure starting clean
    manager._connections.clear()
    
    # Should not raise any errors if no clients connected
    broadcast_nowait("test_event", {"key": "value"})
    assert "broadcast_nowait() scheduling failed" not in caplog.text

@pytest.mark.asyncio
async def test_websocket_endpoint(client):
    # Test the websocket endpoint using FastAPI's TestClient
    with client.websocket_connect("/ws/live") as websocket:
        # Connected successfully, client count should be 1
        assert manager.client_count == 1
        
        # Now use our safe synchronous broadcaster
        # Need to patch get_running_loop because TestClient runs things in a different context
        broadcast_nowait("test_event", {"hello": "world"})
        
        # We need to use the async broadcast function directly here because TestClient 
        # blocks the async loop, making broadcast_nowait not actually fire its task
        await broadcast("test_event", {"hello": "world"})
        
        # Receive the message
        data = websocket.receive_json()
        assert data["event"] == "test_event"
        assert data["data"]["hello"] == "world"
        
    # After exiting the context manager, the connection should be closed
    assert manager.client_count == 0
