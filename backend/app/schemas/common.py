from pydantic import BaseModel, PlainSerializer
from typing import Annotated
from datetime import datetime, timezone

def _to_utc_z(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

UtcDatetime = Annotated[datetime, PlainSerializer(_to_utc_z, return_type=str)]

class GenericMessage(BaseModel):
    message: str