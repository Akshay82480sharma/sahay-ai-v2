from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.core.errors import register_exception_handlers
from app.routers import health, ws, dispatch, assignments, facilities, resources, reports, incidents, simulate, alerts, analytics
import app.models  # Ensures models are registered before create_all
from contextlib import asynccontextmanager
import asyncio
from app.services.alerts import alert_loop
from app.core.database import SessionLocal
from scripts.seed import seed_if_empty

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed data
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
        
    # Start alert loop
    alert_task = asyncio.create_task(alert_loop(SessionLocal, interval=10))
    yield
    # Shutdown
    alert_task.cancel()
    try:
        await alert_task
    except asyncio.CancelledError:
        pass

from fastapi.responses import RedirectResponse

app = FastAPI(title="Sahay AI API", lifespan=lifespan)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(ws.router)
app.include_router(reports.router)
app.include_router(incidents.router)
app.include_router(dispatch.router)
app.include_router(assignments.router)
app.include_router(facilities.router)
app.include_router(resources.router)
app.include_router(simulate.router)
app.include_router(alerts.router)
app.include_router(analytics.router)