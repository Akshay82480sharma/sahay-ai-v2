import pytest
from app.models.incident import Incident

def test_report_without_lat_lng(client, db_session):
    payload = {
        "text": "Flood at station",
        "source": "citizen",
        "location_name": "vadodara junction"
        # No lat/lng
    }
    res = client.post("/reports", json=payload)
    assert res.status_code == 201
    
    # Check if geocoded successfully
    inc = res.json()["incident"]
    assert inc["lat"] == 22.3100
    assert inc["lng"] == 73.1812
