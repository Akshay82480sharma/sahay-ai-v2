import os
import asyncio
import logging
from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.assignment import Assignment
from app.models.resource import Resource
from app.models.alert import Alert
from app.models.enums import IncidentStatus, IncidentPriority, AssignmentStatus, ResourceStatus
from app.services.events import broadcast_nowait
from app.services.notifications import notify_alert
from app.utils.timeutil import format_iso8601_z

logger = logging.getLogger(__name__)

ALERT_CRITICAL_UNASSIGNED_SECONDS = int(os.environ.get("ALERT_CRITICAL_UNASSIGNED_SECONDS", 120))
ALERT_NOT_EN_ROUTE_SECONDS = int(os.environ.get("ALERT_NOT_EN_ROUTE_SECONDS", 180))
ALERT_NO_UPDATE_SECONDS = int(os.environ.get("ALERT_NO_UPDATE_SECONDS", 300))
ALERT_ESCALATE_SECONDS = int(os.environ.get("ALERT_ESCALATE_SECONDS", 180))

def run_checks(db: Session, now: datetime):
    new_alerts = []
    
    def create_alert(incident_id, kind, message):
        existing = db.query(Alert).filter(
            Alert.incident_id == incident_id,
            Alert.kind == kind,
            Alert.message == message
        ).first()
        if not existing:
            alert = Alert(
                incident_id=incident_id,
                kind=kind,
                message=message,
                created_at=now
            )
            db.add(alert)
            new_alerts.append(alert)
            
    # Active incidents
    incidents = db.query(Incident).filter(Incident.status.in_([IncidentStatus.new.value, IncidentStatus.dispatched.value, IncidentStatus.in_progress.value])).all()
    
    for inc in incidents:
        assignments = db.query(Assignment).filter(Assignment.incident_id == inc.id).all()
        
        # (a) critical incident with no assignment for > 120s
        if inc.priority == IncidentPriority.critical.value and not assignments:
            diff = (now - inc.created_at.replace(tzinfo=timezone.utc)).total_seconds()
            if diff > ALERT_CRITICAL_UNASSIGNED_SECONDS:
                create_alert(inc.id, "critical", f"Critical incident #{inc.id} ({inc.type}, severity {inc.severity}) has been unassigned for over {ALERT_CRITICAL_UNASSIGNED_SECONDS // 60} minutes.")
                
        # (c) no update on an active incident
        diff_update = (now - inc.updated_at.replace(tzinfo=timezone.utc)).total_seconds()
        if diff_update > ALERT_NO_UPDATE_SECONDS:
            create_alert(inc.id, "delayed", f"Incident #{inc.id} has had no updates for over {ALERT_NO_UPDATE_SECONDS // 60} minutes.")
            
        # (d) required resources unavailable
        if inc.required_resources and inc.status == IncidentStatus.new.value:
            reqs = inc.required_resources
            if isinstance(reqs, str):
                try:
                    reqs = json.loads(reqs)
                except Exception:
                    reqs = []
            
            for req in reqs:
                req_type = req.get("type")
                req_count = req.get("count", 1)
                
                avail = db.query(Resource).filter(
                    Resource.type == req_type, 
                    Resource.status == ResourceStatus.available.value
                ).count()
                
                if avail < req_count:
                    create_alert(inc.id, "shortage", f"Shortage of {req_type} for incident #{inc.id}: need {req_count}, have {avail}.")
                
    # (b) assignment still "dispatched" after 180s
    dispatched_assignments = db.query(Assignment).filter(Assignment.status == AssignmentStatus.dispatched.value).all()
    for assign in dispatched_assignments:
        if assign.dispatched_at:
            diff = (now - assign.dispatched_at.replace(tzinfo=timezone.utc)).total_seconds()
            if diff > ALERT_NOT_EN_ROUTE_SECONDS:
                res = db.query(Resource).filter(Resource.id == assign.resource_id).first()
                res_name = res.name if res else f"Resource #{assign.resource_id}"
                create_alert(assign.incident_id, "delayed", f"Assignment #{assign.id} ({res_name}) has not gone en-route within {ALERT_NOT_EN_ROUTE_SECONDS // 60} minutes of dispatch.")
                
    # (e) an unacknowledged alert older than 180s -> kind escalation
    unack_alerts = db.query(Alert).filter(Alert.acknowledged == False, Alert.kind != "escalation").all()
    for al in unack_alerts:
        diff = (now - al.created_at.replace(tzinfo=timezone.utc)).total_seconds()
        if diff > ALERT_ESCALATE_SECONDS:
            create_alert(al.incident_id, "escalation", f"ESCALATION: Unacknowledged alert #{al.id} ({al.kind}) requires immediate attention.")
            
    db.commit()
    for a in new_alerts:
        db.refresh(a)
    return new_alerts


async def alert_loop(session_factory, interval=10):
    logger.info("Alert loop started.")
    try:
        while True:
            db = session_factory()
            try:
                now = datetime.now(timezone.utc)
                new_alerts = run_checks(db, now)
                
                for alert in new_alerts:
                    # broadcast alert_created
                    a_dict = {
                        "id": alert.id,
                        "incident_id": alert.incident_id,
                        "kind": alert.kind,
                        "message": alert.message,
                        "acknowledged": alert.acknowledged,
                        "created_at": format_iso8601_z(alert.created_at)
                    }
                    try:
                        broadcast_nowait("alert_created", a_dict)
                    except Exception as e:
                        logger.error(f"Error broadcasting alert {alert.id}: {e}")
                        
                    try:
                        await asyncio.to_thread(notify_alert, alert)
                    except Exception as e:
                        logger.error(f"Error notifying for alert {alert.id}: {e}")
            except Exception as e:
                logger.error(f"Error in alert loop: {e}")
            finally:
                db.close()
                
            await asyncio.sleep(interval)
    except asyncio.CancelledError:
        logger.info("Alert loop cancelled cleanly.")
