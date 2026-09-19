from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="available")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    station = Column(String, nullable=False)
    capacity = Column(Integer, nullable=True)

    assignments = relationship("Assignment", back_populates="resource")