import os
from typing import List, Dict, Any, Tuple
from app.utils.geo import haversine_km, estimate_eta_seconds
from app.models.incident import Incident
from app.models.resource import Resource
from app.models.enums import ResourceStatus, IncidentType
from sqlalchemy.orm import Session

# Default local radius for mutual aid checks
DISPATCH_LOCAL_RADIUS_KM = float(os.getenv("DISPATCH_LOCAL_RADIUS_KM", "8.0"))

def get_required_resources(incident_type: str, severity: int) -> Dict[str, int]:
    """Returns a dictionary of {resource_type: count} needed for a given incident."""
    requirements = {}
    
    # Base requirements
    if incident_type == IncidentType.fire:
        requirements["fire_engine"] = severity
        requirements["ambulance"] = 1 if severity > 1 else 0
    elif incident_type == IncidentType.flood:
        requirements["rescue_boat"] = severity if severity >= 3 else 1
        requirements["ambulance"] = 1
    elif incident_type == IncidentType.accident:
        requirements["ambulance"] = 1
        requirements["police"] = 1
        if severity >= 4:
            requirements["ambulance"] = 2
    elif incident_type == IncidentType.medical:
        requirements["ambulance"] = 1
    elif incident_type == IncidentType.industrial:
        requirements["fire_engine"] = severity
        requirements["ambulance"] = severity
        requirements["police"] = 1
    else:
        requirements["police"] = 1
        
    # Remove 0 counts
    return {k: v for k, v in requirements.items() if v > 0}


def rank_and_select_resources(
    incident_lat: float, 
    incident_lng: float, 
    requirements: Dict[str, int], 
    available_resources: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], bool, str]:
    """
    Pure function. Ranks available resources by ETA and selects the best ones to meet requirements.
    Supports mutual aid logic.
    Returns: (selected_resources, mutual_aid_flag, mutual_aid_reason)
    """
    selected = []
    mutual_aid = False
    mutual_aid_reasons = []

    for req_type, req_count in requirements.items():
        # Filter matching available resources
        pool = [r for r in available_resources if r["type"] == req_type and r["status"] == ResourceStatus.available.value]
        
        # Calculate ETA and distance for each
        for r in pool:
            dist = haversine_km(incident_lat, incident_lng, r["lat"], r["lng"])
            r["_dist_km"] = dist
            r["_eta"] = estimate_eta_seconds(dist, req_type)
            
        # Sort by ETA
        pool.sort(key=lambda x: x["_eta"])
        
        # Select the top N
        picked = pool[:req_count]
        
        for p in picked:
            # Check mutual aid
            is_mutual_aid = p["_dist_km"] > DISPATCH_LOCAL_RADIUS_KM
            if is_mutual_aid:
                mutual_aid = True
                reason = f"No local {p['type'].replace('_', ' ')} available. Nearest from {p['station']} ({p['_dist_km']:.1f} km)."
                if reason not in mutual_aid_reasons:
                    mutual_aid_reasons.append(reason)
                reasoning_str = reason
            else:
                reasoning_str = f"Closest available {p['type'].replace('_', ' ')} ({p['_dist_km']:.1f} km)."

            selected.append({
                "resource_id": p["id"],
                "resource_name": p["name"],
                "type": p["type"],
                "eta_seconds": p["_eta"],
                "reasoning": reasoning_str
            })
            
            # Remove from available pool so it's not picked twice in complex scenarios
            p["status"] = "selected_temp" 

    mutual_aid_reason_str = " ".join(mutual_aid_reasons) if mutual_aid else None
    return selected, mutual_aid, mutual_aid_reason_str


def triage_incidents(incidents: List[Dict[str, Any]], resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cross-incident triage. Allocates limited units across open incidents.
    Sorts incidents by severity (desc) then report_count (desc).
    """
    # Sort incidents highest severity first, then most reports
    sorted_incidents = sorted(incidents, key=lambda x: (x.get("severity", 0), x.get("report_count", 0)), reverse=True)
    
    allocations = []
    # Make a copy of resources we can mutate safely
    available = [r.copy() for r in resources if r.get("status") == ResourceStatus.available.value]

    for inc in sorted_incidents:
        reqs = get_required_resources(inc["type"], inc["severity"])
        selected, ma_flag, ma_reason = rank_and_select_resources(
            inc["lat"], inc["lng"], reqs, available
        )
        
        # Check for shortages
        shortage = len(selected) < sum(reqs.values())
        
        allocations.append({
            "incident_id": inc["id"],
            "recommendations": selected,
            "mutual_aid": ma_flag,
            "mutual_aid_reason": ma_reason,
            "shortage": shortage
        })
        
        # The rank_and_select_resources marks picked items as 'selected_temp', which effectively
        # removes them for the next incident in the loop.

    return allocations


def recommend(db: Session, incident: Incident) -> Dict[str, Any]:
    """DB wrapper for recommendation logic."""
    # Determine requirements
    reqs = get_required_resources(incident.type, incident.severity)
    
    # Get all available resources from DB
    db_resources = db.query(Resource).filter(Resource.status == ResourceStatus.available).all()
    # Convert to dicts for pure function
    available_dicts = [
        {
            "id": r.id, "name": r.name, "type": r.type, 
            "status": r.status, "lat": r.lat, "lng": r.lng, 
            "station": r.station, "capacity": r.capacity
        } for r in db_resources
    ]
    
    # Use pure function to rank and select
    if incident.lat is None or incident.lng is None:
        return {
            "incident_id": incident.id,
            "recommendations": [],
            "mutual_aid": False,
            "mutual_aid_reason": "Incident missing coordinates."
        }

    selected, ma_flag, ma_reason = rank_and_select_resources(
        incident.lat, incident.lng, reqs, available_dicts
    )
    
    return {
        "incident_id": incident.id,
        "recommendations": selected,
        "mutual_aid": ma_flag,
        "mutual_aid_reason": ma_reason
    }
