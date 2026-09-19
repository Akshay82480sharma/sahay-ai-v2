"""WebSocket endpoint for real-time dashboard updates.

Exposes ``/ws/live`` — clients connect and receive server-pushed JSON
messages of the form ``{"event": "...", "data": {...}}``.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.events import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket) -> None:
    """Accept a WebSocket connection and keep it open for broadcasts.

    The server pushes events; the client does not need to send anything.
    Any incoming messages are silently ignored.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive — wait for client messages
            # (which we ignore) or a disconnect.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        logger.exception("WebSocket error")
        manager.disconnect(websocket)
