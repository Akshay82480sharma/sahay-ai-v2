from pydantic import BaseModel, ConfigDict
from app.models.enums import FacilityType

class FacilityResponse(BaseModel):
    id: int
    name: str
    type: FacilityType
    lat: float
    lng: float
    capacity: int
    available_beds: int

    model_config = ConfigDict(from_attributes=True)