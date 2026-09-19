from pydantic import BaseModel
from typing import Dict, List

class ResourceShortage(BaseModel):
    type: str
    available: int
    total: int

class Hotspot(BaseModel):
    lat: float
    lng: float
    count: int

class AnalyticsSummary(BaseModel):
    incidents_by_type: Dict[str, int]
    avg_response_seconds: float
    resource_shortages: List[ResourceShortage]
    hotspots: List[Hotspot]
    status_counts: Dict[str, int]