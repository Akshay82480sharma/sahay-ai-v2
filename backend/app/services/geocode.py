import json
import os
from pathlib import Path
from typing import Optional, Tuple

PLACES_FILE = Path(__file__).parent.parent / "data" / "vadodara_places.json"

def _load_places() -> dict:
    if not PLACES_FILE.exists():
        return {}
    with open(PLACES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

places_cache = _load_places()

import httpx

def geocode_location(location_name: str) -> Optional[Tuple[float, float]]:
    """
    Looks up a location name. First tries Google Maps Geocoding API if key is available.
    Falls back to vadodara_places.json (case-insensitive) if API fails or key is missing.
    """
    if not location_name:
        return None
        
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if api_key:
        try:
            # Append Vadodara, Gujarat to improve accuracy
            query = f"{location_name}, Vadodara, Gujarat, India"
            # httpx handles urlencoding via params
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            response = httpx.get(url, params={"address": query, "key": api_key}, timeout=5.0)
            data = response.json()
            if data.get("status") == "OK" and len(data.get("results", [])) > 0:
                location = data["results"][0]["geometry"]["location"]
                return location["lat"], location["lng"]
        except Exception as e:
            print(f"Google Maps Geocoding failed: {e}")
            pass
            
    # Fallback to local cache
    if not places_cache:
        return None
        
    search_name = location_name.lower()
    
    for place in places_cache:
        place_name = place["name"]
        aliases = place.get("aliases", [])
        
        # Check primary name
        if place_name.lower() in search_name or search_name in place_name.lower():
            return place["lat"], place["lng"]
            
        # Check aliases
        for alias in aliases:
            if alias.lower() in search_name or search_name in alias.lower():
                return place["lat"], place["lng"]
            
    return None
