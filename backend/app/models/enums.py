from enum import Enum

class Source(str, Enum):
    citizen = "citizen"
    call = "call"
    sensor = "sensor"
    field = "field"

class IncidentType(str, Enum):
    flood = "flood"
    fire = "fire"
    accident = "accident"
    medical = "medical"
    industrial = "industrial"
    other = "other"

class IncidentPriority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"

class IncidentStatus(str, Enum):
    new = "new"
    dispatched = "dispatched"
    in_progress = "in_progress"
    resolved = "resolved"

class ResourceType(str, Enum):
    ambulance = "ambulance"
    fire_engine = "fire_engine"
    police = "police"
    rescue_boat = "rescue_boat"
    other = "other"

class ResourceStatus(str, Enum):
    available = "available"
    dispatched = "dispatched"
    busy = "busy"

class AssignmentStatus(str, Enum):
    dispatched = "dispatched"
    en_route = "en_route"
    on_scene = "on_scene"
    completed = "completed"

class AlertKind(str, Enum):
    critical = "critical"
    delayed = "delayed"
    escalation = "escalation"
    shortage = "shortage"

class FacilityType(str, Enum):
    hospital = "hospital"
    shelter = "shelter"