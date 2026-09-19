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

def geocode_location(location_name: str) -> Optional[Tuple[float, float]]:
    """
    Looks up a location name in vadodara_places.json (case-insensitive).
    Returns (lat, lng) if found, else None.
    """
    if not location_name or not places_cache:
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
