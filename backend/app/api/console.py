"""PS3 Operator Console API — tracks, telemetry, zones, alerts, audit, demo.

Route map (mounted under /api):
  GET    /api/health                 (existing router, extended)
  GET    /api/tracks                 list correlated tracks
  POST   /api/telemetry              ingest an external telemetry report
  GET    /api/zones                  list zones
  POST   /api/zones                  create zone (incl. temporary red zone)
  DELETE /api/zones/{zone_id}        delete zone
  GET    /api/alerts                 alert queue
  POST   /api/alerts/{id}/disposition  confirm / dismiss / escalate
  GET    /api/audit                  audit records
  GET    /api/audit/export           CSV / JSON evidence export
  GET    /api/authorization          registry state
  POST   /api/authorization          register a remote ID (supervisor)
  GET    /api/metrics                pipeline latency metrics
  POST   /api/demo/randomize         randomize airspace
  POST   /api/demo/spawn             spawn authorized/unregistered/violator
  POST   /api/demo/lost-link         drop a link
  POST   /api/demo/clear             clear tracks
"""
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

from backend.app.services.console_service import console_service
from backend.app.services.zones import zone_engine, validate_zone_payload, ZONE_TYPES
from backend.app.services.audit import audit_log, RETENTION_CHOICES_DAYS
from backend.app.services.registry import REASON_CODES, ROLES

router = APIRouter()

DEMO_OPERATOR = "DEMO-OPERATOR-01"
DEMO_ROLE = "OPERATOR"


def _op(operator_id: Optional[str], role: Optional[str]):
    """Resolve demo identity; every action is attributed."""
    oid = (operator_id or DEMO_OPERATOR).strip()
    r = (role or DEMO_ROLE).upper()
    if r not in ROLES:
        raise HTTPException(status_code=422, detail=f"role must be one of {ROLES}")
    return oid, r


# ── Schemas ──
class TelemetryReport(BaseModel):
    track_id: Optional[str] = None
    remote_id: Optional[str] = None
    timestamp: Optional[float] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude_m: float = Field(..., ge=-500, le=25000)
    velocity_mps: Optional[float] = None
    heading_deg: Optional[float] = None
    authorization_status: Optional[str] = None
    source: Optional[str] = None
    track_confidence: Optional[float] = None


class TelemetryBatch(BaseModel):
    reports: List[TelemetryReport] = Field(..., min_length=1, max_length=100)


class ZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    zone_type: str
    geometry: Dict[str, Any]
    min_altitude_m: float = Field(..., ge=-500, le=25000)
    max_altitude_m: float = Field(..., ge=-500, le=25000)
    duration_s: Optional[float] = Field(None, ge=5, le=86400)
    operator_id: Optional[str] = None
    operator_role: Optional[str] = None

    @field_validator("zone_type")
    @classmethod
    def _zt(cls, v):
        v = str(v).upper()
        if v not in ZONE_TYPES:
            raise ValueError(f"zone_type must be one of {ZONE_TYPES}")
        return v


class DispositionRequest(BaseModel):
    action: str
    reason_code: str
    operator_id: Optional[str] = None
    operator_role: Optional[str] = None


class RegisterRequest(BaseModel):
    remote_id: str = Field(..., min_length=1, max_length=64)
    status: str = "AUTHORIZED"
    operator_id: Optional[str] = None
    operator_role: Optional[str] = None


class SpawnRequest(BaseModel):
    kind: str = "UNREGISTERED"
    operator_id: Optional[str] = None
    operator_role: Optional[str] = None


class RetentionRequest(BaseModel):
    retention_days: int
    operator_id: Optional[str] = None
    operator_role: Optional[str] = None


# ── Tracks / telemetry ──
@router.get("/tracks")
async def get_tracks():
    t0 = time.perf_counter()
    console_service.tick()  # advance simulation through the same ingest pipeline
    data = console_service.get_tracks()
    data["console_latency_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
    data["simulated"] = True
    return data


@router.post("/telemetry")
async def post_telemetry(report: TelemetryReport):
    """Ingest one telemetry report through the full pipeline."""
    try:
        tr = console_service.ingest(report.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {"accepted": True, "track": tr}


@router.post("/telemetry/batch")
async def post_telemetry_batch(batch: TelemetryBatch):
    out, errors = [], []
    for rep in batch.reports:
        try:
            tr = console_service.ingest(rep.model_dump(exclude_none=True))
            out.append(tr)
        except ValueError as e:
            errors.append({"report": rep.model_dump(exclude_none=True), "error": str(e)})
    return {"accepted": len(out), "rejected": len(errors), "tracks": out, "errors": errors}


# ── Zones ──
@router.get("/zones")
async def get_zones():
    zones = zone_engine.list_zones()
    now = time.time()
    for z in zones:
        if z["expires_at"]:
            z["expired"] = now >= z["expires_at"]
    return {"zones": zones, "count": len(zones)}


@router.post("/zones")
async def create_zone(zone: ZoneCreate):
    try:
        fields = validate_zone_payload(zone.model_dump(), require_all=True)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    operator_id, role = _op(zone.operator_id, zone.operator_role)
    try:
        from backend.app.services.registry import validate_operator
        validate_operator(operator_id, role, "create_zone")
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=403, detail=str(e))
    z = zone_engine.create_zone(
        name=fields["name"], zone_type=fields["zone_type"],
        coordinates=fields["coordinates"],
        min_altitude_m=fields["min_altitude_m"], max_altitude_m=fields["max_altitude_m"],
        duration_s=fields.get("duration_s"), created_by=operator_id,
    )
    audit_log.append(operator_id=operator_id, operator_role=role, action="ZONE_CREATE",
                     reason_code="OPERATOR REVIEW", new_status=z["zone_id"],
                     details={"zone_name": z["name"], "zone_type": z["zone_type"],
                              "temporary": z["temporary"]})
    return {"created": True, "zone": z}


@router.delete("/zones/{zone_id}")
async def delete_zone(zone_id: str, operator_id: Optional[str] = None,
                      operator_role: Optional[str] = None):
    operator_id, role = _op(operator_id, operator_role)
    z = zone_engine.get_zone(zone_id)
    if not z:
        raise HTTPException(status_code=404, detail=f"unknown zone '{zone_id}'")
    zone_engine.delete_zone(zone_id)
    audit_log.append(operator_id=operator_id, operator_role=role, action="ZONE_DELETE",
                     reason_code="OPERATOR REVIEW", previous_status=zone_id,
                     details={"zone_name": z["name"]})
    return {"deleted": True, "zone_id": zone_id}


# ── Alerts / disposition ──
@router.get("/alerts")
async def get_alerts(status: Optional[str] = None):
    return console_service.get_alerts(status)


@router.post("/alerts/{alert_id}/disposition")
async def disposition(alert_id: str, req: DispositionRequest):
    operator_id, role = _op(req.operator_id, req.operator_role)
    try:
        result = console_service.disposition(
            alert_id, req.action, req.reason_code, operator_id, role)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


# ── Audit ──
@router.get("/audit")
async def get_audit(limit: int = 100):
    return {"records": audit_log.list_records(limit=min(limit, 500)),
            "retention_days": audit_log.retention_days,
            "chain": audit_log.verify_chain(),
            "append_only": True}


@router.get("/audit/export")
async def export_audit(fmt: str = Query("csv", pattern="^(csv|json)$"),
                       operator_id: Optional[str] = None,
                       operator_role: Optional[str] = None):
    operator_id, role = _op(operator_id, operator_role)
    try:
        from backend.app.services.registry import validate_operator
        validate_operator(operator_id, role, "export_audit")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    try:
        data = audit_log.export(fmt)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    audit_log.append(operator_id=operator_id, operator_role=role, action="AUDIT_EXPORT",
                     reason_code="OPERATOR REVIEW", new_status=fmt.upper())
    return Response(
        content=data["content"],
        media_type=data["media_type"],
        headers={"Content-Disposition": f'attachment; filename="{data["filename"]}"'},
    )


@router.post("/audit/retention")
async def set_retention(req: RetentionRequest):
    operator_id, role = _op(req.operator_id, req.operator_role)
    try:
        result = audit_log.set_retention(req.retention_days, operator_id, role)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.post("/audit/purge")
async def purge_audit():
    purged = audit_log.purge_expired()
    return {"purged": purged, "retention_days": audit_log.retention_days}


# ── Authorization registry ──
@router.get("/authorization")
async def get_authorization():
    return console_service.registry.list_all()


@router.post("/authorization")
async def register_authorization(req: RegisterRequest):
    operator_id, role = _op(req.operator_id, req.operator_role)
    try:
        from backend.app.services.registry import validate_operator
        validate_operator(operator_id, role, "manage_retention")  # supervisor-only
        entry = console_service.registry.register(
            req.remote_id, req.status.upper(), operator_id=operator_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    audit_log.append(operator_id=operator_id, operator_role=role, action="AUTHORIZATION_SET",
                     track_id=req.remote_id, reason_code="OPERATOR REVIEW",
                     new_status=entry["status"])
    return {"registered": True, "entry": entry}


# ── Metrics ──
@router.get("/metrics")
async def get_metrics():
    return console_service.get_metrics()


# ── Demo controls ──
@router.post("/demo/randomize")
async def demo_randomize():
    result = console_service.demo_randomize()
    audit_log.append(operator_id="DEMO-OPERATOR-01", operator_role="OPERATOR",
                     action="DEMO_RANDOMIZE", reason_code="OPERATOR REVIEW",
                     new_status=f"{result['spawned']} ACTORS")
    return {**result, "simulated": True}


@router.post("/demo/spawn")
async def demo_spawn(req: SpawnRequest):
    operator_id, role = _op(req.operator_id, req.operator_role)
    try:
        result = console_service.demo_spawn(req.kind, operator_id, role)
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    audit_log.append(operator_id=operator_id, operator_role=role, action="DEMO_SPAWN",
                     track_id=result["track_id"], reason_code="OPERATOR REVIEW",
                     new_status=req.kind.upper())
    return {**result, "simulated": True}


@router.post("/demo/route-violator")
async def demo_route_violator(track_id: Optional[str] = None):
    try:
        result = console_service.demo_route_violator(track_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {**result, "simulated": True}


@router.post("/demo/lost-link")
async def demo_lost_link(track_id: Optional[str] = None):
    try:
        result = console_service.demo_lost_link(track_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {**result, "simulated": True}


@router.post("/demo/restore-links")
async def demo_restore_links():
    return console_service.demo_restore_links()


@router.post("/demo/clear")
async def demo_clear():
    result = console_service.demo_clear_tracks()
    return {**result, "simulated": True}


@router.get("/demo/constants")
async def demo_constants():
    from backend.app.services.telemetry_simulator import CENTER_LAT, CENTER_LON
    from backend.app.services.registry import REASON_CODES as RC, ROLES as R
    return {"center": {"lat": CENTER_LAT, "lon": CENTER_LON},
            "reason_codes": RC, "roles": R,
            "retention_choices": list(RETENTION_CHOICES_DAYS)}
