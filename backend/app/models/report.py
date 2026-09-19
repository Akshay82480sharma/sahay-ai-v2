from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(String, nullable=False)
    source = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    language = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    
    incident = relationship("Incident", back_populates="reports")