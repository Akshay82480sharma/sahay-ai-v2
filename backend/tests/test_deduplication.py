from app.models.incident import Incident
from app.models.report import Report
import pytest

def test_deduplication_flow(client, db_session):
    # 1. Post initial report
    payload1 = {
        "text": "Huge flood in Alkapuri!",
        "source": "citizen",
        "lat": 22.3,
        "lng": 73.2,
        "location_name": "Alkapuri"
    }
    res1 = client.post("/reports", json=payload1)
    assert res1.status_code == 201
    inc1_id = res1.json()["incident"]["id"]
    
    # 2. Post a second report nearby for flood
    # 22.301, 73.201 is very close to 22.3, 73.2
    payload2 = {
        "text": "Flood water entering homes in Alkapuri area",
        "source": "citizen",
        "lat": 22.301,
        "lng": 73.201,
        "location_name": "Alkapuri Road"
    }
    # For testing, we mock the classifier in tests, so we need to make sure the classifier
    # mock returns 'flood' for both. 
    # Wait, the mock classifier returns 'flood' for "flood" and "water".
    res2 = client.post("/reports", json=payload2)
    assert res2.status_code == 201
    inc2_id = res2.json()["incident"]["id"]
    
    # It should have merged into inc1
    assert inc1_id == inc2_id
    assert res2.json()["incident"]["report_count"] == 2
    assert res2.json()["incident"]["confidence"] == 0.75 # 0.6 + 0.15
    
    # 3. Post a third report that is a DIFFERENT type (fire)
    payload3 = {
        "text": "Huge fire in the building next door!",
        "source": "citizen",
        "lat": 22.301,
        "lng": 73.201,
        "location_name": "Alkapuri"
    }
    res3 = client.post("/reports", json=payload3)
    assert res3.status_code == 201
    inc3_id = res3.json()["incident"]["id"]
    
    # Must be a new incident because it's a 'fire' not 'flood'
    assert inc3_id != inc1_id
    assert res3.json()["incident"]["type"] == "fire"
    assert res3.json()["incident"]["report_count"] == 1
    
    # 4. Post a fourth report that is a flood, but far away
    payload4 = {
        "text": "Flood in Gotri!",
        "source": "citizen",
        "lat": 23.0, # far away
        "lng": 74.0,
        "location_name": "Gotri"
    }
    res4 = client.post("/reports", json=payload4)
    assert res4.status_code == 201
    inc4_id = res4.json()["incident"]["id"]
    
    # Must be a new incident due to distance > 2km
    assert inc4_id != inc1_id
    assert res4.json()["incident"]["type"] == "flood"
    assert res4.json()["incident"]["report_count"] == 1
