def test_report_to_incident_flow(client):
    # 1. Post a report
    payload = {
        "text": "Huge fire in the building!",
        "source": "citizen",
        "lat": 22.3,
        "lng": 73.2,
        "location_name": "Test Location"
    }
    
    response = client.post("/reports", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert "report" in data
    assert "incident" in data
    
    report_data = data["report"]
    assert report_data["raw_text"] == "Huge fire in the building!"
    assert report_data["source"] == "citizen"
    
    incident_data = data["incident"]
    assert incident_data["type"] == "fire"
    assert incident_data["severity"] == 4
    assert incident_data["status"] == "new"
    
    # 2. Get all incidents
    list_res = client.get("/incidents")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data) >= 1
    assert any(i["id"] == incident_data["id"] for i in list_data)
    
    # 3. Get specific incident detail
    detail_res = client.get(f"/incidents/{incident_data['id']}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == incident_data["id"]
    assert len(detail_data["reports"]) == 1
    assert detail_data["reports"][0]["id"] == report_data["id"]
