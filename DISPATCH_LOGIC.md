# Sahay AI — Vehicle-to-Emergency Response Logic

The system does **not simply select the nearest vehicle**. It determines the **most suitable available vehicle**, calculates its **best route**, generates **alternate routes**, evaluates route safety, and presents the recommendation to a human operator.

## Complete flow

```text
                    EMERGENCY REPORT
                           │
                           ▼
                 ┌───────────────────┐
                 │ Incident Analysis │
                 │ Type / Severity   │
                 │ Location / Needs  │
                 └─────────┬─────────┘
                           │
                           ▼
                Required Capability
                  e.g. WATER_RESCUE
                           │
                           ▼
              ┌────────────────────────┐
              │ Resource Filtering     │
              │                        │
              │ • Available?           │
              │ • Correct capability?  │
              │ • Current workload?    │
              │ • Operational status?  │
              └───────────┬────────────┘
                          │
                          ▼
                  Suitable Vehicles
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
         RESCUE-12    RESCUE-18     RESCUE-21
             │            │            │
             └────────────┼────────────┘
                          ▼
                 ROUTE CALCULATION
                          │
                    Google Routes
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
        Primary Route            Alternate Routes
             │                         │
          ETA 6 min                 ETA 8 min
          4.8 km                    5.6 km
             │                         │
             └────────────┬────────────┘
                          ▼
                  ROUTE EVALUATION
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
            Traffic      Flood       Road
                         Zones      Closures
              │           │           │
              └───────────┼───────────┘
                          ▼
                  Sahay AI Ranking
                          │
                          ▼
              BEST VEHICLE + BEST ROUTE
                          │
                          ▼
                  AI RECOMMENDATION
                          │
                          ▼
                  HUMAN OPERATOR
                          │
                   ┌──────┴──────┐
                   ▼             ▼
                APPROVE        MODIFY
                   │             │
                   └──────┬──────┘
                          ▼
                       DISPATCH
                          │
                          ▼
                  REAL-TIME TRACKING
                          │
                          ▼
                 CONTINUOUS RE-ROUTING
```

---

## 1. Incident analysis

Suppose Sahay receives:

```text
INC-1042

Type: Flood
Severity: Critical
Location: 22.3291, 73.1962
People trapped: 6
Water level: 1.8 m
```

AI determines:

```text
Required capability:
WATER_RESCUE

Priority:
CRITICAL
```

---

## 2. Filter vehicles

Suppose the fleet is:

| Vehicle   | Capability   | Status    | Distance |
| --------- | ------------ | --------- | -------: |
| RESCUE-12 | Water Rescue | Available |   4.8 km |
| RESCUE-18 | Water Rescue | Available |   7.2 km |
| FIRE-03   | Fire         | Available |   3.1 km |
| AMB-07    | Medical      | Available |   2.9 km |

The system **doesn't automatically choose AMB-07 just because it's closest**.

Instead:

```text
WATER_RESCUE required
        ↓
RESCUE-12 ✅
RESCUE-18 ✅
FIRE-03 ❌
AMB-07 ❌
```

---

## 3. Calculate routes

For each suitable candidate, Sahay requests routing information.

Example:

### RESCUE-12

```text
Primary:
4.8 km
ETA: 6 min

Alternate 1:
5.6 km
ETA: 8 min

Alternate 2:
7.1 km
ETA: 11 min
```

### RESCUE-18

```text
Primary:
7.2 km
ETA: 11 min

Alternate 1:
8.0 km
ETA: 13 min

Alternate 2:
9.1 km
ETA: 15 min
```

---

## 4. Evaluate route safety

This is where **Sahay's own emergency data** becomes important.

Google provides road routing/ETA, while Sahay can overlay its own information:

```text
Flood Zone
Road Closure
Accident
Fire Zone
Congestion
Restricted Area
```

For example:

```text
RESCUE-12

Route A
ETA: 6 min
Distance: 4.8 km
Flood Risk: LOW
Traffic: LOW
────────────────
Route B
ETA: 8 min
Distance: 5.6 km
Flood Risk: LOW
Traffic: LOW
────────────────
Route C
ETA: 11 min
Distance: 7.1 km
Flood Risk: VERY LOW
Traffic: MEDIUM
```

Therefore:

```text
PRIMARY ROUTE
Route A → 6 min

ALTERNATE ROUTE
Route B → 8 min

SAFE FALLBACK
Route C → 11 min
```

---

## 5. Rank the vehicle

Now Sahay evaluates **vehicle + route**, rather than just vehicle distance.

Conceptually:

```text
Suitability
     +
Availability
     +
ETA
     +
Distance
     +
Route Safety
     +
Traffic
     +
Current Workload
     +
Emergency Capability
```

So the final recommendation could be:

```text
┌──────────────────────────────────────┐
│ AI RECOMMENDATION                    │
│                                      │
│ RESCUE-12                            │
│ Flood Rescue Unit                    │
│                                      │
│ ETA             6 min                │
│ Distance        4.8 km               │
│ Confidence      94%                  │
│                                      │
│ ✓ Correct capability                 │
│ ✓ Available                          │
│ ✓ Fastest safe route                 │
│ ✓ No conflicting assignment          │
│ ✓ Suitable for 6 trapped persons     │
│                                      │
│ PRIMARY ROUTE                        │
│ 6 min • 4.8 km • Low Risk            │
│                                      │
│ ALTERNATE ROUTES                     │
│ 8 min • 5.6 km • Low Risk            │
│ 11 min • 7.1 km • Very Low Risk      │
│                                      │
│ [ DISPATCH RESCUE-12 ]               │
│ [ VIEW ALTERNATIVES ]                │
└──────────────────────────────────────┘
```

---

## 6. Map visualization

The operator sees:

```text
                         INCIDENT
                            ●
                           / \
                          /   \
               PRIMARY   /     \  ALTERNATE
                        /       \
                       /         \
                      /           \
                 RESCUE-12
                     🚑
```

The **primary route** should be visually prominent.

The **alternate routes** should be less prominent so the map doesn't become cluttered.

Also show:

```text
● Incident
🚑 Selected Vehicle
○ Other Resources
━━ Primary Route
┄┄ Alternate Route
⚠ Road Closure
≈ Flood Zone
```

---

## 7. Human approval

Sahay should remain **human-in-the-loop**.

AI says:

> **Recommended: RESCUE-12 via Route A — ETA 6 min**

The operator can:

**Dispatch**

or

**View Alternatives**

or manually choose another resource/route.

This is important because the AI doesn't have complete situational awareness.

---

## 8. After dispatch

Vehicle state changes:

```text
AVAILABLE
    ↓
ASSIGNED
    ↓
EN ROUTE
    ↓
ARRIVED
    ↓
ON SCENE
    ↓
COMPLETED
    ↓
AVAILABLE
```

WebSockets update the dashboard in real time.

---

## 9. Dynamic re-routing

This is the part that can make the demo really strong.

Imagine RESCUE-12 is already travelling:

```text
RESCUE-12
ETA: 4 min
```

Then Sahay receives:

```text
ROAD B CLOSED
```

The system evaluates the route again:

```text
Current Route
     ↓
Road becomes unavailable
     ↓
Recalculate
     ↓
Primary route invalid
     ↓
Promote Alternate Route
     ↓
ETA updated
```

Dashboard:

```text
⚠ ROUTE CHANGE

Primary route blocked.

Alternate Route 1 selected.

Previous ETA: 4 min
New ETA: 7 min

Reason:
Road closure detected on current route.
```

The operator gets the update and can approve the change if required.

---

## The actual technical responsibility split

This is important for your architecture.

### Sahay Backend

Responsible for:

```text
Incident classification
        ↓
Required capability
        ↓
Resource availability
        ↓
Resource suitability
        ↓
Candidate selection
        ↓
Emergency-specific risk information
        ↓
Vehicle ranking
        ↓
Dispatch state
```

### Google Maps / Routes

Responsible for:

```text
Map visualization
        ↓
Road network
        ↓
Route calculation
        ↓
Distance
        ↓
ETA
        ↓
Traffic-aware routing
        ↓
Alternative routes
```

### WebSockets

Responsible for:

```text
Incident updates
Vehicle movement
ETA updates
Dispatch status
Route changes
Alerts
```

### Human Operator

Responsible for:

```text
Review recommendation
        ↓
Approve / modify
        ↓
Dispatch
        ↓
Monitor response
```

---

## The key idea for Sahay

Your system architecture should essentially say:

> **Sahay AI selects the right resource; Google determines how it can get there; Sahay evaluates emergency-specific conditions; and the human operator makes the final dispatch decision.**

That gives you a very clean technical story:

**Incident → Suitable Vehicle → Primary Route → Alternate Routes → Risk Evaluation → AI Recommendation → Human Approval → Dispatch → Live Tracking → Dynamic Re-routing.**

## 10. Operator Route Selection & Deviation Handling

The system supports two different modes for dispatching a vehicle:
1. **Recommended routing** - Sahay chooses the safest/fastest route.
2. **Operator-selected routing** - The operator explicitly chooses the Primary or Alternate Route, and the system respects that choice.

### Route Deviation Logic
Once a route is selected, the vehicle should **not blindly U-turn or force itself back onto the original route if it deviates**. It intelligently attempts to continue toward the destination and, when appropriate, reconnect to the selected route farther ahead.

**The core principle:** 
> *Respect the operator's route choice, but never prioritize route fidelity over safety and reachability.*

If the chosen route becomes compromised (e.g., a new road closure is reported), Sahay will **not** force the vehicle back onto the compromised route.

### Three Routing States

To implement this, Sahay relies on three explicit backend routing states:

1. **FOLLOW_SELECTED_ROUTE**
   The vehicle is following the operator-selected route safely.

2. **REJOIN_SELECTED_ROUTE**
   The vehicle deviated, but a safe forward connection to the selected route exists ahead. The system routes the vehicle to the connector without unnecessary backtracking.

3. **ADAPTIVE_REROUTE**
   The selected route is no longer suitable because of a new hazard (closure, flood, traffic). The system calculates a completely new safe route, notifies the operator, and continues toward the incident.
