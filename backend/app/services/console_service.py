"""Console Service — the PS3 pipeline orchestrator.

Pipeline: SIMULATED TELEMETRY → FEED INGEST → TRACK CORRELATION →
ZONE/GEOFENCE ENGINE → AUTHORIZATION REGISTRY → ALERT ENGINE →
PRIORITY + SUGGESTED ACTION → OPERATOR DISPOSITION → AUDIT LOG.

Every telemetry report (simulator or POST /api/telemetry) flows through this
same ingest path. Latencies are measured, never fabricated.
"""
import itertools
import threading
import time
from typing import Dict, Any, List, Optional

from backend.app.services.registry import (
    AuthorizationRegistry, PRIORITY_RULES, ACTION_RULES, LOST_LINK_TIMEOUT_S,
    FEED_SOURCE, DARK_VESSEL_NOTE,
)
from backend.app.services.zones import zone_engine, seed_default_zones
from backend.app.services.audit import audit_log
from backend.app.services.telemetry_simulator import (
    TelemetrySimulator, TelemetryActor, CENTER_LAT, CENTER_LON,
    _meters_to_deg_lat, _meters_to_deg_lon,
)

_counters = {k: itertools.count(1) for k in ("ALERT", "TRK")}
_counters_lock = threading.Lock()


def _next_id(prefix: str) -> str:
    with _counters_lock:
        return f"{prefix}-{next(_counters[prefix]):04d}"


class Track:
    """Correlated track object held by the console."""

    def __init__(self, track_id: str, remote_id: str, source: str = FEED_SOURCE):
        self.track_id = track_id
        self.remote_id = remote_id
        self.source = source
        self.lat = 0.0
        self.lon = 0.0
        self.altitude_m = 0.0
        self.velocity_mps = 0.0
        self.heading_deg = 0.0
        self.track_confidence = 0.0
        self.authorization = "UNREGISTERED"
        self.status = "UNREGISTERED"
        self.zone_id: Optional[str] = None
        self.zone_name: Optional[str] = None
        self.zone_type: Optional[str] = None
        self.violation = False
        self.violation_reason = ""
        self.last_seen = 0.0
        self.report_timestamp: Optional[float] = None
        self.ingest_ts = 0.0
        self.process_ts = 0.0
        self.report_age_s = 0.0
        self.ingest_latency_ms = 0.0
        self.last_alert_id: Optional[str] = None
        self.history: List[Dict[str, Any]] = []

    def to_dict(self) -> Dict[str, Any]:
        now = time.time()
        since = max(0.0, now - self.last_seen) if self.last_seen else None
        return {
            "track_id": self.track_id,
            "remote_id": self.remote_id,
            "source": self.source,
            "latitude": round(self.lat, 6),
            "longitude": round(self.lon, 6),
            "altitude_m": round(self.altitude_m, 1),
            "velocity_mps": round(self.velocity_mps, 1),
            "heading_deg": round(self.heading_deg, 1),
            "authorization": self.authorization,
            "status": self.status,
            "zone_id": self.zone_id,
            "zone_name": self.zone_name,
            "zone_type": self.zone_type,
            "violation": self.violation,
            "violation_reason": self.violation_reason,
            "last_seen": self.last_seen,
            "last_seen_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.last_seen)) if self.last_seen else None,
            "time_since_last_report_s": round(since, 1) if since is not None else None,
            "report_timestamp": self.report_timestamp,
            "ingest_latency_ms": round(self.ingest_latency_ms, 2),
            "report_age_s": round(self.report_age_s, 2),
            "track_confidence": round(self.track_confidence, 3),
            "last_alert_id": self.last_alert_id,
            "history": self.history[-40:],
        }


class ConsoleService:
    """Holds tracks, zones, alerts, and pipeline metrics (in-memory singleton)."""

    def __init__(self):
        self.lock = threading.RLock()
        self.registry = AuthorizationRegistry()
        self.simulator = TelemetrySimulator()
        self.tracks: Dict[str, Track] = {}
        self.alerts: Dict[str, Dict[str, Any]] = {}
        self._alert_state: Dict[str, str] = {}  # track_id -> currently active alert type
        self.metrics: Dict[str, Any] = {
            "last_telemetry_age_s": None,
            "ingest_latency_ms": None,
            "processing_latency_ms": None,
            "alert_latency_ms": None,
            "report_to_console_ms": None,
            "reports_ingested": 0,
            "alerts_generated": 0,
            "rejected_reports": 0,
        }
        self.started_at = time.time()
        seed_default_zones()
        self.registry.register("RID-001", "AUTHORIZED")
        self.registry.register("RID-002", "AUTHORIZED")
        self.registry.register("RID-003", "UNREGISTERED")
        self._seed_actors()

    # ── initial population ──
    def _seed_actors(self) -> None:
        self.simulator.randomize_airspace()
        # Guarantee the two registered RIDs exist in the airspace as actors.
        # Remove any random actor holding the same remote_id first.
        for rid in ("RID-001", "RID-002"):
            for tid, a in list(self.simulator.actors.items()):
                if a.remote_id == rid:
                    self.simulator.actors.pop(tid)
            self.simulator.spawn(actor_type="drone", authorization="AUTHORIZED")
            newest = sorted(self.simulator.actors.values(), key=lambda x: x.created_at)[-1]
            newest.remote_id = rid
        # Guarantee at least one unregistered drone exists
        if not any(a.authorization == "UNREGISTERED" and a.actor_type == "drone"
                   for a in self.simulator.actors.values()):
            self.simulator.spawn(actor_type="drone", authorization="UNREGISTERED")

    # ── validation ──
    @staticmethod
    def _validate_report(rep: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(rep, dict):
            raise ValueError("telemetry report must be a JSON object")
        lat = rep.get("latitude")
        lon = rep.get("longitude")
        alt = rep.get("altitude_m", rep.get("altitude"))
        for name, v in (("latitude", lat), ("longitude", lon), ("altitude_m", alt)):
            if v is None:
                raise ValueError(f"missing required field '{name}'")
            try:
                v = float(v)
            except (TypeError, ValueError):
                raise ValueError(f"field '{name}' must be numeric")
            if v != v or v in (float("inf"), float("-inf")):
                raise ValueError(f"field '{name}' must be finite")
        if not (-90.0 <= float(lat) <= 90.0):
            raise ValueError("latitude out of range [-90, 90]")
        if not (-180.0 <= float(lon) <= 180.0):
            raise ValueError("longitude out of range [-180, 180]")
        if not (-500.0 <= float(alt) <= 25000.0):
            raise ValueError("altitude_m out of range [-500, 25000]")
        remote_id = rep.get("remote_id")
        if remote_id is not None and not str(remote_id).strip():
            raise ValueError("remote_id must be a non-empty string")
        track_id = rep.get("track_id")
        if track_id is not None and not str(track_id).strip():
            raise ValueError("track_id must be a non-empty string")
        velocity = rep.get("velocity_mps", 0.0)
        try:
            velocity = float(velocity)
        except (TypeError, ValueError):
            raise ValueError("velocity_mps must be numeric")
        heading = rep.get("heading_deg", 0.0)
        try:
            heading = float(heading) % 360.0
        except (TypeError, ValueError):
            raise ValueError("heading_deg must be numeric")
        out = {
            "latitude": float(lat),
            "longitude": float(lon),
            "altitude_m": float(alt),
            "velocity_mps": velocity,
            "heading_deg": heading,
            "remote_id": str(remote_id).strip() if remote_id else "UNKNOWN",
            "track_id": str(track_id).strip() if track_id else None,
            "timestamp": rep.get("timestamp"),
            "authorization_status": rep.get("authorization_status"),
            "source": rep.get("source") or "EXTERNAL_FEED",
            "track_confidence": rep.get("track_confidence"),
        }
        try:
            out["track_confidence"] = float(out["track_confidence"])
        except (TypeError, ValueError):
            out["track_confidence"] = None
        return out

    # ── pipeline: ingest one report ──
    def ingest(self, report: Dict[str, Any]) -> Dict[str, Any]:
        t_ingest = time.perf_counter()
        ingest_wall = time.time()
        try:
            r = self._validate_report(report)
        except ValueError as e:
            self.metrics["rejected_reports"] += 1
            raise

        # 1) TRACK CORRELATION — by explicit track_id, else remote_id, else new
        track_id = r["track_id"] or (f"RID:{r['remote_id']}" if r["remote_id"] != "UNKNOWN"
                                     else None)
        with self.lock:
            if track_id and track_id in self.tracks:
                tr = self.tracks[track_id]
            else:
                track_id = track_id or _next_id("TRK")
                tr = Track(track_id, r["remote_id"], source=r["source"])
                self.tracks[track_id] = tr

            # 2) update kinematics
            tr.lat = r["latitude"]
            tr.lon = r["longitude"]
            tr.altitude_m = r["altitude_m"]
            tr.velocity_mps = r["velocity_mps"]
            tr.heading_deg = r["heading_deg"]
            if r["track_confidence"] is not None:
                tr.track_confidence = r["track_confidence"]
            ts = r["timestamp"]
            try:
                ts = float(ts) if ts is not None else ingest_wall
            except (TypeError, ValueError):
                ts = ingest_wall
            tr.report_timestamp = ts
            tr.ingest_ts = ingest_wall
            tr.last_seen = ingest_wall
            tr.report_age_s = max(0.0, ingest_wall - ts)
            tr.history.append({"lat": round(tr.lat, 6), "lon": round(tr.lon, 6),
                               "alt": round(tr.altitude_m, 1), "t": ts})
            if len(tr.history) > 60:
                tr.history.pop(0)

            # 3) ZONE / GEOFENCE ENGINE — position + altitude only
            geo = zone_engine.evaluate(tr.lat, tr.lon, tr.altitude_m)
            tr.zone_id = geo["zone"]["zone_id"] if geo["zone"] else None
            tr.zone_name = geo["zone"]["name"] if geo["zone"] else None
            tr.zone_type = geo["zone"]["zone_type"] if geo["zone"] else None
            tr.violation = bool(geo["violating"])
            tr.violation_reason = geo["reason"]

            # 4) AUTHORIZATION REGISTRY — independent of geofence
            tr.authorization = self.registry.lookup(r["remote_id"])
            # Feed may explicitly declare authorization for known simulator actors,
            # but the registry remains the source of truth for unknown IDs.
            declared = r.get("authorization_status")
            if declared in ("AUTHORIZED", "UNREGISTERED") and r["remote_id"] != "UNKNOWN" \
                    and self.registry.is_known(r["remote_id"]):
                tr.authorization = declared

            # 5) classify status + 6) ALERT ENGINE
            now = time.time()
            prev_status = tr.status
            if tr.violation:
                status = "OUT_OF_ENVELOPE"
            else:
                status = tr.authorization
            tr.status = status
            tr.process_ts = time.time()

            alert_id = self._update_alert_locked(tr, status)
            tr.last_alert_id = alert_id or tr.last_alert_id

            # metrics
            self.metrics["reports_ingested"] += 1
            ingest_latency = (time.perf_counter() - t_ingest) * 1000.0
            tr.ingest_latency_ms = ingest_latency
            self.metrics["ingest_latency_ms"] = round(ingest_latency, 2)
            self.metrics["processing_latency_ms"] = round(
                (tr.process_ts - tr.ingest_ts) * 1000.0, 2)
            self.metrics["last_telemetry_age_s"] = round(tr.report_age_s, 2)

        return tr.to_dict()

    # ── alert engine (must be called with lock held) ──
    def _update_alert_locked(self, tr: Track, status: str) -> Optional[str]:
        now = time.time()
        if status in ("UNREGISTERED", "OUT_OF_ENVELOPE", "LOST_LINK"):
            existing_active = self._alert_state.get(tr.track_id)
            if existing_active == status:
                # refresh existing alert's last-seen info only
                aid = tr.last_alert_id
                al = self.alerts.get(aid)
                if al:
                    al["last_position"] = {"lat": tr.lat, "lon": tr.lon}
                    al["updated_at"] = now
                return aid
            # If a different alert type is active for this track, resolve it first
            if existing_active:
                prev = self.alerts.get(tr.last_alert_id)
                if prev and prev["status"] == "OPEN":
                    prev["status"] = "AUTO_RESOLVED"
                self._alert_state.pop(tr.track_id, None)
            return self._create_alert_locked(tr, status, now)
        else:
            # AUTHORIZED/compliant: auto-resolve any open alert for this track
            active = self._alert_state.pop(tr.track_id, None)
            if active:
                al = self.alerts.get(tr.last_alert_id)
                if al and al["status"] == "OPEN":
                    al["status"] = "AUTO_RESOLVED"
                    al["new_status"] = "AUTO_RESOLVED"
            tr.last_alert_id = None
            return None

    def _create_alert_locked(self, tr: Track, status: str, now: float) -> str:
        if status == "OUT_OF_ENVELOPE":
            zt = tr.zone_type or "GREEN"
            key = f"OUT_OF_ENVELOPE_{zt}"
        else:
            key = status
        priority = PRIORITY_RULES.get(key, "MEDIUM")
        action = ACTION_RULES.get(key, "MONITOR")
        alert_id = _next_id("ALERT")
        alert = {
            "alert_id": alert_id,
            "timestamp": now,
            "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "track_id": tr.track_id,
            "remote_id": tr.remote_id,
            "type": status,
            "priority": priority,
            "zone_id": tr.zone_id,
            "zone_name": tr.zone_name,
            "zone_type": tr.zone_type,
            "reason": tr.violation_reason or (
                f"{status}: {'remote ID ' + tr.remote_id + ' is not in the authorization registry' if status == 'UNREGISTERED' else 'telemetry lost'}"),
            "suggested_action": action,
            "status": "OPEN",
            "position": {"lat": tr.lat, "lon": tr.lon, "alt": tr.altitude_m},
            "fusion_class": "DRONE" if tr.status == "OUT_OF_ENVELOPE" else "UNCERTAIN",
            "note": DARK_VESSEL_NOTE if status in ("UNREGISTERED", "OUT_OF_ENVELOPE") else None,
            "created_at": now,
            "updated_at": now,
        }
        self.alerts[alert_id] = alert
        self._alert_state[tr.track_id] = status
        self.metrics["alerts_generated"] += 1
        # violation -> alert latency (should be ~0 since same pipeline pass)
        self.metrics["alert_latency_ms"] = round(
            (alert["created_at"] - tr.report_timestamp) * 1000.0, 2) \
            if tr.report_timestamp else 0.0
        return alert_id

    # ── lost-link sweep ──
    def sweep_lost_link(self) -> int:
        """Mark tracks silent beyond the timeout as LOST_LINK; keep them visible."""
        now = time.time()
        marked = 0
        with self.lock:
            for tr in self.tracks.values():
                silent_for = now - tr.last_seen if tr.last_seen else 0.0
                if silent_for > LOST_LINK_TIMEOUT_S and tr.status != "LOST_LINK":
                    prev = tr.status
                    tr.status = "LOST_LINK"
                    tr.violation = False
                    marked += 1
                    active = self._alert_state.pop(tr.track_id, None)
                    if active and tr.last_alert_id:
                        al = self.alerts.get(tr.last_alert_id)
                        if al and al["status"] == "OPEN":
                            al["status"] = "AUTO_RESOLVED"
                    tr.last_alert_id = self._create_alert_locked(tr, "LOST_LINK", now)
        return marked

    # ── queries ──
    def get_tracks(self) -> Dict[str, Any]:
        now = time.time()
        with self.lock:
            tracks = [tr.to_dict() for tr in self.tracks.values()]
        tracks.sort(key=lambda t: t["track_id"])
        if tracks:
            ages = [t["report_age_s"] for t in tracks]
            self.metrics["report_to_console_ms"] = round(max(ages) * 1000.0, 2)
        return {
            "tracks": tracks,
            "count": len(tracks),
            "source": FEED_SOURCE,
            "note": "All telemetry is SIMULATED (Remote-ID simulation). No live feed.",
        }

    def get_alerts(self, status: Optional[str] = None) -> Dict[str, Any]:
        with self.lock:
            alerts = [dict(a) for a in self.alerts.values()]
        if status:
            alerts = [a for a in alerts if a["status"] == status.upper()]
        prio_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        alerts.sort(key=lambda a: (prio_rank.get(a["priority"], 9), -a["timestamp"]))
        open_count = sum(1 for a in alerts if a["status"] == "OPEN")
        return {"alerts": alerts, "count": len(alerts), "open": open_count,
                "dark_vessel": "NOT APPLICABLE — TRACK A"}

    def get_metrics(self) -> Dict[str, Any]:
        with self.lock:
            m = dict(self.metrics)
            m["uptime_s"] = round(time.time() - self.started_at, 1)
            m["tracks"] = len(self.tracks)
            m["lost_link_timeout_s"] = LOST_LINK_TIMEOUT_S
            m["requirements"] = {
                "report_to_console_target_s": 2.0,
                "violation_to_alert_target_s": 5.0,
            }
        return m

    # ── operator disposition ──
    def disposition(self, alert_id: str, action: str, reason_code: str,
                    operator_id: str, operator_role: str) -> Dict[str, Any]:
        from backend.app.services.registry import (
            validate_operator, DISPOSITION_ACTIONS, REASON_CODES, DISPOSITION_STATUSES,
        )
        action = str(action).upper()
        reason = str(reason_code).upper()
        if action not in DISPOSITION_ACTIONS:
            raise ValueError(f"action must be one of {DISPOSITION_ACTIONS}")
        if reason not in REASON_CODES:
            raise ValueError(f"reason_code must be one of {REASON_CODES}")
        permission = "escalate" if action == "ESCALATE" else action.lower()
        validate_operator(operator_id, operator_role, permission)
        with self.lock:
            al = self.alerts.get(alert_id)
            if not al:
                raise KeyError(f"unknown alert '{alert_id}'")
            if al["status"] not in ("OPEN", "CONFIRMED"):
                raise ValueError(
                    f"alert is {al['status']}; only OPEN/CONFIRMED alerts can be dispositioned")
            prev_status = al["status"]
            al["status"] = {"CONFIRM": "CONFIRMED", "DISMISS": "DISMISSED",
                            "ESCALATE": "ESCALATED"}[action]
            al["reason_code"] = reason
            al["operator_id"] = operator_id
            al["updated_at"] = time.time()
            if action == "ESCALATE":
                al["priority"] = "CRITICAL"
            rec = audit_log.append(
                operator_id=operator_id, operator_role=operator_role, action=action,
                alert_id=alert_id, track_id=al["track_id"], reason_code=reason,
                previous_status=prev_status, new_status=al["status"],
                details={"alert_type": al["type"], "priority": al["priority"]},
            )
            return {"alert": dict(al), "audit_record": rec}

    # ── simulator controls ──
    def demo_randomize(self) -> Dict[str, Any]:
        with self.lock:
            self.simulator.randomize_airspace()
            self._seed_actor_fixups()
            return {"spawned": len(self.simulator.actors)}

    def _seed_actor_fixups(self) -> None:
        for rid in ("RID-001", "RID-002"):
            for tid, a in list(self.simulator.actors.items()):
                if a.remote_id == rid:
                    self.simulator.actors.pop(tid)
            self.simulator.spawn(actor_type="drone", authorization="AUTHORIZED")
            newest = sorted(self.simulator.actors.values(), key=lambda x: x.created_at)[-1]
            newest.remote_id = rid
        if not any(a.authorization == "UNREGISTERED" and a.actor_type == "drone"
                   for a in self.simulator.actors.values()):
            self.simulator.spawn(actor_type="drone", authorization="UNREGISTERED")

    def demo_spawn(self, kind: str, operator_id: str, role: str) -> Dict[str, Any]:
        from backend.app.services.registry import validate_operator
        validate_operator(operator_id, role, "spawn")
        kind = str(kind).upper()
        with self.lock:
            if kind == "AUTHORIZED":
                a = self.simulator.spawn("drone", "AUTHORIZED")
            elif kind == "UNREGISTERED":
                a = self.simulator.spawn("drone", "UNREGISTERED")
            elif kind == "VIOLATOR":
                a = self.simulator.spawn("drone", "UNREGISTERED", route_into_center=True)
            else:
                raise ValueError("kind must be AUTHORIZED | UNREGISTERED | VIOLATOR")
            return {"track_id": a.track_id, "remote_id": a.remote_id,
                    "authorization": a.authorization, "routed": a.route_target is not None}

    def demo_route_violator(self, track_id: Optional[str] = None) -> Dict[str, Any]:
        with self.lock:
            a = self.simulator.route_into_red_zone(track_id)
            if not a:
                a = self.simulator.spawn("drone", "UNREGISTERED")
                a = self.simulator.route_into_red_zone(a.track_id)
            return {"track_id": a.track_id, "routed_to": a.route_target}

    def demo_lost_link(self, track_id: Optional[str] = None) -> Dict[str, Any]:
        with self.lock:
            a = self.simulator.drop_link(track_id)
            if not a:
                raise ValueError("no actor available to drop link")
            return {"track_id": a.track_id, "link_up": a.link_up}

    def demo_restore_links(self) -> Dict[str, Any]:
        with self.lock:
            return {"restored": self.simulator.restore_links()}

    def demo_clear_tracks(self) -> Dict[str, Any]:
        with self.lock:
            self.simulator.clear()
            self.tracks.clear()
            self._alert_state.clear()
            return {"cleared": True}

    # ── simulator tick (called by background task or GET /api/tracks) ──
    def tick(self) -> List[Dict[str, Any]]:
        reports = self.simulator.step()
        for rep in reports:
            try:
                self.ingest(rep)
            except ValueError:
                pass
        self.sweep_lost_link()
        return reports


console_service = ConsoleService()
