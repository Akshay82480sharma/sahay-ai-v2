from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.core.errors import register_exception_handlers
from app.routers import health, ws, dispatch, assignments, facilities, resources, reports, incidents
import app.models  # Ensures models are registered before create_all

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sahay AI API")

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