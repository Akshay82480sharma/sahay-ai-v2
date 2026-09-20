from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.simulator import reset_simulation, run_scenario_background, set_current_sim
import os
import json

def verify_simulator_access(admin_token: str = Header(...)):
    if os.environ.get("SIMULATOR_ENABLED", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="Simulator is disabled.")
    
    expected_token = os.environ.get("ADMIN_TOKEN")
    if not expected_token or admin_token != expected_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

router = APIRouter(prefix="/simulate", tags=["Simulator"], dependencies=[Depends(verify_simulator_access)])

@router.post("/reset")
def reset(db: Session = Depends(get_db)):
    reset_simulation(db)
    return {"message": "All simulation data cleared. Resources reset to available."}

@router.post("/{scenario}")
def run_scenario(scenario: str, background_tasks: BackgroundTasks, speed: float = 1.0):
    scenario_path = os.path.join(os.path.dirname(__file__), f"../data/scenarios/{scenario}.json")
    if not os.path.exists(scenario_path):
        raise HTTPException(status_code=404, detail="Scenario not found.")
        
    try:
        with open(scenario_path, "r", encoding="utf-8") as f:
            reports = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load scenario file.")
        
    max_delay = max([r.get("delay_seconds", 0) for r in reports]) if reports else 0
    sim_time = int(max_delay / speed)
        
    sim_id = set_current_sim()
    background_tasks.add_task(run_scenario_background, scenario, speed, sim_id)
    
    return {
        "scenario": scenario,
        "reports_generated": len(reports),
        "message": f"{scenario.capitalize()} simulation started: {len(reports)} reports will be ingested over the next {sim_time} seconds across Vadodara."
    }
