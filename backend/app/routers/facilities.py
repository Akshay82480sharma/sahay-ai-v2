from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.facility import Facility
from app.schemas.facility import FacilityResponse

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("")
def list_facilities(db: Session = Depends(get_db)):
    facilities = db.query(Facility).all()
    # Manual dict building to strictly match API_SPEC shape
    return {
        "facilities": [
            {
                "id": f.id,
                "name": f.name,
                "type": f.type,
                "lat": f.lat,
                "lng": f.lng,
                "capacity": f.capacity,
                "available_beds": f.available_beds
            } for f in facilities
        ],
        "count": len(facilities)
    }
