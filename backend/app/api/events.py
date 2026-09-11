"""Events API endpoint — detection event history."""
from fastapi import APIRouter

from backend.app.services.event_service import event_service

router = APIRouter()


@router.get("")
async def get_events(limit: int = 50):
    """Get recent detection events."""
    return event_service.get_events(limit=min(limit, 200))


@router.delete("")
async def clear_events():
    """Clear all stored events."""
    event_service.clear()
    return {"status": "cleared"}
