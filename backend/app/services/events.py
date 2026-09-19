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
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages a set of active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket client."""
        await websocket.accept()
        self._connections.append(websocket)
        logger.info("WebSocket client connected (%d total)", len(self._connections))

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected client (idempotent)."""
        try:
            self._connections.remove(websocket)
        except ValueError:
            pass
        logger.info("WebSocket client disconnected (%d total)", len(self._connections))

    @property
    def client_count(self) -> int:
        return len(self._connections)

    async def send_json(self, payload: dict[str, Any]) -> None:
        """Send *payload* to every connected client.

        Disconnected or erroring clients are silently removed.
        """
        stale: list[WebSocket] = []
        message = json.dumps(payload)
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
    - If there is no running loop or no clients, it silently does nothing.
    - Never raises.
    """
    if manager.client_count == 0:
        return
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_safe_broadcast(event, data))
    except RuntimeError:
        # No running event loop — nothing to do.
        pass
    except Exception:
        logger.exception("broadcast_nowait() scheduling failed for event=%s", event)


async def _safe_broadcast(event: str, data: dict[str, Any]) -> None:
    """Wrapper so fire-and-forget tasks don't leak exceptions."""
    try:
        await broadcast(event, data)
    except Exception:
        logger.exception("_safe_broadcast() failed for event=%s", event)
