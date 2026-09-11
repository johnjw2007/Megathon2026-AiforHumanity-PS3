import time
import json
import uuid
import math
import threading
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from db import get_db
from astra_engine import astra_engine
from yolo_engine import yolo_engine
from fusion_engine import fusion_engine
from rules_engine import rules_engine
from audit_service import audit_service

class TrackManager:
    def __init__(self):
        self._lock = threading.Lock()
        self.active_tracks: Dict[str, Dict[str, Any]] = {}
        self.track_history: Dict[str, List[List[float]]] = {}
        self.lost_link_timeout_seconds: float = 5.0
        self.total_reports_ingested: int = 0
        self.report_timestamps: List[float] = []
        self.last_report_time: Optional[float] = None
        self.last_latency_ms: float = 0.0
        self.subscribers: List[Any] = []  # SSE queues
        self._watchdog_thread = threading.Thread(target=self._watchdog_loop, daemon=True)
        self._watchdog_thread.start()

    def _watchdog_loop(self):
        while True:
            try:
                self.check_heartbeats()
            except Exception:
                pass
            time.sleep(0.5)

    def subscribe(self, queue):
        self.subscribers.append(queue)

    def unsubscribe(self, queue):
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    def broadcast_event(self, event_type: str, data: Any):
        dead_queues = []
        payload = json.dumps({"type": event_type, "timestamp": datetime.now(timezone.utc).isoformat(), "data": data})
        for q in self.subscribers:
            try:
                q.put_nowait(payload)
            except Exception:
                dead_queues.append(q)
        for dq in dead_queues:
            self.unsubscribe(dq)

    def get_ingestion_metrics(self) -> Dict[str, Any]:
        now = time.time()
        # Clean timestamps older than 5 seconds to calculate Hz
        self.report_timestamps = [t for t in self.report_timestamps if now - t <= 5.0]
        rate_hz = round(len(self.report_timestamps) / 5.0, 1) if self.report_timestamps else 0.0
        
        last_seen_str = "None"
        if self.last_report_time:
            diff = now - self.last_report_time
            last_seen_str = f"{diff:.1f}s ago" if diff >= 1.0 else "<1s ago"

        active_count = len([t for t in self.active_tracks.values() if t.get("status") != "PURGED"])

        return {
            "status": "CONNECTED" if (self.last_report_time and (now - self.last_report_time) < 15.0) else "IDLE",
            "last_report": last_seen_str,
            "report_rate_hz": rate_hz,
            "active_tracks": active_count,
            "latency_ms": round(self.last_latency_ms, 1),
            "report_to_console_target_met": self.last_latency_ms <= 2000.0,
            "total_reports": self.total_reports_ingested
        }

    def process_telemetry_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full Track-A ingestion pipeline:
        Report -> Validation -> Track Manager -> Rules & Auth -> Geofence -> Vision -> Fusion -> Alerts
        """
        ingest_ts = time.time()
        self.total_reports_ingested += 1
        self.report_timestamps.append(ingest_ts)
        self.last_report_time = ingest_ts

        track_id = report["track_id"]
        uas_id = report.get("uas_id", track_id)
        source = report.get("source", "REMOTE_ID_SIM")
        lat = float(report["latitude"])
        lon = float(report["longitude"])
        alt_m = float(report.get("altitude_m", 50.0))
        speed_mps = float(report.get("speed_mps", 0.0))
        heading_deg = float(report.get("heading_deg", 0.0))
        telemetry_ts = report.get("timestamp", datetime.now(timezone.utc).isoformat())

        # Check previous state for lost-link recovery
        was_lost_link = False
        if track_id in self.active_tracks and self.active_tracks[track_id].get("status") == "LOST_LINK":
            was_lost_link = True

        # 1. Update breadcrumb trail
        if track_id not in self.track_history:
            self.track_history[track_id] = []
        self.track_history[track_id].append([round(lat, 6), round(lon, 6)])
        if len(self.track_history[track_id]) > 100:
            self.track_history[track_id].pop(0)

        # 2. ASTRA Radar Micro-Doppler classification
        # Default or hinted class (0: Aircraft, 1: Drone, 2: Bird, 3: Tactical)
        target_hint_class = report.get("object_type", "DRONE")
        cls_id = 1
        if "BIRD" in target_hint_class.upper():
            cls_id = 2
        elif "AIRCRAFT" in target_hint_class.upper():
            cls_id = 0
        elif "STEALTH" in target_hint_class.upper() or "HELI" in target_hint_class.upper():
            cls_id = 3

        radar_features = astra_engine.get_sample_for_class(cls_id, jitter=0.01)
        astra_res = astra_engine.predict(radar_features)
        predicted_class = astra_res.get("class_name", target_hint_class)
        radar_conf = astra_res.get("confidence", 0.96)

        # 3. Camera Optical Coverage Check
        camera_candidate = fusion_engine.check_camera_coverage(lat, lon)

        # 4. YOLO Optical Inference (with support for vision conflict hint)
        cam_hint = report.get("target_hint_camera") or report.get("vision_class")
        if not cam_hint:
            if report.get("scenario") in ["CLASSIFICATION_CONFLICT", "SENSOR_CONFLICT"] or track_id in ["TRACK-CONFLICT-01", "TRK-CONFLICT-01"]:
                cam_hint = "BIRD"
            else:
                cam_hint = predicted_class

        camera_result = yolo_engine.infer_frame(
            image_data=None,
            target_hint={"class_name": cam_hint},
            in_fov=(camera_candidate is not None)
        )

        # 5. Dual-Sensor Correlation & Fusion
        fusion_result = fusion_engine.correlate(
            radar_class=predicted_class,
            radar_confidence=radar_conf,
            track_lat=lat,
            track_lon=lon,
            camera_result=camera_result,
            camera_info=camera_candidate
        )

        # 6. 7-Point DGCA Authorization Validation
        auth_info = rules_engine.check_authorization(
            track_id=track_id,
            uas_id=uas_id,
            object_type=predicted_class,
            current_lat=lat,
            current_lon=lon,
            altitude_m=alt_m
        )

        # 7. 3D Geofence & Perimeter Check (with auto-expiration & permit corridor exemption)
        allowed_zone_id = None
        if auth_info.get("permitted"):
            allowed_zone_id = auth_info.get("permission_info", {}).get("allowed_zone")
        geofence_info = rules_engine.check_geofence(lat, lon, alt_m, allowed_zone_id=allowed_zone_id)

        # 8. Kinematic Trajectory Extrapolation & AI Intent Prediction
        trajectory_info = rules_engine.predict_trajectory(
            lat=lat, lon=lon, altitude=alt_m,
            speed_mps=speed_mps, heading_deg=heading_deg, horizon_seconds=30,
            history=self.track_history.get(track_id, []),
            classification=auth_info.get("classification"),
            scenario=report.get("scenario")
        )

        # 9. Risk Assessment
        risk_info = rules_engine.calculate_risk(
            object_type=predicted_class,
            auth_info=auth_info,
            geofence_info=geofence_info,
            speed_mps=speed_mps,
            trajectory_info=trajectory_info,
            fusion_status=fusion_result.get("fusion_status", "RADAR_ONLY")
        )

        # Determine Primary Alert Classification
        alert_type = "AUTHORIZED"
        alert_subtype = "COMPLIANT_MISSION"
        suggested_action = "MONITOR"
        severity = risk_info.get("level", "LOW")

        if auth_info.get("classification") == "UNREGISTERED":
            alert_type = "UNREGISTERED"
            alert_subtype = auth_info.get("subtype", "NO_REGISTRY_MATCH")
            suggested_action = auth_info.get("suggested_action", "VERIFY REGISTRY / IDENTIFY OPERATOR")
            severity = "CRITICAL" if geofence_info.get("status") == "RESTRICTED_ZONE_VIOLATION" else "HIGH"
        elif auth_info.get("classification") == "OUT_OF_ENVELOPE":
            alert_type = "OUT_OF_ENVELOPE"
            alert_subtype = auth_info.get("subtype", "ALTITUDE")
            suggested_action = auth_info.get("suggested_action", "VERIFY VIOLATION / NOTIFY DUTY OFFICER")
            severity = "HIGH"
        elif geofence_info.get("status") == "RESTRICTED_ZONE_VIOLATION":
            alert_type = "OUT_OF_ENVELOPE"
            alert_subtype = "HORIZONTAL_GEOFENCE"
            suggested_action = "VERIFY / DISPATCH PATROL"
            severity = geofence_info.get("severity", "CRITICAL")
        elif geofence_info.get("status") == "APPROACHING_RESTRICTED_ZONE":
            alert_type = "OUT_OF_ENVELOPE"
            alert_subtype = "HORIZONTAL_GEOFENCE"
            suggested_action = "VERIFY VIOLATION / NOTIFY DUTY OFFICER"
            severity = "MEDIUM"

        processing_ts = time.time()
        self.last_latency_ms = (processing_ts - ingest_ts) * 1000.0

        # Build track state record
        track_state = {
            "track_id": track_id,
            "uas_id": uas_id,
            "source": source,
            "object_type": predicted_class,
            "radar_confidence": radar_conf,
            "camera_confidence": fusion_result.get("camera_confidence", 0.0),
            "fusion_status": fusion_result.get("fusion_status", "RADAR_ONLY"),
            "display_status": fusion_result.get("display_status", "TRACKING"),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "altitude_m": round(alt_m, 1),
            "speed_mps": round(speed_mps, 1),
            "heading_deg": round(heading_deg, 1),
            "status": "TRACKING",
            "last_seen": ingest_ts,
            "last_telemetry_timestamp": telemetry_ts,
            "authorization": auth_info,
            "geofence": geofence_info,
            "trajectory": trajectory_info,
            "risk": risk_info,
            "risk_level": severity,
            "risk_reasons": risk_info.get("reasons", []),
            "alert_classification": alert_type,
            "alert_subtype": alert_subtype,
            "suggested_action": suggested_action,
            "associated_camera": camera_candidate,
            "history": self.track_history[track_id]
        }
        self.active_tracks[track_id] = track_state

        # Persist track & telemetry report to database
        self._persist_track_update(track_state, ingest_ts, processing_ts, report)

        # Log link recovery and resolve active lost link alerts if track was lost link
        if was_lost_link:
            try:
                c = get_db()
                cur = c.cursor()
                cur.execute("""
                    UPDATE alerts 
                    SET status = 'RESOLVED', disposition = 'RECOVERED', disposition_notes = 'Telemetry link restored'
                    WHERE track_id = ? AND alert_type = 'LOST_LINK' AND status = 'ACTIVE'
                """, (track_id,))
                c.commit()
                c.close()
            except Exception as ex:
                print(f"[TrackManager LostLink Recovery DB Error] {ex}")

            audit_service.log_event(
                operator_id="TELEMETRY_INGESTOR",
                operator_role="SYSTEM",
                action="LOST_LINK_RECOVERY",
                resource_type="TRACK",
                resource_id=track_id,
                result="RECOVERED",
                reason_code="HEARTBEAT_RESUMED",
                details=f"Telemetry signal resumed for track {track_id} ({uas_id}). Track restored to active monitoring."
            )
            self.broadcast_event("LOST_LINK_RECOVERED", track_state)

        # Broadcast update over SSE
        self.broadcast_event("TRACK_UPDATE", track_state)

        return track_state

    def _persist_track_update(self, t: Dict[str, Any], ingest_ts: float, processing_ts: float, raw_report: Dict[str, Any]):
        try:
            is_new_alert = False
            alert_id = None
            conn = get_db()
            cursor = conn.cursor()

            # 1. Update Object Tracks
            cursor.execute("""
                INSERT OR REPLACE INTO object_tracks (
                    track_id, uas_id, object_type, radar_confidence, camera_confidence,
                    fusion_status, current_lat, current_lon, altitude_m, speed_mps,
                    heading_deg, source, authorization_status, geofence_status,
                    risk_level, risk_reasons, alert_classification, alert_subtype,
                    suggested_action, associated_camera_id, is_active, last_seen, last_updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (
                t["track_id"],
                t["uas_id"],
                t["object_type"],
                t["radar_confidence"],
                t["camera_confidence"],
                t["fusion_status"],
                t["latitude"],
                t["longitude"],
                t["altitude_m"],
                t["speed_mps"],
                t["heading_deg"],
                t["source"],
                t["authorization"].get("status", "UNKNOWN"),
                t["geofence"].get("status", "CLEAR"),
                t["risk_level"],
                json.dumps(t["risk_reasons"]),
                t["alert_classification"],
                t["alert_subtype"],
                t["suggested_action"],
                t["associated_camera"].get("camera_id") if t.get("associated_camera") else None
            ))

            # 2. Insert Telemetry Report
            report_id = f"RPT-{uuid.uuid4().hex[:12].upper()}"
            cursor.execute("""
                INSERT INTO telemetry_reports (
                    report_id, track_id, uas_id, source, timestamp, latitude, longitude,
                    altitude_m, speed_mps, heading_deg, ingest_timestamp, processing_timestamp,
                    alert_timestamp, latency_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_id,
                t["track_id"],
                t["uas_id"],
                t["source"],
                t["last_telemetry_timestamp"],
                t["latitude"],
                t["longitude"],
                t["altitude_m"],
                t["speed_mps"],
                t["heading_deg"],
                ingest_ts,
                processing_ts,
                processing_ts if t["alert_classification"] != "AUTHORIZED" else None,
                self.last_latency_ms
            ))

            # 3. If violation / unregistered / out-of-envelope alert, insert/update in alerts table
            if t["alert_classification"] in ["OUT_OF_ENVELOPE", "UNREGISTERED"]:
                alert_id = f"ALT-{t['track_id']}-{t['alert_subtype']}"
                title = f"{t['alert_classification']}: {t['alert_subtype']}"
                reason = t["geofence"].get("reason") or t["authorization"].get("reason") or "Airspace rule violation detected."
                
                cursor.execute("SELECT alert_id, status FROM alerts WHERE alert_id = ?", (alert_id,))
                existing_alert = cursor.fetchone()
                is_new_alert = False
                if existing_alert and existing_alert["status"] == "ACTIVE":
                    # Deduplicate: update coordinates without creating duplicate entries
                    cursor.execute("""
                        UPDATE alerts
                        SET latitude = ?, longitude = ?, reason = ?
                        WHERE alert_id = ?
                    """, (t["latitude"], t["longitude"], reason, alert_id))
                else:
                    is_new_alert = True
                    cursor.execute("""
                        INSERT OR REPLACE INTO alerts (
                            alert_id, track_id, alert_type, subtype, severity, title, reason,
                            latitude, longitude, recommended_action, suggested_action, status, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
                    """, (
                        alert_id,
                        t["track_id"],
                        t["alert_classification"],
                        t["alert_subtype"],
                        t["risk_level"],
                        title,
                        reason,
                        t["latitude"],
                        t["longitude"],
                        t["suggested_action"],
                        t["suggested_action"]
                    ))

            conn.commit()
            conn.close()

            # Audit alert creation after conn is closed to eliminate SQLite transaction lock contention
            if is_new_alert:
                try:
                    audit_service.log_event(
                        operator_id="RULES_ENGINE",
                        operator_role="SYSTEM",
                        action="ALERT_CREATED",
                        resource_type="ALERT",
                        resource_id=alert_id,
                        result="OPEN",
                        reason_code=t["alert_subtype"],
                        details=f"Alert created for {t['track_id']} ({t['alert_classification']}: {t['alert_subtype']})"
                    )
                except Exception:
                    pass
        except Exception as e:
            print(f"[TrackManager DB Error] {e}")

    def check_heartbeats(self):
        """
        Watchdog: Checks active tracks for telemetry timeout.
        If now - last_seen > timeout -> triggers LOST_LINK alert.
        """
        now = time.time()
        for track_id, t in list(self.active_tracks.items()):
            if t.get("status") == "PURGED":
                continue

            last_seen = t.get("last_seen", now)
            elapsed = now - last_seen

            if elapsed > self.lost_link_timeout_seconds and t.get("status") != "LOST_LINK":
                t["status"] = "LOST_LINK"
                t["alert_classification"] = "LOST_LINK"
                t["alert_subtype"] = "TELEMETRY_TIMEOUT"
                t["suggested_action"] = "VERIFY SENSOR / SECONDARY OBSERVATION"
                t["risk_level"] = "HIGH"

                # Persist lost link alert in database
                try:
                    conn = get_db()
                    cursor = conn.cursor()
                    alt_id = f"ALT-LOST-{track_id}"
                    cursor.execute("""
                        INSERT OR REPLACE INTO alerts (
                            alert_id, track_id, alert_type, subtype, severity, title, reason,
                            latitude, longitude, recommended_action, suggested_action, status, created_at
                        ) VALUES (?, ?, 'LOST_LINK', 'TELEMETRY_TIMEOUT', 'HIGH',
                                  'LOST LINK: Telemetry Timeout', ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
                    """, (
                        alt_id,
                        track_id,
                        f"Track {track_id} ({t.get('uas_id', track_id)}) lost heartbeat signal. Last seen {elapsed:.1f}s ago.",
                        t["latitude"],
                        t["longitude"],
                        "VERIFY SENSOR / SECONDARY OBSERVATION",
                        "VERIFY SENSOR / SECONDARY OBSERVATION"
                    ))
                    conn.commit()
                    conn.close()
                except Exception as e:
                    print(f"[Watchdog DB Error] {e}")

                audit_service.log_event(
                    operator_id="WATCHDOG_MONITOR",
                    operator_role="SYSTEM",
                    action="HEARTBEAT_TIMEOUT",
                    resource_type="TRACK",
                    resource_id=track_id,
                    result="LOST_LINK_DECLARED",
                    reason_code="TELEMETRY_TIMEOUT",
                    details=f"No telemetry received for {elapsed:.1f}s (Threshold: {self.lost_link_timeout_seconds}s). Alert {alt_id} opened."
                )

                self.broadcast_event("LOST_LINK", t)

    def clear_demo_tracks(self):
        """
        Safely clears simulator and demo tracks from active memory, resetting the map to baseline.
        """
        with self._lock:
            demo_prefixes = ["TRACK-", "UNKNOWN-", "TRK-", "DRN-", "RID-", "ALT-"]
            to_remove = []
            for tid, t in list(self.active_tracks.items()):
                if t.get("source") in ["SIMULATOR", "REMOTE_ID_SIM", "SIMULATED_REMOTE_ID"] or any(tid.startswith(p) for p in demo_prefixes):
                    to_remove.append(tid)

            for tid in to_remove:
                if tid in self.active_tracks:
                    del self.active_tracks[tid]
                if tid in self.track_history:
                    del self.track_history[tid]

            self.broadcast_event("TRACKS_CLEARED", {"cleared_tracks": to_remove})
            return to_remove

track_manager = TrackManager()
