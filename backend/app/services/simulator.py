import asyncio
import os
import json
import logging
import httpx
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.report import Report
from app.models.assignment import Assignment
from app.models.resource import Resource
from app.models.alert import Alert
from scripts.seed import seed_if_empty

logger = logging.getLogger(__name__)
SIMULATOR_BASE_URL = os.environ.get("SIMULATOR_BASE_URL", "http://localhost:8000")

def reset_simulation(db: Session):
    db.query(Assignment).delete()
    db.query(Report).delete()
    db.query(Alert).delete()
    db.query(Incident).delete()
    db.query(Resource).delete()
    db.commit()
    seed_if_empty(db)

async def run_scenario_background(scenario_name: str, speed: float):
    scenario_path = os.path.join(os.path.dirname(__file__), f"../data/scenarios/{scenario_name}.json")
    if not os.path.exists(scenario_path):
        logger.error(f"Scenario {scenario_name} not found.")
        return

    try:
        with open(scenario_path, "r", encoding="utf-8") as f:
            reports = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load scenario {scenario_name}: {e}")
        return

    # Sort reports by delay_seconds just in case
    reports.sort(key=lambda x: x.get("delay_seconds", 0))

    start_time = asyncio.get_running_loop().time()

    async with httpx.AsyncClient(base_url=SIMULATOR_BASE_URL) as client:
        for r in reports:
            try:
                delay = r.get("delay_seconds", 0) / speed
                target_time = start_time + delay
                now = asyncio.get_running_loop().time()
                if target_time > now:
                    await asyncio.sleep(target_time - now)

                payload = {
                    "text": r["text"],
                    "source": r["source"]
                }
                if "lat" in r: payload["lat"] = r["lat"]
                if "lng" in r: payload["lng"] = r["lng"]
                if "location_name" in r: payload["location_name"] = r["location_name"]

                # Fire and log
                resp = await client.post("/reports", json=payload)
                resp.raise_for_status()
                logger.info(f"Simulator posted report: {r['text'][:30]}...")
            except Exception as e:
                logger.error(f"Simulator failed to post report: {e}")
