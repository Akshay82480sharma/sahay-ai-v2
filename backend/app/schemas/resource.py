from pydantic import BaseModel
from typing import Optional
from app.models.enums import ResourceType, ResourceStatus

class ResourceResponse(BaseModel):
    id: int
    name: str
    type: ResourceType
    status: ResourceStatus
    lat: float
    lng: float
    station: str
    capacity: Optional[int] = None

    class Config:
        from_attributes = True