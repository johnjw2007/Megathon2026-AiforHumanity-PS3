import time
import math
import json
import sys
import threading
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

_backend_dir = Path(__file__).resolve().parent
_repo_root = _backend_dir.parent
for p in [str(_repo_root), str(_backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.services.telemetry_simulator import TelemetrySimulator
except ImportError:
    try:
        from app.services.telemetry_simulator import TelemetrySimulator
    except ImportError:
        TelemetrySimulator = None

from astra_engine import astra_engine
from yolo_engine import yolo_engine
from fusion_engine import fusion_engine
from rules_engine import rules_engine
from track_manager import track_manager
from ingestion_service import ingestion_service
from audit_service import audit_service
from db import get_db

SCENARIOS = {
    "AUTHORIZED_DRONE": {
        "id": "AUTHORIZED_DRONE",
        "name": "1. Authorized Drone (Compliant)",
        "track_id": "DRN-001",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "start_lat": 13.095,
        "start_lon": 80.305,
        "target_lat": 13.105,
        "target_lon": 80.315,
        "altitude_m": 65.0,
        "speed_mps": 12.0,
        "heading_deg": 35.0,
        "description": "Tamil Nadu Port Authority inspection flight operating under approved permit PERM-2026-081 in ZONE-PORT-02."
    },
    "UNREGISTERED_DRONE": {
        "id": "UNREGISTERED_DRONE",
        "name": "2. Unregistered Drone (Non-Compliant)",
        "track_id": "UNKNOWN-UAS-999",
        "uas_id": "UNKNOWN-UAS-999",
        "object_type": "DRONE",
        "start_lat": 13.040,
        "start_lon": 80.285,
        "target_lat": 13.055,
        "target_lon": 80.290,
        "altitude_m": 75.0,
        "speed_mps": 15.0,
        "heading_deg": 15.0,
        "description": "Unregistered quadcopter flying over civilian sector without DGCA civil registry match."
    },
    "ALTITUDE_VIOLATION": {
        "id": "ALTITUDE_VIOLATION",
        "name": "3. Altitude Violation (Out of Envelope)",
        "track_id": "DRN-001",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "start_lat": 13.095,
        "start_lon": 80.305,
        "target_lat": 13.105,
        "target_lon": 80.315,
        "altitude_m": 250.0,  # Breaches 80m approved ceiling
        "speed_mps": 14.0,
        "heading_deg": 25.0,
        "description": "Registered drone exceeding maximum permitted altitude ceiling (250m vs 80m approved ceiling)."
    },
    "TEMP_RED_ZONE_VIOLATION": {
        "id": "TEMP_RED_ZONE_VIOLATION",
        "name": "4. Temporary Red-Zone Violation",
        "track_id": "TRACK-INTRUDER-01",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "start_lat": 13.068,
        "start_lon": 80.298,
        "target_lat": 13.078,
        "target_lon": 80.305,
        "altitude_m": 65.0,
        "speed_mps": 10.0,
        "heading_deg": 10.0,
        "description": "Target penetrating newly active tactical law enforcement temporary red zone."
    },
    "LOST_LINK": {
        "id": "LOST_LINK",
        "name": "5. Lost Link Telemetry Test",
        "track_id": "RID-004",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "start_lat": 13.068,
        "start_lon": 80.298,
        "target_lat": 13.072,
        "target_lon": 80.300,
        "altitude_m": 70.0,
        "speed_mps": 10.0,
        "heading_deg": 40.0,
        "max_reports": 4,
        "description": "Transmits 4 reports then cuts signal to trigger LOST_LINK, followed by automated telemetry restoration."
    },
    "SENSOR_CONFLICT": {
        "id": "SENSOR_CONFLICT",
        "name": "6. Classification Conflict (Radar vs Camera)",
        "track_id": "TRACK-CONFLICT-01",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "vision_class": "BIRD",
        "start_lat": 13.068,
        "start_lon": 80.298,
        "target_lat": 13.074,
        "target_lon": 80.302,
        "altitude_m": 45.0,
        "speed_mps": 9.0,
        "heading_deg": 45.0,
        "description": "Micro-Doppler classifies target as DRONE, but Optical Camera classifies as BIRD. Flags VISION_RADAR_CONFLICT."
    },
    "MULTI_OBJECT": {
        "id": "MULTI_OBJECT",
        "name": "7. Multiple Objects in Airspace",
        "track_id": "DRN-001",
        "uas_id": "UIN-2026-IND-0101",
        "object_type": "DRONE",
        "start_lat": 13.095,
        "start_lon": 80.305,
        "target_lat": 13.110,
        "target_lon": 80.320,
        "altitude_m": 65.0,
        "speed_mps": 12.0,
        "heading_deg": 45.0,
        "description": "Simultaneous multi-target tracking: Authorized commercial UAV, unregistered drone, and out-of-envelope drone."
    },
    "RESTRICTED_INTRUSION": {
        "id": "RESTRICTED_INTRUSION",
        "name": "8. Restricted Sector Incursion (Naval Airspace)",
        "track_id": "TRACK-0001",
        "uas_id": "UNKNOWN-UAS-001",
        "object_type": "DRONE",
        "start_lat": 13.060,
        "start_lon": 80.290,
        "target_lat": 13.072,
        "target_lon": 80.302,
        "altitude_m": 88.0,
        "speed_mps": 18.0,
        "heading_deg": 38.0,
        "description": "Unregistered drone incursion penetrating INS Adyar Naval Base Restricted Airspace (0-1200m AGL)."
    }
}

SCENARIOS["TEMP_RED_VIOLATION"] = SCENARIOS["TEMP_RED_ZONE_VIOLATION"]
SCENARIOS["CLASSIFICATION_CONFLICT"] = SCENARIOS["SENSOR_CONFLICT"]

SCENARIO_ROTATION_ORDER = [
    "AUTHORIZED_DRONE",
    "UNREGISTERED_DRONE",
    "ALTITUDE_VIOLATION",
    "TEMP_RED_ZONE_VIOLATION",
    "LOST_LINK",
    "SENSOR_CONFLICT",
    "MULTI_OBJECT"
]


class SimulationEngine:
    def __init__(self):
        self.state = "RUNNING"
        self.speed = 1.0
        self.active_scenario_key = "AUTHORIZED_DRONE"
        self.step_index = 0
        self.reports_sent_for_scenario = 0
        self.auto_cycle = False
        self.cycle_interval_steps = 25
        self.scenario_cycle = SCENARIO_ROTATION_ORDER

        self.current_lat = 13.095
        self.current_lon = 80.305
        self.current_alt = 65.0
        self.current_speed = 12.0
        self.current_heading = 35.0
        self.live_events = []
        self.lost_link_resumed = False
        self.lost_link_silence_count = 0
        self.multi_tracks_state = {}
        self.telemetry_simulator = TelemetrySimulator() if TelemetrySimulator else None
        self._step_lock = threading.Lock()
        self._ensure_temp_red_zone()

    def reset_simulation(self, keep_running=False):
        with self._step_lock:
            self.state = "RUNNING" if keep_running else "STOPPED"
            self.step_index = 0
            self.reports_sent_for_scenario = 0
            self.lost_link_resumed = False
            self.lost_link_silence_count = 0
            self.multi_tracks_state = {}
            self.active_scenario_key = "AUTHORIZED_DRONE"

            track_manager.clear_demo_tracks()
            if self.telemetry_simulator and self.state == "RUNNING":
                self.telemetry_simulator.randomize_airspace()

        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM restricted_zones
                WHERE zone_id LIKE 'ZONE-TEMP-DEMO%'
            """)
            cursor.execute("""
                UPDATE alerts
                SET status = 'RESOLVED', disposition = 'DISMISSED', disposition_reason = 'RESET'
                WHERE status = 'ACTIVE'
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Sim Reset DB Error] {e}")

        # Always restore default active Temporary Red Zone on the map
        self._ensure_temp_red_zone()

        try:
            audit_service.log_event(
                operator_id="SIMULATOR",
                operator_role="SYSTEM",
                action="SCENARIO_RESET",
                resource_type="SIMULATION",
                resource_id=self.active_scenario_key,
                result="RESET",
                reason_code="BASELINE_RESTORED",
                details="Simulation reset to clean baseline. Active tactical temporary red zone restored."
            )
        except Exception:
            pass

        self.live_events = [
            {
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                "type": "SIMULATION_RESET",
                "message": "Simulator reset to clean baseline. Tactical temp red zone active on map."
            }
        ]

    def _ensure_temp_red_zone(self, duration_seconds=2700, include_demo=False):
        try:
            conn = get_db()
            cursor = conn.cursor()
            exp_time = datetime.now(timezone.utc) + timedelta(seconds=duration_seconds)
            expires_at = exp_time.strftime("%Y-%m-%d %H:%M:%S")

            # 1. Active Tactical VIP Security Temporary Red Zone on Chennai coastal defense sector
            poly_tactical = [
                [13.060, 80.282],
                [13.076, 80.282],
                [13.076, 80.300],
                [13.060, 80.300]
            ]
            cursor.execute("""
                INSERT INTO restricted_zones 
                (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
                VALUES ('ZONE-TEMP-TACTICAL-01', 'Tactical VIP Security & Bomb Squad Cordon', 'TEMPORARY_RED', 0.0, 400.0, ?, 'CRITICAL',
                        'Emergency Coastal Tactical Cordon - Active Counter-UAS Perimeter', ?, 'TACTICAL_COMMAND', 1, 'VIP Movement & Anti-Sabotage Sweep')
                ON CONFLICT(zone_id) DO UPDATE SET
                    active = 1,
                    expires_at = excluded.expires_at,
                    polygon_coords = excluded.polygon_coords,
                    name = excluded.name,
                    reason = excluded.reason
            """, (json.dumps(poly_tactical), expires_at))

            # 2. Demo zone for automated test scenarios (only when explicitly requested)
            if include_demo:
                demo_exp = (datetime.now(timezone.utc) + timedelta(seconds=120)).strftime("%Y-%m-%d %H:%M:%S")
                poly_demo = [
                    [13.060, 80.290],
                    [13.076, 80.290],
                    [13.076, 80.306],
                    [13.060, 80.306]
                ]
                cursor.execute("""
                    INSERT OR REPLACE INTO restricted_zones 
                    (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
                    VALUES ('ZONE-TEMP-DEMO', 'Tactical Bomb Squad Perimeter (Demo)', 'TEMPORARY_RED', 0.0, 400.0, ?, 'CRITICAL',
                            'Law enforcement temporary exclusion zone', ?, 'SYSTEM_DEMO', 1, 'VIP Tactical Cordon')
                """, (json.dumps(poly_demo), demo_exp))

            conn.commit()
            conn.close()

            audit_service.log_event(
                operator_id="SIMULATOR",
                operator_role="SYSTEM",
                action="TEMP_ZONE_CREATED",
                resource_type="GEOFENCE",
                resource_id="ZONE-TEMP-TACTICAL-01",
                result="ACTIVE",
                reason_code="TACTICAL_AIRSPACE_RESTRICTION",
                details=f"Temporary red zone ZONE-TEMP-TACTICAL-01 placed on map (Expires: {expires_at})."
            )
        except Exception as e:
            print(f"[Temp Red Zone Setup Error] {e}")

    def _init_multi_object_state(self):
        self.multi_tracks_state = {
            "DRN-001": {
                "track_id": "DRN-001",
                "uas_id": "UIN-2026-IND-0101",
                "lat": 13.095, "lon": 80.305, "alt": 65.0,
                "speed": 12.0, "heading": 45.0, "object_type": "DRONE"
            },
            "UNKNOWN-UAS-003": {
                "track_id": "UNKNOWN-UAS-003",
                "uas_id": "UNKNOWN-GHOST-33",
                "lat": 13.045, "lon": 80.280, "alt": 50.0,
                "speed": 14.0, "heading": 90.0, "object_type": "DRONE"
            },
            "DRN-002": {
                "track_id": "DRN-002",
                "uas_id": "UIN-2026-IND-0102",
                "lat": 13.070, "lon": 80.290, "alt": 220.0,
                "speed": 18.0, "heading": 180.0, "object_type": "DRONE"
            }
        }

    def start(self, scenario_key=None, speed=1.0):
        if scenario_key:
            alias_map = {
                "TEMP_RED_VIOLATION": "TEMP_RED_ZONE_VIOLATION",
                "CLASSIFICATION_CONFLICT": "SENSOR_CONFLICT"
            }
            scenario_key = alias_map.get(scenario_key, scenario_key)
            if scenario_key in SCENARIOS:
                self.active_scenario_key = scenario_key

        self.speed = float(speed)
        self.state = "RUNNING"
        self.step_index = 0
        self.reports_sent_for_scenario = 0
        self.lost_link_resumed = False
        self.lost_link_silence_count = 0

        track_manager.clear_demo_tracks()

        if self.active_scenario_key == "TEMP_RED_ZONE_VIOLATION":
            self._ensure_temp_red_zone(include_demo=True)
            scenario = SCENARIOS[self.active_scenario_key]
            self.current_lat = scenario["start_lat"]
            self.current_lon = scenario["start_lon"]
            self.current_alt = scenario["altitude_m"]
            self.current_speed = scenario["speed_mps"]
            self.current_heading = scenario["heading_deg"]
        elif self.active_scenario_key == "MULTI_OBJECT":
            self._init_multi_object_state()
        else:
            scenario = SCENARIOS.get(self.active_scenario_key, SCENARIOS["AUTHORIZED_DRONE"])
            self.current_lat = scenario["start_lat"]
            self.current_lon = scenario["start_lon"]
            self.current_alt = scenario["altitude_m"]
            self.current_speed = scenario["speed_mps"]
            self.current_heading = scenario["heading_deg"]

        try:
            audit_service.log_event(
                operator_id="CONSOLE_OPERATOR",
                operator_role="OFFICER",
                action="SCENARIO_STARTED",
                resource_type="SIMULATION",
                resource_id=self.active_scenario_key,
                result="SUCCESS",
                reason_code="DEMO_EXECUTION",
                details=f"Scenario '{self.active_scenario_key}' launched at speed {self.speed}x."
            )
        except Exception:
            pass

        self.add_event("SIMULATION_STARTED", f"Running Track-A scenario: {SCENARIOS.get(self.active_scenario_key, {}).get('name', self.active_scenario_key)}")
        if self.active_scenario_key == "MULTI_OBJECT":
            for tid, obj in self.multi_tracks_state.items():
                rep = {
                    "source": "SIMULATOR",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "track_id": obj["track_id"],
                    "uas_id": obj["uas_id"],
                    "object_type": obj["object_type"],
                    "latitude": round(obj["lat"], 6),
                    "longitude": round(obj["lon"], 6),
                    "altitude_m": round(obj["alt"], 1),
                    "speed_mps": round(obj["speed"], 1),
                    "heading_deg": round(obj["heading"], 1),
                    "scenario": "MULTI_OBJECT"
                }
                ingestion_service.validate_and_ingest(rep)
        else:
            self._send_telemetry_report()
        return self.get_scenario_state()

    def pause(self):
        self.state = "PAUSED"
        self.add_event("SIMULATION_PAUSED", "Simulation execution paused by operator. Tracks frozen.")
        try:
            audit_service.log_event(
                operator_id="CONSOLE_OPERATOR",
                operator_role="OFFICER",
                action="SCENARIO_PAUSED",
                resource_type="SIMULATION",
                resource_id=self.active_scenario_key,
                result="PAUSED",
                reason_code="OPERATOR_PAUSE",
                details=f"Scenario '{self.active_scenario_key}' paused."
            )
        except Exception:
            pass

    def resume(self):
        self.state = "RUNNING"
        self.add_event("SIMULATION_RESUMED", "Simulation execution resumed.")
        try:
            audit_service.log_event(
                operator_id="CONSOLE_OPERATOR",
                operator_role="OFFICER",
                action="SCENARIO_RESUMED",
                resource_type="SIMULATION",
                resource_id=self.active_scenario_key,
                result="RESUMED",
                reason_code="OPERATOR_RESUME",
                details=f"Scenario '{self.active_scenario_key}' resumed."
            )
        except Exception:
            pass

    def stop(self):
        with self._step_lock:
            self.state = "STOPPED"
        self.add_event("SIMULATION_STOPPED", "Simulation execution halted. Telemetry transmission stopped.")
        try:
            audit_service.log_event(
                operator_id="CONSOLE_OPERATOR",
                operator_role="OFFICER",
                action="SCENARIO_STOPPED",
                resource_type="SIMULATION",
                resource_id=self.active_scenario_key,
                result="STOPPED",
                reason_code="OPERATOR_STOP",
                details=f"Scenario '{self.active_scenario_key}' stopped."
            )
        except Exception:
            pass

    def set_speed(self, speed):
        self.speed = float(speed)

    def toggle_auto_cycle(self, enabled=None):
        if enabled is not None:
            self.auto_cycle = bool(enabled)
        else:
            self.auto_cycle = not self.auto_cycle
        return self.auto_cycle

    def add_event(self, event_type: str, message: str):
        evt = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "type": event_type,
            "message": message
        }
        self.live_events.insert(0, evt)
        if len(self.live_events) > 50:
            self.live_events.pop()

    def resume_lost_link_telemetry(self):
        self.lost_link_resumed = True
        self.add_event("LOST_LINK_RECOVERY", "Telemetry link resumed by operator. Target transmitting live again.")
        self._send_telemetry_report()

    def update_step(self, dt=0.8):
        if not self._step_lock.acquire(blocking=False):
            return self.get_snapshot()
        try:
            return self._update_step_internal(dt)
        finally:
            self._step_lock.release()

    def _update_step_internal(self, dt=0.8):
        track_manager.check_heartbeats()

        if self.state != "RUNNING":
            return self.get_snapshot()

        effective_dt = dt * self.speed
        self.step_index += 1

        # 1. Step Levin's TelemetrySimulator for continuous multi-drone airspace (8-15 concurrent actors)
        if self.telemetry_simulator:
            try:
                actor_reports = self.telemetry_simulator.step()
                for rep in actor_reports:
                    if self.state != "RUNNING":
                        break
                    if self.active_scenario_key and self.active_scenario_key in SCENARIOS:
                        scenario_tid = SCENARIOS[self.active_scenario_key]["track_id"]
                        if rep.get("track_id") == scenario_tid:
                            continue

                    obj_type = rep.get("actor_type", "drone").upper()
                    auth_status = rep.get("authorization_status", "UNREGISTERED")
                    ingest_rep = {
                        "source": rep.get("source", "SIMULATED_REMOTE_ID"),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "track_id": rep["track_id"],
                        "uas_id": rep.get("remote_id") or rep["track_id"],
                        "object_type": obj_type,
                        "latitude": round(rep["latitude"], 6),
                        "longitude": round(rep["longitude"], 6),
                        "altitude_m": round(rep["altitude_m"], 1),
                        "speed_mps": round(rep.get("velocity_mps", 10.0), 1),
                        "heading_deg": round(rep.get("heading_deg", 0.0), 1),
                        "authorization": auth_status,
                        "scenario": "AMBIENT_AIRSPACE"
                    }
                    ingestion_service.validate_and_ingest(ingest_rep)
            except Exception as e:
                print(f"[TelemetrySimulator Step Error] {e}")

        scenario = SCENARIOS.get(self.active_scenario_key, SCENARIOS["AUTHORIZED_DRONE"])

        if self.auto_cycle and self.step_index >= self.cycle_interval_steps:
            try:
                cur_idx = self.scenario_cycle.index(self.active_scenario_key)
                next_key = self.scenario_cycle[(cur_idx + 1) % len(self.scenario_cycle)]
            except ValueError:
                next_key = self.scenario_cycle[0]
            self.start(next_key, self.speed)
            return self.get_snapshot()

        if self.active_scenario_key == "LOST_LINK" and not self.lost_link_resumed:
            max_r = scenario.get("max_reports", 4)
            if self.reports_sent_for_scenario >= max_r:
                self.lost_link_silence_count += 1
                self.add_event("LOST_LINK_SILENCE", f"Telemetry silence ({self.lost_link_silence_count * 0.8:.1f}s). Watchdog evaluating timeout...")
                if self.lost_link_silence_count >= 8:
                    self.resume_lost_link_telemetry()
                return self.get_snapshot()

        if self.active_scenario_key == "MULTI_OBJECT":
            for tid, obj in self.multi_tracks_state.items():
                h_rad = math.radians(obj["heading"])
                dist = obj["speed"] * effective_dt
                m_lat = 111000.0
                m_lon = 111000.0 * math.cos(math.radians(obj["lat"]))
                obj["lat"] += (dist * math.cos(h_rad) / m_lat)
                obj["lon"] += (dist * math.sin(h_rad) / m_lon)
                report = {
                    "source": "SIMULATOR",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "track_id": obj["track_id"],
                    "uas_id": obj["uas_id"],
                    "object_type": obj["object_type"],
                    "latitude": round(obj["lat"], 6),
                    "longitude": round(obj["lon"], 6),
                    "altitude_m": round(obj["alt"], 1),
                    "speed_mps": round(obj["speed"], 1),
                    "heading_deg": round(obj["heading"], 1),
                    "scenario": "MULTI_OBJECT"
                }
                ingestion_service.validate_and_ingest(report)
            return self.get_snapshot()

        # Kinematic updates based on scenario:
        if self.active_scenario_key == "UNREGISTERED_DRONE":
            # Dynamic erratic moves: yaw wander, banking turns, throttle surges, altitude bobbing
            turn_deg_s = math.sin(self.step_index * 0.35) * 6.5 + math.cos(self.step_index * 0.12) * 3.0 + random.uniform(-1.5, 1.5)
            self.current_heading = (self.current_heading + turn_deg_s * effective_dt) % 360.0
            
            # Speed fluctuations between 9 and 21.5 m/s
            speed_surge = math.sin(self.step_index * 0.28) * 4.5 + random.uniform(-1.0, 1.0)
            self.current_speed = max(8.5, min(22.0, scenario.get("speed_mps", 15.0) + speed_surge))
            
            # Altitude bobbing between 35m and 115m
            self.current_alt = max(25.0, 65.0 + math.sin(self.step_index * 0.2) * 35.0 + math.cos(self.step_index * 0.07) * 15.0)
            
            # Soft-bounce containment to keep rogue drone actively maneuvering within Chennai coastal sector
            if self.current_lat < 13.030 or self.current_lat > 13.110 or self.current_lon < 80.260 or self.current_lon > 80.325:
                to_center_rad = math.atan2(80.290 - self.current_lon, 13.070 - self.current_lat)
                self.current_heading = math.degrees(to_center_rad) % 360.0

        elif self.active_scenario_key == "ALTITUDE_VIOLATION":
            # Erratic vertical surges breaching the 80m approved ceiling up to 295m AGL
            self.current_alt = max(145.0, 220.0 + math.sin(self.step_index * 0.24) * 65.0 + math.cos(self.step_index * 0.09) * 20.0 + random.uniform(-2.0, 2.0))
            
            # Yaw wander with gentle banking turns
            turn_deg_s = math.sin(self.step_index * 0.15) * 3.5 + random.uniform(-0.8, 0.8)
            self.current_heading = (self.current_heading + turn_deg_s * effective_dt) % 360.0
            
            # Cruising speed variation
            self.current_speed = max(10.0, min(19.0, scenario.get("speed_mps", 14.0) + math.sin(self.step_index * 0.18) * 2.5))
            
            # Soft-bounce containment
            if self.current_lat < 13.040 or self.current_lat > 13.125 or self.current_lon < 80.270 or self.current_lon > 80.335:
                to_center_rad = math.atan2(80.305 - self.current_lon, 13.085 - self.current_lat)
                self.current_heading = math.degrees(to_center_rad) % 360.0

        else:
            alt_variation = math.sin(self.step_index * 0.2) * 1.5
            self.current_alt = max(10.0, scenario["altitude_m"] + alt_variation)

        heading_rad = math.radians(self.current_heading)
        dist_m = self.current_speed * effective_dt
        meters_per_deg_lat = 111000.0
        meters_per_deg_lon = 111000.0 * max(0.2, math.cos(math.radians(self.current_lat)))

        self.current_lat += (dist_m * math.cos(heading_rad) / meters_per_deg_lat)
        self.current_lon += (dist_m * math.sin(heading_rad) / meters_per_deg_lon)

        self._send_telemetry_report()
        return self.get_snapshot()

    def _send_telemetry_report(self):
        scenario = SCENARIOS.get(self.active_scenario_key, SCENARIOS["AUTHORIZED_DRONE"])
        self.reports_sent_for_scenario += 1

        report = {
            "source": "SIMULATOR",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "track_id": scenario["track_id"],
            "uas_id": scenario.get("uas_id", scenario["track_id"]),
            "object_type": scenario.get("object_type", "DRONE"),
            "latitude": round(self.current_lat, 6),
            "longitude": round(self.current_lon, 6),
            "altitude_m": round(self.current_alt, 1),
            "speed_mps": round(self.current_speed, 1),
            "heading_deg": round(self.current_heading, 1),
            "scenario": self.active_scenario_key
        }

        if scenario.get("vision_class"):
            report["vision_class"] = scenario["vision_class"]
            report["target_hint_camera"] = scenario["vision_class"]

        ingestion_service.validate_and_ingest(report)

    def get_scenario_state(self) -> Dict[str, Any]:
        scenario = SCENARIOS.get(self.active_scenario_key, SCENARIOS["AUTHORIZED_DRONE"])
        if self.active_scenario_key == "MULTI_OBJECT":
            track_ids = ["DRN-001", "UNKNOWN-UAS-003", "DRN-002"]
        else:
            track_ids = [scenario["track_id"]]

        demo_zones = ["ZONE-TEMP-DEMO"] if self.active_scenario_key == "TEMP_RED_ZONE_VIOLATION" else []

        return {
            "active": self.state == "RUNNING",
            "scenario": self.active_scenario_key,
            "paused": self.state == "PAUSED",
            "speed": self.speed,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "track_ids": track_ids,
            "demo_zone_ids": demo_zones
        }

    def get_snapshot(self) -> Dict[str, Any]:
        scenario = SCENARIOS.get(self.active_scenario_key, SCENARIOS["AUTHORIZED_DRONE"])
        track_id = scenario["track_id"]
        all_active_tracks = [t for t in track_manager.active_tracks.values() if t.get("status") != "PURGED"]

        active_t = track_manager.active_tracks.get(track_id, {})
        if not active_t and all_active_tracks:
            drone_candidates = [t for t in all_active_tracks if t.get("object_type") == "DRONE"]
            active_t = drone_candidates[0] if drone_candidates else all_active_tracks[0]
            track_id = active_t.get("track_id", track_id)

        obj_type = active_t.get("object_type", scenario.get("object_type", "DRONE"))
        intel = self._synthesize_rf_intel(scenario, obj_type, active_t)

        snapshot_track = {
            "track_id": track_id,
            "uas_id": active_t.get("uas_id", scenario.get("uas_id", track_id)),
            "object_type": obj_type,
            "radar_confidence": active_t.get("radar_confidence", 0.96),
            "camera_confidence": active_t.get("camera_confidence", 0.0),
            "fusion_status": active_t.get("fusion_status", "RADAR_ONLY"),
            "display_status": active_t.get("display_status", "TRACKING"),
            "latitude": active_t.get("latitude", self.current_lat),
            "longitude": active_t.get("longitude", self.current_lon),
            "altitude_m": active_t.get("altitude_m", self.current_alt),
            "speed_mps": active_t.get("speed_mps", self.current_speed),
            "heading_deg": active_t.get("heading_deg", self.current_heading),
            "range_m": round(math.sqrt((active_t.get("latitude", self.current_lat) - 13.065)**2 + (active_t.get("longitude", self.current_lon) - 80.295)**2) * 111000, 1),
            "status": active_t.get("status", "TRACKING"),
            "authorization": active_t.get("authorization", {}),
            "geofence": active_t.get("geofence", {}),
            "trajectory": active_t.get("trajectory", {}),
            "risk": active_t.get("risk", {}),
            "risk_level": active_t.get("risk_level", "LOW"),
            "risk_reasons": active_t.get("risk_reasons", []),
            "alert_classification": active_t.get("alert_classification", "AUTHORIZED"),
            "alert_subtype": active_t.get("alert_subtype", "COMPLIANT_MISSION"),
            "suggested_action": active_t.get("suggested_action", "MONITOR"),
            "associated_camera": active_t.get("associated_camera"),
            "electronic_intel": intel,
            "history": active_t.get("history", [])
        }

        all_active_tracks = list(track_manager.active_tracks.values())

        return {
            "state": self.state,
            "speed": self.speed,
            "scenario": scenario,
            "active_scenario_key": self.active_scenario_key,
            "scenario_state": self.get_scenario_state(),
            "auto_cycle": self.auto_cycle,
            "step_index": self.step_index,
            "seconds_until_cycle": max(0, self.cycle_interval_steps - (self.step_index % self.cycle_interval_steps)),
            "current_track": snapshot_track,
            "tracks": all_active_tracks,
            "active_tracks": all_active_tracks,
            "ingestion_metrics": track_manager.get_ingestion_metrics(),
            "history_trail": active_t.get("history", []),
            "live_events": self.live_events
        }

    def _synthesize_rf_intel(self, scenario, obj_type, track_state):
        auth_status = track_state.get("authorization", {}).get("status", "UNKNOWN")
        if obj_type == "BIRD":
            return {
                "has_rf_emission": False,
                "rf_band": "NONE (BIOLOGICAL SILENCE)",
                "frequency_mhz": 0.0,
                "signal_strength_dbm": -108,
                "protocol": "NO RF EMISSION",
                "micro_doppler": {"rotor_rpm": 0, "blade_freq_hz": 4.2, "harmonic_count": 1, "rcs_m2": 0.008, "signature_type": "ORGANIC_WING_BEAT"}
            }
        elif obj_type == "AIRCRAFT":
            return {
                "has_rf_emission": True,
                "rf_band": "1090 MHz SSR / ADS-B",
                "frequency_mhz": 1090.0,
                "signal_strength_dbm": -42,
                "protocol": "ADS-B Out (DO-260B Mode-S)",
                "micro_doppler": {"rotor_rpm": 0, "blade_freq_hz": 0, "harmonic_count": 0, "rcs_m2": 45.0, "signature_type": "TURBOFAN_HIGH_RCS"}
            }
        elif auth_status == "AUTHORIZED":
            return {
                "has_rf_emission": True,
                "rf_band": "2.4 GHz ISM (Civil Encrypted)",
                "frequency_mhz": 2412.0,
                "signal_strength_dbm": -55,
                "protocol": "MAVLink v2 / Microhard FHSS",
                "remote_id": {"status": "VERIFIED_DGCA", "uin": scenario.get("uas_id"), "operator_distance_m": 290},
                "micro_doppler": {"rotor_rpm": 4800, "blade_freq_hz": 160.0, "harmonic_count": 4, "rcs_m2": 0.032, "signature_type": "CIVIL_QUADCOPTER_PROP"}
            }
        else:
            return {
                "has_rf_emission": True,
                "rf_band": "2.4 GHz & 5.8 GHz Dual-Band ISM",
                "frequency_mhz": 2437.0,
                "signal_strength_dbm": -68,
                "protocol": "DJI OcuSync 3.0 / Proprietary FHSS",
                "remote_id": {"status": "UNVERIFIED_BROADCAST", "uin": scenario.get("uas_id"), "operator_distance_m": 410},
                "micro_doppler": {"rotor_rpm": 5400, "blade_freq_hz": 180.0, "harmonic_count": 4, "rcs_m2": 0.026, "signature_type": "QUAD_ROTOR_SIDEBANDS"}
            }

simulation_engine = SimulationEngine()
