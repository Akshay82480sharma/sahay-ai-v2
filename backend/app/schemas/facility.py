from pydantic import BaseModel
from app.models.enums import FacilityType

class FacilityResponse(BaseModel):
    id: int
    name: str
    type: FacilityType
    lat: float
    lng: float
    capacity: int
    available_beds: int

    class Config:
        from_attributes = True