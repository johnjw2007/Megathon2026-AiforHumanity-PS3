"""Health API endpoint."""
import time
from fastapi import APIRouter

router = APIRouter()

# Module-level start time to avoid circular import with main.app
_START_TIME = time.time()


@router.get("")
async def health_check():
    from backend.app.services.rf_service import rf_service
    from backend.app.services.vision_service import vision_service
    from backend.app.services.radar_service import radar_service
    from backend.app.services.fusion_service import fusion_service
    from backend.app.services.console_service import console_service
    from backend.app.services.audit import audit_log

    return {
        "status": "healthy",
        "version": "1.1.0",
        "uptime_seconds": round(time.time() - _START_TIME, 2),
        "components": {
            "backend": {"status": "ONLINE"},
            "rf_model": rf_service.get_status(),
            "vision": vision_service.get_status(),
            "radar": radar_service.get_status(),
            "fusion": fusion_service.get_status(),
            "feed_ingest": {"status": "ONLINE", "mode": "SIMULATED_REMOTE_ID"},
            "geofence": {"status": "ONLINE", "zones": len(zone_engine_active())},
            "authorization": {"status": "ONLINE"},
            "alert_engine": {"status": "ONLINE"},
            "audit": {"status": "ONLINE", "append_only": True,
                       "records": len(audit_log.list_records(limit=500))},
        },
    }


def zone_engine_active():
    from backend.app.services.zones import zone_engine
    return zone_engine.active_zones()
