<div align="center">

# 🚨 Sahay AI

**Intelligent Emergency Response & Resource Coordination Platform**

*Sahay (સહાય / सहाय) means "help" in Gujarati and Hindi*

[![Status](https://img.shields.io/badge/status-completed-success)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Bit N Build'26](https://img.shields.io/badge/hackathon-Bit%20N%20Build'26-blueviolet)]()
[![PS-9](https://img.shields.io/badge/problem-PS--9-blue)]()

</div>

---

> **Status:** 🚀 Completed for Bit N Build'26 Gujarat Round (PS-9).

---

## 📋 Problem

During **floods, fires, industrial accidents, and road incidents**, information pours in from many disconnected sources — emergency calls, citizen reports, IoT sensors, field teams, and hospitals. Authorities struggle to:

- See the **full situation** across all sources in real time.
- **Identify duplicates** — ten calls about the same collapsed bridge look like ten separate emergencies.
- **Decide which teams and equipment** to send, especially when resources are limited.
- **Detect delays** — a dispatched ambulance that never moves, an incident with no update for five minutes.
- **Coordinate across agencies** when local resources are exhausted.

The result: slower response times, wasted resources, and preventable harm.

---

## 💡 Solution

Sahay AI is a **command-centre platform** that:

1. **Collects reports** from citizens, calls, sensors, and field teams through a unified ingestion API.
2. **Uses AI to classify** each report by incident type, estimate severity (1–5), and assign priority.
3. **Detects and merges duplicates** — multiple reports about the same event are consolidated into a single incident with a rising confidence score.
4. **Recommends the right teams and equipment** with explainable reasoning, and suggests mutual aid when local units are short.
5. **Shows everything on a live dashboard** — active emergencies, severity, assigned teams, response status, and a real-time map.
6. **Alerts and escalates** — automatic notifications when a critical incident is unassigned, a team is delayed, or an incident has no update.
7. **Keeps a human in the loop** — dispatch is always approved by a human operator.

---

## ✅ Key Features

- [x] **Multi-source incident collection** — citizen reports, emergency calls, sensor data, field team updates
- [x] **AI classification & severity** — automatic incident type, severity (1–5), and priority assignment
- [x] **Duplicate detection & consolidation** — merge related reports into single incidents with confidence scoring
- [x] **Resource recommendation** — AI suggests teams and equipment with reasoning; mutual-aid flag when local resources are short
- [x] **Real-time command dashboard** — active emergencies, severity indicators, assigned teams, response status, live map
- [x] **Alerts & escalation** — critical-unassigned, delayed-response, and no-update alerts with configurable thresholds
- [x] **AI-generated summaries & recommendations** — natural-language incident summaries and dispatch explanations
- [x] **Analytics** — emergency types, response delays, resource shortages, frequently affected areas (hotspot map)
- [x] **Notifications** — Twilio SMS integration and inbound webhooks for external status updates
- [x] **Scenario simulator** — one-click flood simulations for demo and testing
- [x] **Deterministic Emergency Score** — strict math-based operational score combining AI severity, corroboration, and complexity
- [x] **Audit Logs & Timeline** — rigorous tracking of "who did what, when, and why" for every dispatch action

---

## 🌟 What Makes It Different

| Differentiator | Details |
|---|---|
| **Regional language support** | Understands reports in **Gujarati, Hindi, and Hinglish** — not just English. |
| **Confidence scoring** | Confidence rises as independent reports or sensor readings corroborate an incident; likely false reports are flagged. |
| **Explainable dispatch** | Shows *why* each team was chosen, and suggests **mutual aid** when local units are stretched thin. |
| **Human-in-the-loop** | AI recommends — a **human always gives final approval** before dispatch. |
| **Graceful degradation** | If the LLM API is unavailable, a **keyword-based fallback classifier** keeps the system running. |

---

# New Architecture section for `README.md`

**How to install it**

1. In `README.md`, select everything from `## 🏗️ Architecture` down to (but not including) the `---` above `## 🛠️ Tech Stack`.
2. Replace it with the block between the two `BEGIN` / `END` markers below. The markers are HTML comments, so they are invisible on GitHub and safe to leave in.
3. Both diagrams are Mermaid, so GitHub draws them. If the system map looks cramped, paste it into <https://mermaid.live> to preview and adjust.

---

<!-- BEGIN ARCHITECTURE SECTION -->
## 🏗️ Architecture

> **AI proposes. A human decides. The system never goes dark.**

Sahay is a five-stage pipeline. A report enters through one front door, is understood and matched against what is already known, and ends as a recommendation that only an operator can turn into a dispatch. This is the target design; the **Key Features** checklist above tracks what is built.

| Principle | What it means in the design |
|---|---|
| **Many voices, one incident** | Four sources (`citizen`, `call`, `sensor`, `field`) converge into a single incident. Every corroborating report raises its `confidence`. |
| **AI proposes, a human decides** | `POST /incidents/{id}/recommend` changes nothing. Only `POST /incidents/{id}/assign`, with `resource_ids` chosen by the operator, dispatches a unit. |
| **Never dark** | Every AI or network dependency has a local twin. A dead API key or a dropped connection degrades the system; it never stops it. |

### System map

```mermaid
flowchart TB
    classDef plain fill:#374151,stroke:#9ca3af,color:#f9fafb,stroke-width:1px
    classDef ai fill:#5b21b6,stroke:#c4b5fd,color:#f5f3ff,stroke-width:1px
    classDef human fill:#b45309,stroke:#fcd34d,color:#fffbeb,stroke-width:3px
    classDef offline fill:#134e4a,stroke:#2dd4bf,color:#ccfbf1,stroke-width:1.5px,stroke-dasharray:5 3
    classDef demo fill:#1f2937,stroke:#9ca3af,color:#e5e7eb,stroke-width:1.5px,stroke-dasharray:5 3

    subgraph SRC["Sources: the city speaks"]
        direction LR
        CIT["Citizens"]:::plain
        CAL["Calls"]:::plain
        SEN["Sensors"]:::plain
        FLD["Field teams"]:::plain
        SIM["Scenario simulator<br/>flood · factory fire · road accident"]:::demo
    end

    subgraph DOOR["1 · Front door: POST /reports"]
        direction LR
        ING["Ingestion API<br/>validate · normalise<br/>detect language: gu · hi-Latn · en"]:::plain
    end

    subgraph UND["2 · Understand: classifier.py"]
        direction LR
        GRD{{"Guard<br/>cache · cooldown<br/>5 s budget"}}:::plain
        LLM["Gemini tiers<br/>3.8 → 3.6 → 3.5 Flash-Lite<br/>first to answer wins"]:::ai
        KW["Keyword engine<br/>needs no internet"]:::offline
        CLS["Classified report<br/>type · severity 1–5 · priority<br/>needs · false-report flag"]:::plain
        LOC["Locate<br/>Vadodara gazetteer"]:::offline
        GRD --> LLM
        GRD -. "on failure" .-> KW
        LLM --> CLS
        KW --> CLS
        CLS --> LOC
    end

    subgraph CON["3 · Consolidate: dedupe.py"]
        direction LR
        DDP{"Similar incident<br/>nearby and recent?"}:::plain
        MRG["Merge into incident<br/>report_count +1<br/>confidence rises"]:::plain
        NEW["Open new incident<br/>status: new"]:::plain
        DDP -->|yes| MRG
        DDP -->|no| NEW
    end

    subgraph DEC["4 · Decide: dispatcher.py"]
        direction LR
        REC["Recommend<br/>POST …/recommend<br/>ranked by distance · ETA<br/>reasoning · mutual-aid flag"]:::ai
        HUM["Human gate<br/>operator approves<br/>or overrides"]:::human
        ASG["Assign<br/>POST …/assign<br/>the only path to dispatch"]:::plain
        REC --> HUM --> ASG
    end

    subgraph ACT["5 · Act and see"]
        direction LR
        TRK["Assignment tracker<br/>dispatched → en_route<br/>→ on_scene → completed"]:::plain
        ALR["Alert engine<br/>critical · delayed<br/>escalation · shortage"]:::plain
        NTF["Notifications<br/>mock SMS log<br/>Twilio optional"]:::offline
        WSH["WebSocket hub<br/>/ws/live · 5 events"]:::plain
        DSH["React dashboard<br/>map · incidents · alerts<br/>analytics"]:::plain
        TRK --> ALR
        TRK --> WSH
        ALR --> NTF
        ALR --> WSH
        WSH --> DSH
    end

    subgraph FND["Foundation: runs on one laptop"]
        direction LR
        DB[("SQLite or PostgreSQL<br/>reports · incidents · resources<br/>assignments · alerts · facilities")]:::plain
        SEED["Seed registry<br/>Vadodara units, hospitals, shelters"]:::plain
        CFG["Config<br/>LLM_PROVIDER = mock or gemini<br/>GEMINI_MODELS = tier order"]:::plain
    end

    SRC --> DOOR --> UND --> CON --> DEC --> ACT
    ACT -. "approve / override" .-> DEC
    ACT ~~~ FND

    style SRC fill:none,stroke:#8b949e,stroke-width:1px
    style DOOR fill:none,stroke:#8b949e,stroke-width:1px
    style UND fill:none,stroke:#8b949e,stroke-width:1px
    style CON fill:none,stroke:#8b949e,stroke-width:1px
    style DEC fill:none,stroke:#f59e0b,stroke-width:2px
    style ACT fill:none,stroke:#8b949e,stroke-width:1px
    style FND fill:none,stroke:#8b949e,stroke-width:1px,stroke-dasharray:5 3
```

**Legend:** 🟪 AI proposes · 🟧 human decides · ⬛ plain logic · dashed teal border = fallback that works offline · dashed grey border = demo tooling

### One report, end to end

The spec's own example message, followed through every stage, including the moment the LLM fails.

```mermaid
sequenceDiagram
    autonumber
    actor C as Citizen
    participant API as Ingestion API
    participant AI as Understand
    participant LLM as Gemini API
    participant KW as Keyword engine
    participant DD as Deduplicate
    participant WS as WebSocket hub
    actor OP as Operator
    participant DP as Dispatcher

    C->>API: POST /reports<br/>"Akota ma paani bhari gayun che, ghar ma 5 log phase che, jaldi madad bhejo"
    API->>API: validate · detect language (hi-Latn)
    API->>AI: classify(text, source)

    alt a Gemini tier answers within the 5 s budget
        AI->>LLM: classify (3.8 Flash, low thinking)
        Note over AI,LLM: A 429 or timeout moves to the next tier (3.6 Flash, then 3.5 Flash-Lite)
        LLM-->>AI: flood · severity 4 · Akota · needs 1 rescue boat
    else every tier fails or the budget is spent
        AI->>KW: match keywords (paani, bhari, madad)
        KW-->>AI: same output shape, no internet needed
    end

    AI-->>API: flood · severity 4 · critical
    API->>DD: find_or_create_incident
    alt a similar incident is nearby and recent
        DD->>DD: merge · report_count +1 · confidence rises
        DD-->>WS: incident_updated
    else first report of its kind
        DD->>DD: open incident · confidence 0.60
        DD-->>WS: incident_created
    end
    WS-->>OP: incident appears on the live map

    rect rgba(180, 83, 9, 0.18)
        Note over OP,DP: Human gate. The AI proposes, the operator decides.
        OP->>DP: POST /incidents/1/recommend
        DP-->>OP: Rescue Boat RB-01 (1.2 km, 7 min) and Ambulance AMB-04, each with reasoning
        Note over DP: No local boat free? mutual_aid is true and the pick comes from Anand (28 km).
        OP->>DP: POST /incidents/1/assign  with resource_ids 3 and 7
    end

    DP-->>WS: assignment_updated · resource_updated
    WS-->>OP: units shown en route
    Note over WS,OP: Alert engine keeps watching. Unassigned for 2 min, or not en route for 3 min, raises an alert.
```

### Where each differentiator lives

Every claim in **What Makes It Different** has a specific home in the architecture, and a matching field in `API_SPEC.md`.

| Differentiator | Where it lives | Proof in the contract |
|---|---|---|
| **Regional language support** | The front door detects the language; the keyword engine carries Gujarati, romanised and English tables. | `language` on every report (`gu`, `hi-Latn`, `en`) |
| **Confidence scoring** | Stage 3 merges each corroborating report, from any source, into the same incident. | `confidence` and `report_count` on every incident |
| **Explainable dispatch** | Stage 4 attaches a reason to every pick and flags mutual aid when local units run out. | `reasoning`, `mutual_aid`, `mutual_aid_reason` |
| **Human-in-the-loop** | Recommend and assign are separate endpoints. There is no code path from a recommendation to a dispatch. | `POST /incidents/{id}/assign` takes operator-chosen `resource_ids` |
| **Graceful degradation** | Guard, keyword engine, local gazetteer, mock SMS log, SQLite. | `GET /health` reports `llm_provider` and `database` |

### Components

Paths are under `backend/app/` unless shown in full.

| Component | Responsibility | Code |
|---|---|---|
| **Ingestion API** | One front door for all four sources. Validates, normalises and detects the language of each report. | `routers/reports.py`, `services/language.py` |
| **Understand** | One structured LLM call per report returns type, severity (1–5), priority, needed resources, a summary and a false-report flag. Place names resolve through the local gazetteer. A guard tries the Gemini tiers in order inside a 5-second budget, skips any tier that just hit its quota, and falls back to keywords if every tier fails. | `services/classifier.py`, `services/keyword_rules.py`, `services/llm/`, `services/geocode.py` |
| **Deduplicate** | Merges same-type reports that are nearby and recent into one incident, raising `confidence` and `report_count`. | `services/dedupe.py` |
| **Dispatcher** | Ranks available units by distance, ETA and capacity; attaches `reasoning`; flags mutual aid; creates assignments only after operator approval. | `services/dispatcher.py`, `routers/incidents.py`, `routers/assignments.py` |
| **Alert engine** | Watches configurable thresholds (for example, a critical incident unassigned for 2 minutes, or a unit not en route within 3) and raises `critical`, `delayed`, `escalation` and `shortage` alerts. | `services/alerts.py`, `routers/alerts.py` |
| **Notifications** | Records alerts sent to personnel as a mock SMS log. Twilio is optional. | `services/notifications.py` |
| **WebSocket hub** | Pushes `incident_created`, `incident_updated`, `assignment_updated`, `alert_created` and `resource_updated` to every open dashboard. | `services/events.py`, `routers/ws.py` |
| **Analytics** | Incidents by type, average response time, resource shortages and hotspots. | `services/analytics.py`, `routers/analytics.py` |
| **Scenario simulator** | Replays flood, factory-fire and road-accident scripts through the same front door as real reports, so the demo exercises the real pipeline. | `services/simulator.py`, `routers/simulate.py`, `data/scenarios/` |
| **React dashboard** | Live map, incident list and detail, dispatch panel with the approval button, resource panel, alert feed and analytics. | `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/` |
| **Data layer** | Reports, incidents, resources, assignments, alerts and facilities. SQLite locally; PostgreSQL when deployed. Seeded with Vadodara units and facilities. | `core/database.py`, `models/`, `backend/scripts/seed.py` |

### Never dark

Each dependency that can fail has a local twin, so the demo survives a bad network.

| Dependency | Preferred path | Local twin | Code |
|---|---|---|---|
| **Language model** | Gemini 3.8 Flash at low thinking; 3.6 Flash and 3.5 Flash-Lite take over on quota errors | A shared 5-second budget, a cache and a per-model cooldown. If every tier fails, the keyword engine returns the same output shape | `services/llm/gemini.py`, `services/classifier.py`, `services/keyword_rules.py` |
| **Place lookup** | The report carries `lat` and `lng` | The Vadodara gazetteer turns a place name into coordinates, with no online geocoder | `services/geocode.py`, `data/vadodara_places.json` |
| **Notifications** | Twilio SMS (optional) | Mock SMS log, so no alert is lost | `services/notifications.py` |
| **Database** | PostgreSQL with PostGIS (optional) | SQLite file, zero setup | `core/database.py` |
| **The whole AI layer** | A live LLM provider | `LLM_PROVIDER=mock` runs the entire pipeline with no API key | `services/llm/` |

### PS-9 coverage

| PS-9 requirement | Sahay component | Contract |
|---|---|---|
| Incident collection from multiple sources | Ingestion API and scenario simulator | `POST /reports`; `source`: `citizen`, `call`, `sensor`, `field` |
| Classification, severity and priority | Understand | `type`, `severity` 1–5, `priority` |
| Duplicate detection | Deduplicate | `report_count`, `confidence` |
| Resource recommendation | Dispatcher | `POST /incidents/{id}/recommend`; units and facilities (see note) |
| Real-time monitoring | WebSocket hub and dashboard | `/ws/live`; incident and assignment `status` |
| Alerts and escalation | Alert engine | `GET /alerts`; `kind`: `critical`, `delayed`, `escalation`, `shortage` |
| AI assistance | Summaries and reasoning | `summary` on incidents; `reasoning` on recommendations |
| Analytics | Analytics | `GET /analytics/summary`: `incidents_by_type`, `avg_response_seconds`, `resource_shortages`, `hotspots` |
| Notifications | Notifications | Mock SMS log; `alert_created` event |

**Note on equipment:** PS-9 lists *teams, vehicles, equipment and facilities* under resource recommendation. Sahay covers units (`ambulance`, `fire_engine`, `police`, `rescue_boat`, `other`) and facilities (`hospital`, `shelter`). The `Resource` object carries `capacity` but no separate equipment list.

**Data:** synthetic Vadodara seed data (units, hospitals, shelters) plus the scenario simulator, which supplies simulated citizen, sensor and field feeds.
<!-- END ARCHITECTURE SECTION -->


## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, WebSockets |
| **Database** | SQLite (dev), PostgreSQL with PostGIS (optional production) |
| **AI** | LLM API (Gemini / Claude) with keyword-based fallback classifier |
| **Frontend** | React, Vite, Tailwind CSS, Leaflet or MapLibre GL |
| **Notifications** | Mock SMS log (Twilio integration optional) |

---

## 📁 Project Structure

```
sahay-ai/
├── backend/                # Python + FastAPI
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # AI pipeline, dispatcher, alerts
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   └── core/           # Config, database, dependencies
│   ├── requirements.txt
│   └── tests/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Dashboard, Analytics, etc.
│   │   ├── hooks/          # Custom React hooks (WebSocket, etc.)
│   │   ├── services/       # API client
│   │   └── utils/          # Helpers
│   ├── package.json
│   └── vite.config.js
├── .env.example            # Environment variable template
├── .gitignore
├── API_SPEC.md             # API contract (source of truth)
├── CLAUDE.md               # AI coding-tool rules
├── AGENTS.md               # Quick-reference AI rules
├── PROGRESS.md             # Development log
├── README.md               # ← You are here
└── LICENSE                 # MIT
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** and `pip`
- **Node.js 18+** and `npm`

### 1. Clone the repository

```bash
git clone https://github.com/Ru-2008/sahay-ai.git
cd sahay-ai
cp .env.example .env
# Edit .env with your API keys if needed (mock mode works without keys)
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: [http://localhost:5173](http://localhost:5173)

### 4. Run the Demo Simulator

Once both backend and frontend are running:

```bash
# Trigger a flood simulation (generates ~15 reports)
curl -X POST http://localhost:8000/simulate/flood
```

Or use the Swagger UI at `/docs` to fire the simulation endpoint.

---

## 🎬 Demo Walkthrough (Flood Scenario)

1. **Trigger simulation** → `POST /simulate/flood` generates ~15 incoming reports (citizen, sensor, field team) across Vadodara.
2. **AI processes reports** → classifies each as `flood`, estimates severity, geo-locates, and detects duplicates.
3. **Reports merge** → ~15 reports consolidate into ~3 distinct incidents with rising confidence scores.
4. **Dashboard updates live** → incidents appear on the map, severity indicators light up, resource panel shows availability.
5. **Dispatch recommendation** → operator clicks an incident, sees AI-recommended teams with reasoning, approves dispatch.
6. **Delayed response alert** → one team doesn't go en-route within the threshold → escalation alert fires.
7. **Analytics view** → charts show incident types, response times, resource usage, and hotspot areas.

---

## 👥 Team

Built for **Bit N Build'26 — Gujarat Round** (Problem Statement PS-9).

| Name | Role | GitHub |
|---|---|---|
| *Rudrarajsinh Rana* | Backend (AI & Dashboard ) | https://github.com/Ru-2008 |
| *Akshay Sharma* | Frontend (AI & Dashboard ) | https://github.com/Akshay82480sharma |

---

## 🗺️ Roadmap & Phase Breakdown

The project was built concurrently by two developers (Person A & Person B) across 8 parallel phases:

- **Phase 0 (A0/B0)** — Repository setup, API contract, shared base models, and Geocoding setup.
- **Phase 1 (A1/A2 & B1)** — Thin slice backend (Report ingestion -> AI Classification) and WebSocket real-time wiring.
- **Phase 2 (A3/A4 & B2/B3/B4)** — React Frontend base, Incident Map/List, and Dispatch routing with human approval.
- **Phase 3 (A5 & B5/B6)** — Spatial deduplication engine, Scenario Simulator, automated Alerts, and Analytics.
- **Phase 4 (A6/A7 & B7)** — Real Gemini LLM integration, final polish, joint integration tests, and demo presentation.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">
<sub>Built with ❤️ for smarter emergency response</sub>
</div>
