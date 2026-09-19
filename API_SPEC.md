# API_SPEC.md — Sahay AI API Contract

> **This document is the single source of truth for all API endpoints and data shapes.**
> Both backend and frontend must match this spec exactly.
> Update this file BEFORE changing any endpoint, request body, response body, or enum value.

---

## General Conventions

| Rule | Detail |
|---|---|
| Base URL | `http://localhost:8000` |
| Content type | `application/json` |
| Field naming | `snake_case` |
| Timestamps | ISO 8601 UTC — `2026-09-19T04:12:00Z` |
| IDs | Integers |
| Coordinates | `lat` / `lng` as floats |

---

## Enums

### Source
```
citizen | call | sensor | field
```

### Incident Type
```
flood | fire | accident | medical | industrial | other
```

### Incident Severity
Integer `1` (lowest) to `5` (highest).

### Incident Priority
```
critical | high | medium | low
```

### Incident Status
```
new | dispatched | in_progress | resolved
```

### Resource Type
```
ambulance | fire_engine | police | rescue_boat | other
```

### Resource Status
```
available | dispatched | busy
```

### Assignment Status
```
dispatched | en_route | on_scene | completed
```

### Alert Kind
```
critical | delayed | escalation | shortage
```

### Facility Type
```
hospital | shelter
```

---

## Object Shapes

### Report

```json
{
  "id": 1,
  "raw_text": "પાણી ઘરમાં ઘૂસી ગયું છે, મદદ મોકલો",
  "source": "citizen",
  "lat": 22.3072,
  "lng": 73.1812,
  "language": "gu",
  "created_at": "2026-09-19T04:12:00Z",
  "incident_id": 1
}
```

### Incident (list view)

```json
{
  "id": 1,
  "type": "flood",
  "severity": 4,
  "priority": "critical",
  "status": "new",
  "lat": 22.3072,
  "lng": 73.1812,
  "location_name": "Akota, Vadodara",
  "summary": "Severe waterlogging reported in Akota residential area. Multiple residents trapped on upper floors.",
  "confidence": 0.85,
  "report_count": 5,
  "required_resources": [
    { "type": "rescue_boat", "count": 2 },
    { "type": "ambulance", "count": 1 }
  ],
  "created_at": "2026-09-19T04:12:00Z",
  "updated_at": "2026-09-19T04:18:30Z"
}
```

### Incident (detail view)

Same as list view, plus:

```json
{
  "...all list fields...",
  "reports": [
    { "id": 1, "raw_text": "...", "source": "citizen", "...": "..." }
  ],
  "assignments": [
    { "id": 1, "resource_id": 3, "status": "en_route", "...": "..." }
  ]
}
```

### Resource

```json
{
  "id": 3,
  "name": "Rescue Boat RB-01",
  "type": "rescue_boat",
  "status": "available",
  "lat": 22.3190,
  "lng": 73.1745,
  "station": "Vadodara Fire Station #2",
  "capacity": 8
}
```

### Assignment

```json
{
  "id": 1,
  "incident_id": 1,
  "resource_id": 3,
  "status": "dispatched",
  "eta_seconds": 420,
  "dispatched_at": "2026-09-19T04:20:00Z",
  "arrived_at": null,
  "reasoning": "Rescue boat selected: incident is flood type with severity 4, boat is closest available unit (1.2 km), capacity 8 matches estimated 6 trapped residents."
}
```

### Alert

```json
{
  "id": 1,
  "incident_id": 1,
  "kind": "critical",
  "message": "Critical incident #1 (flood, severity 4) has been unassigned for over 2 minutes.",
  "acknowledged": false,
  "created_at": "2026-09-19T04:14:00Z"
}
```

### Facility

```json
{
  "id": 1,
  "name": "SSG Hospital",
  "type": "hospital",
  "lat": 22.3216,
  "lng": 73.1890,
  "capacity": 500,
  "available_beds": 42
}
```

---

## Endpoints

---

### Health Check

```
GET /health
```

**Response `200`:**

```json
{
  "status": "ok",
  "llm_provider": "mock",
  "database": "connected"
}
```

---

### Submit a Report

```
POST /reports
```

**Request body:**

```json
{
  "text": "Akota ma paani bhari gayun che, ghar ma 5 log phase che, jaldi madad bhejo",
  "source": "citizen",
  "lat": 22.3072,
  "lng": 73.1812,
  "location_name": "Akota, Vadodara"
}
```

- `text` — required, the raw report in any language.
- `source` — required, one of the source enum values.
- `lat`, `lng` — optional floats.
- `location_name` — optional string.

**Response `201`:**

```json
{
  "report": {
    "id": 1,
    "raw_text": "Akota ma paani bhari gayun che, ghar ma 5 log phase che, jaldi madad bhejo",
    "source": "citizen",
    "lat": 22.3072,
    "lng": 73.1812,
    "language": "hi-Latn",
    "created_at": "2026-09-19T04:12:00Z",
    "incident_id": 1
  },
  "incident": {
    "id": 1,
    "type": "flood",
    "severity": 4,
    "priority": "critical",
    "status": "new",
    "lat": 22.3072,
    "lng": 73.1812,
    "location_name": "Akota, Vadodara",
    "summary": "Severe waterlogging in Akota area. 5 people reported trapped.",
    "confidence": 0.60,
    "report_count": 1,
    "required_resources": [
      { "type": "rescue_boat", "count": 1 }
    ],
    "created_at": "2026-09-19T04:12:00Z",
    "updated_at": "2026-09-19T04:12:00Z"
  }
}
```

---

### List Incidents

```
GET /incidents
```

**Query parameters (all optional):**

| Param | Type | Example |
|---|---|---|
| `status` | string | `new` |
| `type` | string | `flood` |
| `priority` | string | `critical` |

**Response `200`:**

```json
{
  "incidents": [
    { "...incident list object..." }
  ],
  "count": 3
}
```

---

### Get Incident Detail

```
GET /incidents/{id}
```

**Response `200`:**

```json
{
  "id": 1,
  "type": "flood",
  "severity": 4,
  "priority": "critical",
  "status": "dispatched",
  "lat": 22.3072,
  "lng": 73.1812,
  "location_name": "Akota, Vadodara",
  "summary": "Severe waterlogging in Akota area. Multiple residents trapped on upper floors.",
  "confidence": 0.85,
  "report_count": 5,
  "required_resources": [
    { "type": "rescue_boat", "count": 2 },
    { "type": "ambulance", "count": 1 }
  ],
  "created_at": "2026-09-19T04:12:00Z",
  "updated_at": "2026-09-19T04:20:00Z",
  "reports": [
    {
      "id": 1,
      "raw_text": "પાણી ઘરમાં ઘૂસી ગયું છે, મદદ મોકલો",
      "source": "citizen",
      "lat": 22.3072,
      "lng": 73.1812,
      "language": "gu",
      "created_at": "2026-09-19T04:12:00Z",
      "incident_id": 1
    },
    {
      "id": 2,
      "raw_text": "Akota ma paani bhari gayun che, 5 log phase che",
      "source": "citizen",
      "lat": 22.3075,
      "lng": 73.1808,
      "language": "hi-Latn",
      "created_at": "2026-09-19T04:13:15Z",
      "incident_id": 1
    },
    {
      "id": 5,
      "raw_text": "Water level sensor triggered: 1.8m at station AKOTA-03",
      "source": "sensor",
      "lat": 22.3070,
      "lng": 73.1815,
      "language": "en",
      "created_at": "2026-09-19T04:14:00Z",
      "incident_id": 1
    }
  ],
  "assignments": [
    {
      "id": 1,
      "incident_id": 1,
      "resource_id": 3,
      "status": "en_route",
      "eta_seconds": 420,
      "dispatched_at": "2026-09-19T04:20:00Z",
      "arrived_at": null,
      "reasoning": "Rescue boat selected: closest available unit (1.2 km), capacity 8."
    }
  ]
}
```

**Response `404`:**

```json
{
  "error": {
    "code": "not_found",
    "message": "Incident with id 99 not found."
  }
}
```

---

### Recommend Resources for an Incident

```
POST /incidents/{id}/recommend
```

**Request body:** None.

**Response `200`:**

```json
{
  "incident_id": 1,
  "recommendations": [
    {
      "resource_id": 3,
      "resource_name": "Rescue Boat RB-01",
      "type": "rescue_boat",
      "reasoning": "Closest rescue boat (1.2 km). Capacity 8 accommodates estimated 6 trapped residents.",
      "eta_seconds": 420
    },
    {
      "resource_id": 7,
      "resource_name": "Ambulance AMB-04",
      "type": "ambulance",
      "reasoning": "Nearest ambulance (2.1 km). Precautionary for potential injuries from flooding.",
      "eta_seconds": 600
    }
  ],
  "mutual_aid": false,
  "mutual_aid_reason": null
}
```

When local resources are exhausted:

```json
{
  "incident_id": 2,
  "recommendations": [
    {
      "resource_id": 15,
      "resource_name": "Rescue Boat RB-05 (Anand Station)",
      "type": "rescue_boat",
      "reasoning": "No local rescue boats available. Nearest from Anand station (28 km).",
      "eta_seconds": 2100
    }
  ],
  "mutual_aid": true,
  "mutual_aid_reason": "All 3 local rescue boats are currently dispatched. Requesting mutual aid from Anand district."
}
```

---

### Assign Resources to an Incident (Human Approval)

```
POST /incidents/{id}/assign
```

**Request body:**

```json
{
  "resource_ids": [3, 7]
}
```

**Response `201`:**

```json
{
  "incident_id": 1,
  "assignments": [
    {
      "id": 1,
      "incident_id": 1,
      "resource_id": 3,
      "status": "dispatched",
      "eta_seconds": 420,
      "dispatched_at": "2026-09-19T04:20:00Z",
      "arrived_at": null,
      "reasoning": "Rescue boat selected: closest available unit (1.2 km), capacity 8."
    },
    {
      "id": 2,
      "incident_id": 1,
      "resource_id": 7,
      "status": "dispatched",
      "eta_seconds": 600,
      "dispatched_at": "2026-09-19T04:20:00Z",
      "arrived_at": null,
      "reasoning": "Ambulance dispatched as precaution for potential flood injuries."
    }
  ]
}
```

---

### Update Assignment Status

```
PATCH /assignments/{id}
```

**Request body:**

```json
{
  "status": "en_route"
}
```

**Response `200`:**

```json
{
  "id": 1,
  "incident_id": 1,
  "resource_id": 3,
  "status": "en_route",
  "eta_seconds": 300,
  "dispatched_at": "2026-09-19T04:20:00Z",
  "arrived_at": null,
  "reasoning": "Rescue boat selected: closest available unit (1.2 km), capacity 8."
}
```

---

### List Resources

```
GET /resources
```

**Response `200`:**

```json
{
  "resources": [
    {
      "id": 3,
      "name": "Rescue Boat RB-01",
      "type": "rescue_boat",
      "status": "dispatched",
      "lat": 22.3190,
      "lng": 73.1745,
      "station": "Vadodara Fire Station #2",
      "capacity": 8
    },
    {
      "id": 7,
      "name": "Ambulance AMB-04",
      "type": "ambulance",
      "status": "available",
      "lat": 22.3105,
      "lng": 73.2010,
      "station": "SSG Hospital EMS",
      "capacity": 2
    }
  ],
  "count": 2
}
```

---

### List Facilities

```
GET /facilities
```

**Response `200`:**

```json
{
  "facilities": [
    {
      "id": 1,
      "name": "SSG Hospital",
      "type": "hospital",
      "lat": 22.3216,
      "lng": 73.1890,
      "capacity": 500,
      "available_beds": 42
    },
    {
      "id": 2,
      "name": "Akota Community Shelter",
      "type": "shelter",
      "lat": 22.3050,
      "lng": 73.1780,
      "capacity": 200,
      "available_beds": 180
    }
  ],
  "count": 2
}
```

---

### List Alerts

```
GET /alerts
```

**Response `200`:**

```json
{
  "alerts": [
    {
      "id": 1,
      "incident_id": 1,
      "kind": "critical",
      "message": "Critical incident #1 (flood, severity 4) has been unassigned for over 2 minutes.",
      "acknowledged": false,
      "created_at": "2026-09-19T04:14:00Z"
    },
    {
      "id": 2,
      "incident_id": 1,
      "kind": "delayed",
      "message": "Assignment #1 (Rescue Boat RB-01) has not gone en-route within 3 minutes of dispatch.",
      "acknowledged": false,
      "created_at": "2026-09-19T04:23:00Z"
    }
  ],
  "count": 2
}
```

---

### Acknowledge an Alert

```
PATCH /alerts/{id}/acknowledge
```

**Request body:** None.

**Response `200`:**

```json
{
  "id": 1,
  "incident_id": 1,
  "kind": "critical",
  "message": "Critical incident #1 (flood, severity 4) has been unassigned for over 2 minutes.",
  "acknowledged": true,
  "created_at": "2026-09-19T04:14:00Z"
}
```

---

### Analytics Summary

```
GET /analytics/summary
```

**Response `200`:**

```json
{
  "incidents_by_type": {
    "flood": 3,
    "fire": 1,
    "accident": 2,
    "medical": 0,
    "industrial": 0,
    "other": 0
  },
  "avg_response_seconds": 385.5,
  "resource_shortages": [
    { "type": "rescue_boat", "available": 0, "total": 3 },
    { "type": "ambulance", "available": 1, "total": 5 }
  ],
  "hotspots": [
    { "lat": 22.3072, "lng": 73.1812, "count": 5 },
    { "lat": 22.2985, "lng": 73.1950, "count": 3 },
    { "lat": 22.3150, "lng": 73.1700, "count": 2 }
  ],
  "status_counts": {
    "new": 1,
    "dispatched": 2,
    "in_progress": 2,
    "resolved": 1
  }
}
```

---

### Run Simulation

```
POST /simulate/{scenario}
```

Where `scenario` is one of: `flood`, `factory_fire`, `road_accident`.

**Request body:** None.

**Response `200`:**

```json
{
  "scenario": "flood",
  "reports_generated": 15,
  "message": "Flood simulation started: 15 reports will be ingested over the next 30 seconds across Vadodara."
}
```

---

### Reset Simulation

```
POST /simulate/reset
```

**Request body:** None.

**Response `200`:**

```json
{
  "message": "All simulation data cleared. Resources reset to available."
}
```

---

## WebSocket — Live Updates

```
WebSocket /ws/live
```

The server pushes JSON messages to all connected clients. Each message has the shape:

```json
{
  "event": "...",
  "data": { "..." }
}
```

### Events

#### `incident_created`

```json
{
  "event": "incident_created",
  "data": {
    "id": 1,
    "type": "flood",
    "severity": 4,
    "priority": "critical",
    "status": "new",
    "lat": 22.3072,
    "lng": 73.1812,
    "location_name": "Akota, Vadodara",
    "summary": "Severe waterlogging in Akota area. Multiple residents trapped.",
    "confidence": 0.60,
    "report_count": 1,
    "created_at": "2026-09-19T04:12:00Z"
  }
}
```

#### `incident_updated`

```json
{
  "event": "incident_updated",
  "data": {
    "id": 1,
    "type": "flood",
    "severity": 4,
    "priority": "critical",
    "status": "dispatched",
    "lat": 22.3072,
    "lng": 73.1812,
    "location_name": "Akota, Vadodara",
    "summary": "Severe waterlogging in Akota area. 5 reports merged. Confidence rising.",
    "confidence": 0.85,
    "report_count": 5,
    "updated_at": "2026-09-19T04:18:30Z"
  }
}
```

#### `assignment_updated`

```json
{
  "event": "assignment_updated",
  "data": {
    "id": 1,
    "incident_id": 1,
    "resource_id": 3,
    "status": "en_route",
    "eta_seconds": 300,
    "dispatched_at": "2026-09-19T04:20:00Z",
    "arrived_at": null
  }
}
```

#### `alert_created`

```json
{
  "event": "alert_created",
  "data": {
    "id": 2,
    "incident_id": 1,
    "kind": "delayed",
    "message": "Assignment #1 (Rescue Boat RB-01) has not gone en-route within 3 minutes of dispatch.",
    "acknowledged": false,
    "created_at": "2026-09-19T04:23:00Z"
  }
}
```

#### `resource_updated`

```json
{
  "event": "resource_updated",
  "data": {
    "id": 3,
    "name": "Rescue Boat RB-01",
    "type": "rescue_boat",
    "status": "dispatched",
    "lat": 22.3120,
    "lng": 73.1780,
    "station": "Vadodara Fire Station #2",
    "capacity": 8
  }
}
```

---

## Error Format

All error responses use this shape:

```json
{
  "error": {
    "code": "not_found",
    "message": "Incident with id 99 not found."
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request — invalid input or missing required fields |
| `404` | Not found — resource does not exist |
| `422` | Unprocessable entity — validation error (e.g., invalid enum value) |
| `500` | Internal server error |

---

## Changelog

> Record every change to this contract below. Newest first.

| Date | Author | Change |
|---|---|---|
| 2026-09-19 | Setup | Initial API specification created. |
