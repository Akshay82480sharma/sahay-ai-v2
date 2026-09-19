import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.resource import Resource
from app.models.facility import Facility

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "app" / "data"

def seed_if_empty(db: Session) -> None:
    """Idempotent seed function. Only inserts if tables are empty."""
    
    # 1. Seed Resources
    if db.query(Resource).count() == 0:
        logger.info("Seeding resources...")
        with open(DATA_DIR / "seed_resources.json", "r", encoding="utf-8") as f:
            resources_data = json.load(f)
            
        for data in resources_data:
            # We explicitly don't insert 'id' to let the DB autoincrement, 
            # even though it's in the JSON
            resource = Resource(
                name=data["name"],
                type=data["type"],
                status=data["status"],
                lat=data["lat"],
                lng=data["lng"],
                station=data["station"],
                capacity=data.get("capacity")
            )
            db.add(resource)
        db.commit()
        logger.info("Successfully seeded %d resources.", len(resources_data))
        
    # 2. Seed Facilities
    if db.query(Facility).count() == 0:
        logger.info("Seeding facilities...")
        with open(DATA_DIR / "seed_facilities.json", "r", encoding="utf-8") as f:
            facilities_data = json.load(f)
            
        for data in facilities_data:
            facility = Facility(
                name=data["name"],
                type=data["type"],
                lat=data["lat"],
                lng=data["lng"],
                capacity=data["capacity"],
                available_beds=data["available_beds"]
            )
            db.add(facility)
        db.commit()
        logger.info("Successfully seeded %d facilities.", len(facilities_data))

if __name__ == "__main__":
    # Ensure logs are visible when run directly
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
