# Sahay AI - Backend

The backend for Sahay AI is a high-performance, real-time emergency coordination API built with FastAPI and SQLite. It handles the ingestion of citizen reports, AI-driven classification, automated deduplication, intelligent resource recommendation, and real-time dispatcher updates via WebSockets.

## Architecture

- **FastAPI**: Provides the asynchronous ASGI framework and automatic OpenAPI generation.
- **SQLite + SQLAlchemy**: Lightweight relational database used for the hackathon (easily swappable to PostgreSQL).
- **WebSockets**: Broadcasts live updates (`incident_created`, `incident_updated`, `assignment_updated`) to connected frontend clients with zero polling.
- **Resilient AI Pipeline**: Uses the Gemini API for natural language extraction (determining incident type, severity, priority, and required resources). Crucially, the pipeline features a **zero-downtime fallback mechanism** to a keyword-based rules engine if the LLM provider times out or fails.
- **Local Geocoding**: Translates raw text locations (e.g., "Alkapuri") into spatial coordinates (lat/lng) using a local cache for immediate dispatch routing.

## Project Structure

```text
backend/
├── app/
│   ├── core/         # Config, Database setup, Global error handlers
│   ├── data/         # Seed data (facilities, resources, simulator scenarios)
│   ├── models/       # SQLAlchemy ORM definitions
│   ├── routers/      # API endpoints (reports, incidents, assignments, etc.)
│   ├── schemas/      # Pydantic validation models (matches API_SPEC.md exactly)
│   ├── services/     # Core business logic (LLM, Deduplication, Dispatcher, Simulator)
│   └── utils/        # Haversine spatial calculations & ETA estimators
├── scripts/          # Database seeding scripts
├── tests/            # Comprehensive Pytest suite (27 passing tests)
├── requirements.txt  # Python dependencies
└── pytest.ini        # Pytest configuration
```

## Setup & Running

1. **Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   Copy the `.env.example` in the repository root to `.env` (git-ignored) and fill in your `GEMINI_API_KEY`.
   ```bash
   cp ../.env.example ../.env
   ```
   *Note: If `GEMINI_API_KEY` is not provided, the backend automatically uses the keyword fallback.*

4. **Seed Database (Optional but Recommended)**:
   ```bash
   PYTHONPATH=. python scripts/seed.py
   ```

5. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.
   Interactive API documentation (Swagger) is available at `http://localhost:8000/docs`.

## Testing

The backend is fully tested using `pytest` and `httpx`. The test suite uses an in-memory SQLite database (`sqlite:///:memory:`) configured with a `StaticPool` to ensure robust threading support during tests.

To run the test suite:
```bash
pytest tests/
```

## Core Features

- **Deduplication Engine**: Automatically merges new incident reports with existing active incidents within a 2.0 km radius if they share the same type.
- **Scenario Simulator**: A built-in stress-testing engine (`POST /simulate/flood`) that injects dozens of coordinated reports to demonstrate the platform's deduplication, resource allocation, and alert engines under load.
- **Dynamic ETA**: Calculates real-world estimated times of arrival using Haversine great-circle distance augmented by a realistic road-network factor and specific resource speeds (e.g., ambulances vs. rescue boats).
