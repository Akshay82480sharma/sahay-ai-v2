from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.resource import Resource

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("")
def list_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    return {
        "resources": [
            {
                "id": r.id,
                "name": r.name,
                "type": r.type,
                "status": r.status,
                "lat": r.lat,
                "lng": r.lng,
                "station": r.station,
                "capacity": r.capacity
            } for r in resources
        ],
        "count": len(resources)
    }
