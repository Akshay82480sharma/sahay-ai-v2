from datetime import datetime, timezone

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def format_iso8601_z(dt: datetime) -> str:
    """Returns ISO 8601 string ending in Z, e.g. 2026-09-19T04:12:00Z"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")