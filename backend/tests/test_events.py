import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.events import manager, broadcast, broadcast_nowait

@pytest.mark.asyncio
async def test_broadcast(caplog):
    # Setup mock websockets
    ws1 = MagicMock()
    ws1.send_text = AsyncMock()
    ws1.accept = AsyncMock()
    
    ws2 = MagicMock()
    ws2.accept = AsyncMock()
    # Simulate a disconnected client that throws an error when sent to
    ws2.send_text = AsyncMock(side_effect=RuntimeError("Disconnected"))

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

def test_websocket_endpoint(client):
    # Test the websocket endpoint using FastAPI's TestClient
    with client.websocket_connect("/ws/live") as websocket:
        # Connected successfully, client count should be 1
        assert manager.client_count == 1
    
    # After exiting the context manager, the connection should be closed
    assert manager.client_count == 0

def test_broadcast_nowait_from_thread():
    import threading
    import asyncio
    
    # 1. Start a real background event loop
    loop = asyncio.new_event_loop()
    def run_loop(l):
        asyncio.set_event_loop(l)
        l.run_forever()
        
    t = threading.Thread(target=run_loop, args=(loop,), daemon=True)
    t.start()
    
    # 2. Attach a mock client and the loop to the manager
    manager.loop = loop
    ws = MagicMock()
    ws.accept = AsyncMock()
    # In threadsafe calls, the coroutine is awaited by the event loop, 
    # so we need to ensure the mock is an AsyncMock that can be awaited.
    future = asyncio.run_coroutine_threadsafe(manager.connect(ws), loop)
    future.result() # wait for it to finish
    
    # Give the socket a real async mock for send_text
    ws.send_text = AsyncMock()
    
    # 3. Call broadcast_nowait from this main thread (which has no running asyncio loop)
    broadcast_nowait("thread_event", {"from": "thread"})
    
    # 4. Wait for it to process
    # We submit a dummy task to the loop and wait for it to ensure the previous task finished
    async def dummy(): pass
    asyncio.run_coroutine_threadsafe(dummy(), loop).result()
    
    # Wait a tiny bit just in case
    import time
    time.sleep(0.1)
    
    # 5. Check it was delivered
    ws.send_text.assert_called_once()
    payload = ws.send_text.call_args[0][0]
    assert '"event": "thread_event"' in payload
    
    # Cleanup
    manager.disconnect(ws)
    loop.call_soon_threadsafe(loop.stop)
    t.join(timeout=1.0)
