"""Geographical utility functions for distance and ETA calculations.

Provides haversine distance and straight-line ETA estimation with a
road-factor adjustment.  Designed so a road-graph ETA (e.g. OSMnx)
can replace `estimate_eta_seconds` later without changing callers.
"""

from __future__ import annotations

import math
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EARTH_RADIUS_KM: float = 6371.0

# Average travel speeds in km/h by resource type (on open roads).
_AVERAGE_SPEEDS_KMH: dict[str, float] = {
    "ambulance": 40.0,
    "fire_engine": 30.0,
    "police": 45.0,
    "rescue_boat": 15.0,
    "other": 25.0,
}

# Multiplier to account for road vs. straight-line distance.
ROAD_FACTOR: float = 1.3


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def haversine_km(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
) -> float:
    """Return the great-circle distance in kilometres between two points.

    Uses the standard haversine formula.
    """
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def estimate_eta_seconds(
    distance_km: float,
    resource_type: str,
    *,
    road_factor: Optional[float] = None,
) -> int:
    """Estimate travel time in whole seconds for a resource type.

    Parameters
    ----------
    distance_km:
        Straight-line (haversine) distance in kilometres.
    resource_type:
        One of the ResourceType enum values (``ambulance``, ``fire_engine``,
        ``police``, ``rescue_boat``, ``other``).
    road_factor:
        Multiplier applied to ``distance_km`` to approximate road distance.
        Defaults to the module-level ``ROAD_FACTOR`` (1.3).

    Returns
    -------
    int
        Estimated travel time in seconds (rounded up).

    Notes
    -----
    To replace this with a road-graph ETA (e.g. via OSMnx / OSRM), simply
    override this function or monkey-patch it — callers do not depend on the
    implementation.
    """
    if road_factor is None:
        road_factor = ROAD_FACTOR

    speed_kmh = _AVERAGE_SPEEDS_KMH.get(resource_type, _AVERAGE_SPEEDS_KMH["other"])
    road_distance_km = distance_km * road_factor
    travel_hours = road_distance_km / speed_kmh
    return math.ceil(travel_hours * 3600)
