"""Real-time event broadcasting via WebSocket.

Provides:
- ``ConnectionManager`` — tracks connected WebSocket clients.
- ``broadcast(event, data)`` — async, sends to all clients.
- ``broadcast_nowait(event, data)`` — sync-safe, schedules on the
  running event loop; silently does nothing if there is no loop or
  no connected clients.

Both public functions NEVER raise.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages a set of active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket client."""
        await websocket.accept()
        self._connections.append(websocket)
        if len(self._connections) == 1:
            self.loop = asyncio.get_running_loop()
        logger.info("WebSocket client connected (%d total)", len(self._connections))

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected client (idempotent)."""
        try:
            self._connections.remove(websocket)
        except ValueError:
            logger.warning("disconnect() called for unknown websocket")
        
        if len(self._connections) == 0:
            self.loop = None
        logger.info("WebSocket client disconnected (%d total)", len(self._connections))

    @property
    def client_count(self) -> int:
        return len(self._connections)

    async def send_json(self, payload: dict[str, Any]) -> None:
        """Send *payload* to every connected client.

        Disconnected or erroring clients are silently removed.
        """
        def to_utc_z(dt: datetime) -> str:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        try:
            encoded_payload = jsonable_encoder(payload, custom_encoder={datetime: to_utc_z})
            message = json.dumps(encoded_payload)
        except Exception:
            logger.exception("Failed to encode payload using jsonable_encoder, falling back to default stringifier")
            message = json.dumps(payload, default=str)

        stale: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

async def broadcast(event: str, data: dict[str, Any]) -> None:
    """Send ``{"event": event, "data": data}`` to all clients.

    Never raises — errors are logged and swallowed.
    """
    try:
        await manager.send_json({"event": event, "data": data})
    except Exception:
        logger.exception("broadcast() failed for event=%s", event)


def broadcast_nowait(event: str, data: dict[str, Any]) -> None:
    """Schedule a broadcast from synchronous code.

    Safe to call from anywhere:
    - If there is a running event loop, the broadcast is scheduled as a task.
    - If there is no running loop, it schedules it on the manager's loop safely.
    - If there is no loop or no clients, it silently does nothing.
    - Never raises.
    """
    if manager.client_count == 0:
        return
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_safe_broadcast(event, data))
    except RuntimeError:
        # No running event loop in this thread
        if hasattr(manager, "loop") and manager.loop and manager.loop.is_running():
            future = asyncio.run_coroutine_threadsafe(_safe_broadcast(event, data), manager.loop)
            def done_callback(f):
                try:
                    f.result()
                except Exception:
                    logger.exception("broadcast_nowait() coroutine failed for event=%s", event)
            future.add_done_callback(done_callback)
    except Exception:
        logger.exception("broadcast_nowait() scheduling failed for event=%s", event)


async def _safe_broadcast(event: str, data: dict[str, Any]) -> None:
    """Wrapper so fire-and-forget tasks don't leak exceptions."""
    try:
        await broadcast(event, data)
    except Exception:
        logger.exception("_safe_broadcast() failed for event=%s", event)
