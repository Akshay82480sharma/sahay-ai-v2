# Sahay AI — Intelligent Dispatch, Real-Road Routing & Simulation

### Core principle

> **Sahay selects the most suitable response vehicle, calculates real road-based routes using Google Maps/Routes, provides a recommended route and alternatives, lets the operator choose the route, tracks the vehicle along the actual road network, handles deviations without unnecessary backtracking, dynamically reroutes when conditions change, and can simulate the entire response through incident resolution.**

---

# 1. Complete system

```text
                         INCIDENT
                            │
                            ▼
                 ┌─────────────────────┐
                 │ AI INCIDENT ANALYSIS│
                 │                     │
                 │ Type                │
                 │ Severity            │
                 │ Location            │
                 │ People affected     │
                 │ Required capability │
                 └──────────┬──────────┘
                            │
                            ▼
                   REQUIRED RESOURCE
                    WATER_RESCUE
                            │
                            ▼
                 ┌─────────────────────┐
                 │ RESOURCE FILTER     │
                 │                     │
                 │ Available           │
                 │ Capability          │
                 │ Workload            │
                 │ Operational status  │
                 └──────────┬──────────┘
                            │
                            ▼
                    CANDIDATE VEHICLES
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          RESCUE-12     RESCUE-18     RESCUE-21
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                  GOOGLE ROUTES ENGINE
                            │
                  REAL ROAD NETWORK
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       PRIMARY          ALTERNATE 1       ALTERNATE 2
        6 min              8 min             11 min
        4.8 km             5.6 km             7.1 km
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    ROUTE EVALUATION
                            │
             Traffic / Flood / Closures
             Distance / ETA / Route Risk
                            │
                            ▼
                   SAHAY RECOMMENDS
                            │
                            ▼
                    HUMAN OPERATOR
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          SELECT ROUTE            MODIFY ROUTE
                 │                     │
                 └──────────┬──────────┘
                            ▼
                         DISPATCH
                            │
                            ▼
               ┌────────────────────────┐
               │ LIVE OR SIMULATION     │
               │ MODE                   │
               └───────────┬────────────┘
                           │
                           ▼
                  VEHICLE FOLLOWS
                 ACTUAL ROAD GEOMETRY
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             ON ROUTE             DEVIATED
                 │                   │
                 │                   ▼
                 │            CHECK FORWARD
                 │            REJOIN POINT
                 │                   │
                 │            ┌──────┴──────┐
                 │            ▼             ▼
                 │          REJOIN       NO REJOIN
                 │            │             │
                 │            │             ▼
                 │            │       NEW SAFE ROUTE
                 │            │             │
                 └────────────┴─────────────┘
                              │
                              ▼
                           ARRIVAL
                              │
                              ▼
                     RESPONSE / RESCUE
                              │
                              ▼
                          RESOLVED
                              │
                              ▼
                     RESOURCE RELEASED
                              │
                              ▼
                          ANALYTICS
```

---

# 2. Vehicle selection

Sahay **doesn't choose the nearest vehicle blindly**.

For an incident requiring water rescue:

```text
RESCUE-12
Water Rescue      ✓
Available         ✓
ETA               6 min
Distance          4.8 km

RESCUE-18
Water Rescue      ✓
Available         ✓
ETA               11 min
Distance          7.2 km

FIRE-03
Water Rescue      ✗

AMB-07
Water Rescue      ✗
```

Sahay ranks the suitable resources using things such as:

* capability match
* availability
* ETA
* distance
* workload
* route safety
* emergency priority

Then:

> **Recommended Resource: RESCUE-12**

---

# 3. Real Google Maps routing

This is important:

### Don't draw a straight line.

The route must follow the **actual road network**, just like Google Maps.

```text
BAD

🚑 ─────────────────────── 🚨
```

Instead:

```text
GOOD

🚑
 │
 ├─────────────┐
 │             │
 │             └────────┐
 │                      │
 └───────┐              │
         └──────────────┴──── 🚨
```

Google Routes provides the actual route geometry.

Your simulation uses those road points to move the vehicle.

---

# 4. Three routes

For the selected vehicle:

### Recommended

```text
PRIMARY
6 min
4.8 km
Low risk
```

### Alternate 1

```text
ALTERNATE
8 min
5.6 km
Avoids congestion
```

### Alternate 2

```text
ALTERNATE
11 min
7.1 km
Avoids flood-affected road
```

On the map:

```text
                    🚨 INCIDENT
                       ●
                      ╱
                     ╱  PRIMARY
                    ╱
                   ╱
                  ╱
             🚑 RESCUE-12

        ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄
            ALTERNATE 1

      ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄
            ALTERNATE 2
```

Primary route = prominent.
Alternatives = subdued.

---

# 5. Operator chooses the route

The operator isn't forced to use Sahay's recommendation.

```text
┌──────────────────────────────────┐
│ RESPONSE ROUTES                   │
│                                  │
│ ● RECOMMENDED                    │
│   6 min • 4.8 km                 │
│   Fastest safe route             │
│                                  │
│ ○ ALTERNATE 1                    │
│   8 min • 5.6 km                 │
│   Avoids congestion              │
│                                  │
│ ○ ALTERNATE 2                    │
│   11 min • 7.1 km                │
│   Avoids flood zone              │
│                                  │
│ [ USE SELECTED ROUTE ]           │
└──────────────────────────────────┘
```

If they choose Alternate 1:

```text
Selected Route = Alternate 1
```

That route is stored with the dispatch.

---

# 6. Dispatch

```text
INC-1042
      +
RESCUE-12
      +
ALTERNATE-1
      ↓
   DISPATCH
```

Vehicle state:

```text
AVAILABLE
    ↓
ASSIGNED
    ↓
EN ROUTE
```

---

# 7. Real-road vehicle movement

The vehicle marker doesn't teleport between arbitrary coordinates.

It follows the **actual Google route path**:

```text
Google Route
     ↓
Road geometry
     ↓
Route coordinates
     ↓
Simulation/vehicle position
     ↓
Marker movement
```

The vehicle can:

* follow turns
* follow curves
* move through intersections
* change heading
* update ETA
* update distance remaining
* follow the selected route

So visually it behaves much more like Google Maps navigation.

---

# 8. Live vehicle panel

```text
┌──────────────────────────────────┐
│ RESCUE-12                        │
│ ● EN ROUTE                       │
│                                  │
│ ETA             6 min            │
│ Distance        4.8 km           │
│ Speed           42 km/h          │
│                                  │
│ Route                           │
│ Alternate 1                      │
│                                  │
│ ███████████░░░ 72%               │
│                                  │
│ NEXT                             │
│ ↰ Turn left onto Harni Ring Rd  │
│ 450 m                            │
│                                  │
│ [ CHANGE ROUTE ]                 │
└──────────────────────────────────┘
```

---

# 9. Intelligent wrong-turn handling

Suppose the operator chose:

```text
Alternate 1
```

But the simulated/real vehicle takes another road.

Sahay detects:

```text
Vehicle ≠ selected route
```

Then:

### Step 1

Check whether the vehicle can safely reconnect **ahead**.

```text
Current vehicle
      🚑
       \
        \
         ● Safe rejoin point
         │
         │
Selected ─┴──────────────────► Incident
route
```

If yes:

> **Safe forward rejoin available.**

The system does **not unnecessarily send the vehicle backwards**.

---

# 10. If rejoining isn't possible

Sahay checks whether the selected route has become invalid.

For example:

```text
🚧 ROAD CLOSURE
```

Then:

```text
Selected route
      ↓
Unsafe / blocked
      ↓
Calculate new routes
      ↓
Evaluate
      ↓
Recommend new route
      ↓
Operator approval
```

Example:

```text
⚠ ROUTE CHANGE

Selected route blocked.

Recommended:
8 min • 5.9 km

Reason:
Road closure detected.

[ ACCEPT NEW ROUTE ]
[ VIEW ALTERNATIVES ]
```

---

# 11. Simulation mode

Now the exact same system can run without a real vehicle.

The only thing replaced is the location source:

```text
REAL MODE

Real GPS
   ↓
Sahay Engine


SIMULATION MODE

Simulated GPS
   ↓
Sahay Engine
```

Everything else stays the same.

That means simulation uses:

* the same resource selection
* the same Google routes
* the same primary/alternate routes
* the same dispatch
* the same route monitoring
* the same deviation handling
* the same resolution workflow

---

# 12. Simulation follows actual roads too

This is the key point.

If Google returns:

```text
A → B → C → D → E → Incident
```

the simulation moves:

```text
A
 ↓
B
 ↓
C
 ↓
D
 ↓
E
 ↓
🚨
```

along the **actual road geometry**.

Not:

```text
A ────────────────── 🚨
```

So your simulated RESCUE-12 actually looks like it's driving through Vadodara.

---

# 13. Simulation controls

```text
┌────────────────────────────────────────────┐
│ SIMULATION MODE                            │
│                                            │
│ Scenario                                   │
│ [ Flood Rescue ▼ ]                         │
│                                            │
│ Incident                                   │
│ INC-SIM-001                                │
│                                            │
│ Vehicle                                    │
│ RESCUE-12                                  │
│                                            │
│ Route                                      │
│ ● Recommended                              │
│ ○ Alternate 1                              │
│ ○ Alternate 2                              │
│                                            │
│ Speed                                      │
│ [1×] [2×] [5×] [10×]                      │
│                                            │
│ [ ▶ START ] [ ⏸ PAUSE ] [ ↻ RESTART ]      │
└────────────────────────────────────────────┘
```

---

# 14. Simulation events

During the simulation, you can trigger real-road events:

```text
[ WRONG TURN ]

[ ROAD CLOSURE ]

[ TRAFFIC INCREASE ]

[ FLOOD ZONE ACTIVATED ]

[ VEHICLE DELAY ]

[ FORCE ROUTE DEVIATION ]
```

For example:

```text
ROAD CLOSURE
      ↓
Selected road becomes unavailable
      ↓
Sahay recalculates Google route
      ↓
Alternate route becomes recommended
      ↓
Operator accepts
      ↓
Vehicle continues along actual roads
```

---

# 15. Incident resolution

When the vehicle reaches the incident:

```text
EN ROUTE
   ↓
ARRIVED
   ↓
ON SCENE
   ↓
RESPONSE STARTED
   ↓
RESCUE IN PROGRESS
   ↓
RESOLVED
   ↓
CLOSED
```

Example:

```text
15:36  Incident reported
15:37  AI classified CRITICAL
15:38  RESCUE-12 selected
15:39  Alternate 1 selected
15:39  Dispatch approved
15:42  Vehicle deviation detected
15:43  Forward rejoin calculated
15:46  Vehicle back on route
15:49  Arrived
15:50  Rescue started
15:55  6 people rescued
15:56  Incident resolved
15:57  RESCUE-12 available
```

---

# 16. Resolution panel

```text
┌──────────────────────────────────┐
│ INCIDENT RESPONSE                │
│                                  │
│ INC-SIM-001                      │
│ FLOOD RESCUE                     │
│                                  │
│ RESCUE-12                        │
│ ● ON SCENE                       │
│                                  │
│ People Reported       6          │
│ People Rescued        6          │
│                                  │
│ Situation                         │
│ [ Under Control ▼ ]              │
│                                  │
│ Notes                             │
│ Rescue operation completed.      │
│                                  │
│ [ MARK AS RESOLVED ]             │
└──────────────────────────────────┘
```

After resolution:

```text
Incident
   ↓
RESOLVED
   ↓
Resource → AVAILABLE
   ↓
Timeline updated
   ↓
Analytics updated
   ↓
Notifications
```

---

# 17. The final architecture

```text
                         SAHAY AI
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   INCIDENT ENGINE    RESOURCE ENGINE    SIMULATION ENGINE
          │                 │                 │
          │                 │            Simulated GPS
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                     DISPATCH ENGINE
                            │
                            ▼
                    ROUTING ENGINE
                            │
                     GOOGLE ROUTES
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          PRIMARY       ALTERNATE 1    ALTERNATE 2
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                    ROUTE SELECTION
                            │
                      HUMAN APPROVAL
                            │
                            ▼
                         DISPATCH
                            │
                            ▼
                   ROAD-BASED TRACKING
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
              ON ROUTE              DEVIATED
                 │                     │
                 │              Forward rejoin?
                 │                /         \
                 │              YES          NO
                 │               │            │
                 │             REJOIN     NEW ROUTE
                 │                            │
                 └────────────┬───────────────┘
                              ▼
                           ARRIVAL
                              │
                              ▼
                      RESPONSE / RESCUE
                              │
                              ▼
                          RESOLUTION
                              │
                              ▼
                      RESOURCE RELEASE
                              │
                              ▼
                         ANALYTICS
```

## The final Sahay concept

**Incident → AI analysis → suitable vehicle → Google real-road routing → primary + alternate routes → operator route selection → dispatch → real/simulated road-based vehicle movement → deviation detection → forward rejoin or safe rerouting → arrival → response → resolution → resource becomes available.**

This keeps **Google Maps responsible for actual road routing and geometry**, while **Sahay remains responsible for emergency intelligence, resource selection, route preference, safety context, dispatch, simulation and resolution**.
