import pytest
import concurrent.futures
from app.models.resource import Resource
from app.models.enums import ResourceType, ResourceStatus

executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
def receive_with_timeout(ws, timeout=2.0):
    future = executor.submit(ws.receive_json)
    try:
        return future.result(timeout=timeout)
    except concurrent.futures.TimeoutError:
        return None

def test_websocket_e2e(client, db_session):
    # Setup some data for assignments
    r = Resource(name="Test Boat", type=ResourceType.rescue_boat, status=ResourceStatus.available, lat=22.3, lng=73.1, capacity=5, station="Vadodara Station")
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)

    # 1. Connect WS
    with client.websocket_connect("/ws/live") as websocket:
        
        # 2. Call real routes
        # POST /reports (Hinglish fire report)
        resp = client.post("/reports", json={
            "text": "bhai aag lag gayi hai jaldi aao",
            "source": "citizen",
            "lat": 22.3,
            "lng": 73.2,
            "location_name": "Test Loc"
        })
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        incident_id = data["incident"]["id"]

        # POST /incidents/{id}/assign
        resp = client.post(f"/incidents/{incident_id}/assign", json={
            "resource_ids": [r.id]
        })
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        assignment_id = resp.json()["assignments"][0]["id"]

        # PATCH /assignments/{id}
        resp = client.patch(f"/assignments/{assignment_id}", json={
            "status": "en_route"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        # 3. Read messages with timeout
        received_events = []
        while True:
            msg = receive_with_timeout(websocket, timeout=1.0)
            if msg is None:
                break
            received_events.append(msg)
        
        # We expect events:
        event_names = [ev["event"] for ev in received_events]
        assert "incident_created" in event_names
        assert "incident_updated" in event_names
        assert "resource_updated" in event_names
        assert "assignment_updated" in event_names
        
        # 4. Check timestamps in all messages
        for msg in received_events:
            data = msg.get("data", {})
            for k, v in data.items():
                if isinstance(v, str) and "T" in v and len(v) >= 19:
                    if "-" in v and ":" in v:
                        assert v.endswith("Z"), f"Timestamp '{v}' in field '{k}' of event '{msg['event']}' does not end with Z"
