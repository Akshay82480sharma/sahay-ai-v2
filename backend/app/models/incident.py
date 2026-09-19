from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False, default="new")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    report_count = Column(Integer, nullable=False, default=1)
    required_resources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    reports = relationship("Report", back_populates="incident")
    assignments = relationship("Assignment", back_populates="incident")