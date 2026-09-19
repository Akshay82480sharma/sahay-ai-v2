from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    available_beds = Column(Integer, nullable=False)