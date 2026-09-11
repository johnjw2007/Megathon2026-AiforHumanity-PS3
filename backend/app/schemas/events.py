from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class EventRecord(BaseModel):
    id: int
    timestamp: float
    target_id: Optional[str] = None
    radar_state: Optional[str] = None
    vision_state: Optional[str] = None
    rf_state: Optional[str] = None
    fusion_result: str
    confidence: float
    details: Dict[str, Any] = {}


class EventsResponse(BaseModel):
    events: list
    total: int
