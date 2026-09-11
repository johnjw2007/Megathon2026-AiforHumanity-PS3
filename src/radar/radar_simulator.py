"""Physics-based Radar Kinematic Simulator.

Simulates aerial target radar returns for multiple simultaneous targets:
1. Micro-UAV / Quadcopter: Low RCS (-12 dBsm), speed 0-25 m/s, hovering capability
2. Avian Target (Bird): Very low RCS (-20 dBsm), speed 5-15 m/s, continuous forward flight
3. Commercial / General Aircraft: High RCS (+20 dBsm), speed 150-250 m/s, high altitude
4. Unknown / Obstruction: Very low RCS, slow speed, clutter-like

SCIENTIFIC CONTRACT: All telemetry produced by this class is explicitly labeled as SIMULATED.
"""
import time
import math
import sys
from pathlib import Path
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

SRC_DIR = Path(__file__).resolve().parent.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from radar.radar_interface import RadarSensorBase, RadarDetection, RadarTrackPoint

# Target type configurations
TARGET_CONFIGS = {
    "drone": {
        "rcs_mean": -12.0, "rcs_std": 1.5,
        "velocity_range": (0.0, 18.0),
        "kinematic_hint": "rotary_wing_profile",
        "conf_mean": 0.92, "conf_std": 0.03,
        "conf_bounds": (0.70, 0.98),
        "color": "#f85149",  # RED
        "symbol": "●",
        "label": "DRONE",
    },
    "bird": {
        "rcs_mean": -22.0, "rcs_std": 2.0,
        "velocity_range": (6.0, 14.0),
        "kinematic_hint": "avian_profile",
        "conf_mean": 0.78, "conf_std": 0.05,
        "conf_bounds": (0.50, 0.90),
        "color": "#d29922",  # AMBER
        "symbol": "●",
        "label": "BIRD",
    },
    "airplane": {
        "rcs_mean": 22.0, "rcs_std": 3.0,
        "velocity_range": (160.0, 240.0),
        "kinematic_hint": "fixed_wing_profile",
        "conf_mean": 0.98, "conf_std": 0.01,
        "conf_bounds": (0.90, 0.99),
        "color": "#58a6ff",  # BLUE
        "symbol": "●",
        "label": "AIRCRAFT",
    },
    "unknown": {
        "rcs_mean": -28.0, "rcs_std": 3.0,
        "velocity_range": (0.0, 2.0),
        "kinematic_hint": "clutter",
        "conf_mean": 0.35, "conf_std": 0.10,
        "conf_bounds": (0.10, 0.55),
        "color": "#bc8cff",  # PURPLE
        "symbol": "●",
        "label": "UNKNOWN",
    },
}


class SimulatedRadarSensor(RadarSensorBase):
    """Calibrated kinematic radar simulation engine with multiple targets."""

    def __init__(self, update_rate_hz: float = 2.0, rng_seed: int = 42):
        self.update_rate_hz = update_rate_hz
        self.rng = np.random.RandomState(rng_seed)
        self.tracks: Dict[str, List[RadarTrackPoint]] = {}
        self._targets: List[Dict[str, Any]] = []
        self._initialize_targets()

    def _initialize_targets(self):
        """Initialize 8 radar targets with different types and positions."""
        # Define target mix: 3 drones, 2 birds, 1 airplane, 2 unknown
        target_specs = [
            ("drone", "TGT-DRN-01"),
            ("drone", "TGT-DRN-02"),
            ("drone", "TGT-DRN-03"),
            ("bird", "TGT-BRD-01"),
            ("bird", "TGT-BRD-02"),
            ("airplane", "TGT-AIR-01"),
            ("unknown", "TGT-UNK-01"),
            ("unknown", "TGT-UNK-02"),
        ]

        for target_type, target_id in target_specs:
            cfg = TARGET_CONFIGS[target_type]
            
            # Generate initial position with some spread
            range_m = float(self.rng.uniform(100.0, 600.0))
            azimuth_deg = float(self.rng.uniform(0.0, 360.0))
            elevation_deg = float(self.rng.uniform(5.0, 30.0))
            
            # Generate initial velocity
            vel_range = cfg["velocity_range"]
            velocity = float(self.rng.uniform(vel_range[0], vel_range[1]))
            
            # Generate RCS
            rcs = float(self.rng.normal(cfg["rcs_mean"], cfg["rcs_std"]))
            
            # Generate confidence
            conf = float(np.clip(
                self.rng.normal(cfg["conf_mean"], cfg["conf_std"]),
                cfg["conf_bounds"][0], cfg["conf_bounds"][1]
            ))
            
            # Movement parameters (smooth movement)
            range_rate = float(self.rng.uniform(-2.0, 2.0))  # m/s toward/away
            azimuth_rate = float(self.rng.uniform(-0.5, 0.5))  # deg/s
            
            self._targets.append({
                "id": target_id,
                "type": target_type,
                "range_m": range_m,
                "azimuth_deg": azimuth_deg,
                "elevation_deg": elevation_deg,
                "velocity_mps": velocity,
                "rcs_dbsm": rcs,
                "confidence": conf,
                "range_rate": range_rate,
                "azimuth_rate": azimuth_rate,
                "color": cfg["color"],
                "symbol": cfg["symbol"],
                "label": cfg["label"],
                "kinematic_hint": cfg["kinematic_hint"],
            })

    def _update_targets(self):
        """Smoothly update target positions."""
        for t in self._targets:
            # Update position with smooth movement
            t["range_m"] += t["range_rate"] * (1.0 / self.update_rate_hz)
            t["azimuth_deg"] += t["azimuth_rate"] * (1.0 / self.update_rate_hz)
            
            # Keep range within bounds
            t["range_m"] = np.clip(t["range_m"], 50.0, 800.0)
            
            # Wrap azimuth
            t["azimuth_deg"] = t["azimuth_deg"] % 360.0
            
            # Add small random perturbation to velocity
            cfg = TARGET_CONFIGS[t["type"]]
            vel_range = cfg["velocity_range"]
            t["velocity_mps"] += float(self.rng.normal(0, 0.5))
            t["velocity_mps"] = np.clip(t["velocity_mps"], vel_range[0], vel_range[1])
            
            # Slight RCS variation
            t["rcs_dbsm"] += float(self.rng.normal(0, 0.1))

    def generate_target_state(
        self,
        target_type: str = "drone",
        base_range_m: float = 450.0,
        base_azimuth_deg: float = 35.0,
        base_elevation_deg: float = 12.0,
    ) -> RadarDetection:
        """Generate a single radar return with kinematic profile."""
        now = time.time()
        cfg = TARGET_CONFIGS.get(target_type, TARGET_CONFIGS["unknown"])
        
        # Generate values
        rcs = float(self.rng.normal(cfg["rcs_mean"], cfg["rcs_std"]))
        vel_range = cfg["velocity_range"]
        velocity = float(self.rng.uniform(vel_range[0], vel_range[1]))
        conf = float(np.clip(
            self.rng.normal(cfg["conf_mean"], cfg["conf_std"]),
            cfg["conf_bounds"][0], cfg["conf_bounds"][1]
        ))
        
        # Measurement noise
        range_m = float(base_range_m + self.rng.normal(0.0, 2.5))
        azimuth_deg = float(base_azimuth_deg + self.rng.normal(0.0, 0.5))
        elevation_deg = float(base_elevation_deg + self.rng.normal(0.0, 0.5))

        point = RadarTrackPoint(
            timestamp=now,
            range_m=round(range_m, 2),
            azimuth_deg=round(azimuth_deg, 2),
            elevation_deg=round(elevation_deg, 2),
            radial_velocity_mps=round(velocity, 2),
            rcs_dbms=round(rcs, 2),
        )
        
        tid = f"TGT-{target_type[:3].upper()}-01"
        if tid not in self.tracks:
            self.tracks[tid] = []
        self.tracks[tid].append(point)
        if len(self.tracks[tid]) > 50:
            self.tracks[tid].pop(0)

        return RadarDetection(
            target_id=tid,
            has_target=True,
            range_m=round(range_m, 2),
            azimuth_deg=round(azimuth_deg, 2),
            elevation_deg=round(elevation_deg, 2),
            radial_velocity_mps=round(velocity, 2),
            estimated_rcs_dbms=round(rcs, 2),
            confidence=round(conf, 4),
            is_simulated=True,
            track_length=len(self.tracks[tid]),
            kinematic_class_hint=cfg["kinematic_hint"],
            timestamp=now,
        )

    def scan(self) -> List[RadarDetection]:
        """Perform scan returning ALL active targets."""
        self._update_targets()
        
        detections = []
        now = time.time()
        
        for t in self._targets:
            # Add measurement noise
            range_m = float(t["range_m"] + self.rng.normal(0.0, 1.5))
            azimuth_deg = float(t["azimuth_deg"] + self.rng.normal(0.0, 0.3))
            elevation_deg = float(t["elevation_deg"] + self.rng.normal(0.0, 0.2))
            velocity = float(t["velocity_mps"] + self.rng.normal(0.0, 0.3))
            rcs = float(t["rcs_dbsm"] + self.rng.normal(0.0, 0.2))
            
            point = RadarTrackPoint(
                timestamp=now,
                range_m=round(range_m, 2),
                azimuth_deg=round(azimuth_deg, 2),
                elevation_deg=round(elevation_deg, 2),
                radial_velocity_mps=round(velocity, 2),
                rcs_dbms=round(rcs, 2),
            )
            
            # Update track
            if t["id"] not in self.tracks:
                self.tracks[t["id"]] = []
            self.tracks[t["id"]].append(point)
            if len(self.tracks[t["id"]]) > 50:
                self.tracks[t["id"]].pop(0)
            
            detections.append(RadarDetection(
                target_id=t["id"],
                has_target=True,
                range_m=round(range_m, 2),
                azimuth_deg=round(azimuth_deg, 2),
                elevation_deg=round(elevation_deg, 2),
                radial_velocity_mps=round(velocity, 2),
                estimated_rcs_dbms=round(rcs, 2),
                confidence=round(float(t["confidence"]), 4),
                is_simulated=True,
                track_length=len(self.tracks[t["id"]]),
                kinematic_class_hint=t["kinematic_hint"],
                timestamp=now,
            ))
        
        return detections

    def get_targets(self) -> List[Dict[str, Any]]:
        """Get all current target states with metadata."""
        return [
            {
                "id": t["id"],
                "type": t["type"],
                "range_m": round(t["range_m"], 1),
                "azimuth_deg": round(t["azimuth_deg"], 1),
                "elevation_deg": round(t["elevation_deg"], 1),
                "velocity_mps": round(t["velocity_mps"], 1),
                "rcs_dbsm": round(t["rcs_dbsm"], 1),
                "confidence": round(t["confidence"], 3),
                "color": t["color"],
                "symbol": t["symbol"],
                "label": t["label"],
                "kinematic_hint": t["kinematic_hint"],
            }
            for t in self._targets
        ]

    def get_track(self, target_id: str) -> List[RadarTrackPoint]:
        return self.tracks.get(target_id, [])
