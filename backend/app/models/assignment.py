from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    status = Column(String, nullable=False, default="dispatched")
    eta_seconds = Column(Integer, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    reasoning = Column(String, nullable=True)

    incident = relationship("Incident", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")