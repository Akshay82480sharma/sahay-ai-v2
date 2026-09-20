# Sahay AI 🚑

> **[Read the Architecture Blueprint here!](./ARCHITECTURE.md)**

Sahay AI is an intelligent, real-time emergency dispatch and routing platform. It uses Gemini AI to instantly classify emergency reports and Google Maps Routes API to dynamically navigate emergency vehicles around active crises, road closures, and traffic.

## Key Features

1. **AI Incident Triage**: Automatically categorizes incoming 911/emergency text streams by severity (1-5), incident type, and priority using Google's Gemini Flash.
2. **Intelligent Dispatch**: Evaluates all available emergency resources (ambulances, fire engines, rescue boats) and calculates the fastest unit to deploy based on real-time distances.
3. **Live Road Routing**: Utilizes the modern **Google Maps Routes REST API** to generate primary and alternate routes that perfectly trace real-world road geometry.
4. **Physics-Based Simulation**: A live simulation engine drives units along the route using easing curves, time-compression, and real-time telemetry (ETA, dynamic speedometer, distance remaining).
5. **Dynamic Rerouting**: Operator-triggered "Simulation Events" (like **Road Closures** or **Wrong Turns**) force the system to instantly calculate a Safe Forward Rejoin detour from the vehicle's exact mid-drive coordinates.
6. **3D Maps & Dark Mode**: A gorgeous, high-performance UI built with `@vis.gl/react-google-maps`, supporting 3D tilted satellite views, custom dark mode, and dynamic route highlighting.

## Getting Started

### Backend (FastAPI + WebSockets)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --env-file ../.env
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
