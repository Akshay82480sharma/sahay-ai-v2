# Sahay AI 🚑

> **[Read the Architecture Blueprint here!](./ARCHITECTURE.md)**

Sahay AI is an intelligent, real-time emergency dispatch and routing platform built for the **Bit N Build'26** Hackathon. It uses Gemini AI to instantly classify emergency reports and the Google Maps Routes API to dynamically navigate emergency vehicles around active crises, road closures, and traffic.

## ✨ Key Features

1. **AI Incident Triage**: Automatically categorizes incoming 911/emergency text streams by severity (1-5), incident type, and priority using Google's Gemini Flash.
2. **Intelligent Dispatch**: Evaluates all available emergency resources (ambulances, fire engines, rescue boats) and calculates the fastest unit to deploy based on real-time distances.
3. **Live Road Routing**: Utilizes the modern **Google Maps Routes REST API** to generate primary and alternate routes that perfectly trace real-world road geometry.
4. **Physics-Based Simulation**: A live simulation engine drives units along the route using easing curves, time-compression, and real-time telemetry (ETA, dynamic speedometer, distance remaining).
5. **Dynamic Rerouting**: Operator-triggered "Simulation Events" (like **Road Closures** or **Wrong Turns**) force the system to instantly calculate a Safe Forward Rejoin detour from the vehicle's exact mid-drive coordinates.
6. **3D Maps & Dark Mode**: A gorgeous, high-performance UI built with `@vis.gl/react-google-maps`, supporting 3D tilted satellite views, custom dark mode, and dynamic route highlighting.

---

## 📁 Project Structure

Sahay AI uses a highly modular, decoupled architecture:

```text
sahay-ai/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Configuration & Database logic
│   │   ├── models/           # SQLAlchemy ORM definitions
│   │   ├── routers/          # API & WebSocket endpoints
│   │   ├── schemas/          # Pydantic data validation
│   │   └── services/         # Business logic & LLM integrations
│   └── tests/                # 50+ Pytest automated backend tests
├── frontend/                 # React + Vite Application
│   └── src/
│       ├── api/              # Decoupled fetch/REST clients
│       ├── components/       # Feature-specific UI modules (dispatch, map, alerts)
│       ├── context/          # Global React state
│       └── hooks/            # Custom hooks & WebSocket subscriptions
└── docs/                     # Architecture & Specification blueprints
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

1. **Trigger simulation** → `POST /simulate/flood` generates ~16 incoming reports (citizen, sensor, field team) across Vadodara. Also available: `fire`, `road_accident`, `heatwave`, `festival`.
2. **AI processes reports** → classifies each as `flood`, estimates severity, geo-locates, and detects duplicates.
3. **Reports merge** → ~16 reports consolidate into ~3 distinct incidents with rising confidence scores.
4. **Dashboard updates live** → incidents appear on the dark CARTO basemap, severity indicators light up, resource panel shows availability.
5. **Map filtering** → operator toggles Incidents / Units / Hospitals / Flood Zones / Road Closures to focus on relevant layers.
6. **Incidents table** → navigate to the Incidents page to see all incidents in a filterable/searchable table with real-time counts by severity.
7. **Dispatch recommendation** → operator clicks an incident, sees AI-recommended teams with reasoning, approves dispatch.
8. **Delayed response alert** → one team doesn't go en-route within the threshold → escalation alert fires.
9. **Analytics view** → charts show incident types, response times, resource usage, and hotspot areas.

---

## 👥 Team

Built for **Bit N Build'26 — Gujarat Round** (Problem Statement PS-9).

| Name | Role | GitHub |
|---|---|---|
| *Rudrarajsinh Rana* | Backend (AI & Dashboard) | https://github.com/Ru-2008 |
| *Akshay Sharma* | Frontend (AI & Dashboard) | https://github.com/Akshay82480sharma |

---

## 🗺️ Roadmap & Phase Breakdown

The project was built concurrently by two developers (Person A & Person B) across 8 parallel phases:

- **Phase 0 (A0/B0)** — Repository setup, API contract, shared base models, and Geocoding setup.
- **Phase 1 (A1/A2 & B1)** — Thin slice backend (Report ingestion -> AI Classification) and WebSocket real-time wiring.
- **Phase 2 (A3/A4 & B2/B3/B4)** — React Frontend base, Incident Map/List, and Dispatch routing with human approval.
- **Phase 3 (A5 & B5/B6)** — Spatial deduplication engine, Scenario Simulator, automated Alerts, and Analytics.
- **Phase 4 (A6/A7 & B7)** — Real Gemini LLM integration, final polish, joint integration tests, and demo presentation.
- **Phase 5 (Hackathon Final)** — Deep-integration of Google Maps Routes API, dynamic simulation vehicles, live telemetry, and UI unification.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">
<sub>Built with ❤️ for smarter emergency response</sub>
</div>
