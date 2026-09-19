import math
from app.utils.geo import haversine_km, estimate_eta_seconds, EARTH_RADIUS_KM

def test_haversine_km():
    # Known distance: Paris to London is ~343 km
    # Paris: 48.8566 N, 2.3522 E
    # London: 51.5074 N, 0.1278 W
    dist = haversine_km(48.8566, 2.3522, 51.5074, -0.1278)
    assert 340 < dist < 350
    
    # Same point should be 0 distance
    assert haversine_km(22.3, 73.2, 22.3, 73.2) == 0.0

def test_estimate_eta_seconds():
    # Ambulance (40 km/h), distance 10 km, road factor 1.3
    # road distance = 13 km. Time = 13 / 40 = 0.325 hours = 1170 seconds
    eta = estimate_eta_seconds(10.0, "ambulance")
    assert eta == 1170
    
    # Custom road factor
    eta_straight = estimate_eta_seconds(10.0, "ambulance", road_factor=1.0)
    # Time = 10 / 40 = 0.25 hours = 900 seconds
    assert eta_straight == 900

    # Default fallback for unknown resource type
    eta_unknown = estimate_eta_seconds(10.0, "spaceship")
    # Uses 'other' speed (25 km/h). Time = 13 / 25 = 0.52 hours = 1872 seconds
    assert eta_unknown == 1872
