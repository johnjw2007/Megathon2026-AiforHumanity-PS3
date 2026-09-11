"""Event Service — in-memory detection event storage."""
import time
from typing import Dict, Any, List, Optional


class EventService:
    """Stores recent detection events in memory."""

    def __init__(self, max_events: int = 100):
        self._events: List[Dict[str, Any]] = []
        self._counter = 0
        self._max = max_events

    def record(
        self,
        target_id: Optional[str] = None,
        radar_state: Optional[str] = None,
        vision_state: Optional[str] = None,
        rf_state: Optional[str] = None,
        fusion_result: str = "UNCERTAIN",
        confidence: float = 0.0,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        self._counter += 1
        event = {
            "id": self._counter,
            "timestamp": time.time(),
            "target_id": target_id,
            "radar_state": radar_state,
            "vision_state": vision_state,
            "rf_state": rf_state,
            "fusion_result": fusion_result,
            "confidence": round(confidence, 4),
            "details": details or {},
        }
        self._events.insert(0, event)
        if len(self._events) > self._max:
            self._events = self._events[: self._max]
        return event

    def get_events(self, limit: int = 50) -> Dict[str, Any]:
        return {
            "events": self._events[:limit],
            "total": len(self._events),
        }

    def clear(self):
        self._events.clear()


event_service = EventService()
