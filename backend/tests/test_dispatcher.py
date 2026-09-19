import pytest
from app.services.dispatcher import get_required_resources, rank_and_select_resources, triage_incidents
from app.models.enums import IncidentType

def test_get_required_resources():
    # Fire severity 4
    reqs = get_required_resources(IncidentType.fire.value, 4)
    assert reqs["fire_engine"] == 4
    assert reqs["ambulance"] == 1
    
    # Medical severity 1
    reqs = get_required_resources(IncidentType.medical.value, 1)
    assert reqs["ambulance"] == 1
    
def test_rank_and_select_resources():
    incident_lat = 22.3
    incident_lng = 73.2
    
    # 2 available, 1 busy
    resources = [
        {"id": 1, "type": "ambulance", "status": "available", "lat": 22.31, "lng": 73.21, "name": "A1", "station": "S1"},
        {"id": 2, "type": "ambulance", "status": "busy", "lat": 22.3, "lng": 73.2, "name": "A2", "station": "S2"},
        {"id": 3, "type": "ambulance", "status": "available", "lat": 22.5, "lng": 73.5, "name": "A3", "station": "S3"}, # Far away
    ]
    
    reqs = {"ambulance": 2}
    
    selected, mutual_aid, reason = rank_and_select_resources(incident_lat, incident_lng, reqs, resources)
    
    # Should only select 2, one is busy, so it only selects 2 available. 
    # But wait, there are only 2 available in total.
    assert len(selected) == 2
    assert selected[0]["resource_id"] == 1 # Closer
    assert selected[1]["resource_id"] == 3 # Farther
    
    # A3 is far away, so mutual aid should be True
    assert mutual_aid is True
    assert "No local ambulance available" in reason
    
def test_triage_incidents():
    incidents = [
        {"id": 1, "type": IncidentType.medical.value, "severity": 2, "report_count": 1, "lat": 22.3, "lng": 73.2},
        {"id": 2, "type": IncidentType.accident.value, "severity": 4, "report_count": 5, "lat": 22.31, "lng": 73.21}, # Higher severity
    ]
    
    resources = [
        {"id": 1, "type": "ambulance", "status": "available", "lat": 22.31, "lng": 73.21, "name": "A1", "station": "S1"},
        {"id": 2, "type": "police", "status": "available", "lat": 22.31, "lng": 73.21, "name": "P1", "station": "S1"},
    ]
    
    allocations = triage_incidents(incidents, resources)
    
    # Accident (id 2) should be processed first due to severity 4
    assert allocations[0]["incident_id"] == 2
    # It needs 2 ambulances and 1 police, but only 1 ambulance is available
    assert allocations[0]["shortage"] is True
    assert len(allocations[0]["recommendations"]) == 2 # 1 ambulance, 1 police
    
    # Medical (id 1) processed second
    assert allocations[1]["incident_id"] == 1
    # Needs 1 ambulance, but the only ambulance was taken by incident 2
    assert len(allocations[1]["recommendations"]) == 0
    assert allocations[1]["shortage"] is True
