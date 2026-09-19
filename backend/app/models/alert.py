from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    kind = Column(String, nullable=False)
    message = Column(String, nullable=False)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))