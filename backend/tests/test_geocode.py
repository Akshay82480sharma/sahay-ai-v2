import pytest
from app.services.geocode import geocode_location

def test_geocode_location_success():
    # Primary name
    coords = geocode_location("Alkapuri")
    assert coords is not None
    assert coords == (22.3040, 73.1666)
    
    # Alias test
    coords2 = geocode_location("vadodara junction")
    assert coords2 is not None
    assert coords2 == (22.3100, 73.1812)

def test_geocode_location_not_found():
    coords = geocode_location("Unknown Random Place")
    assert coords is None

def test_geocode_location_empty():
    coords = geocode_location("")
    assert coords is None
