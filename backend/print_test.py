from app.routers.reports import create_report
from app.schemas.report import ReportCreate
from app.core.database import SessionLocal, Base, engine

Base.metadata.create_all(bind=engine)
db = SessionLocal()
report = ReportCreate(text="Flood at station", source="citizen", location_name="vadodara junction")
res = create_report(report, db)
print("Incident LAT:", res["incident"].lat)
print("Incident LNG:", res["incident"].lng)
