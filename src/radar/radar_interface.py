"""Radar sensor abstraction interface for airborne target detection and kinematic tracking.

Defines the radar data contract:
- Airborne target verification
- Kinematic state (range, azimuth, elevation, radial velocity)
- Radar Cross Section (RCS)
- Track history and kinematic consistency
- Explicit simulated flag (enforcing scientific honesty)
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import time

@dataclass
class RadarTrackPoint:
    """Single point in a radar kinematic track."""
    timestamp: float
    range_m: float
    azimuth_deg: float
    elevation_deg: float
    radial_velocity_mps: float
    rcs_dbms: float

@dataclass
class RadarDetection:
    """Current radar target detection report."""
    target_id: str
    has_target: bool
    range_m: float
    azimuth_deg: float
    elevation_deg: float
    radial_velocity_mps: float
    estimated_rcs_dbms: float
    confidence: float
    is_simulated: bool = True               # Scientific contract: explicitly declared as SIMULATED
    track_length: int = 0
    kinematic_class_hint: str = "unknown"   # 'rotary_wing_profile', 'avian_profile', 'fixed_wing_profile'
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["source"] = "SIMULATED_RADAR" if self.is_simulated else "HARDWARE_RADAR"
        return d

class RadarSensorBase(ABC):
    """Abstract Base Class for Radar Sensors (Hardware or Simulation)."""

    @abstractmethod
    def scan(self) -> List[RadarDetection]:
        """Perform a spatial scan and return active target detections."""
        pass

    @abstractmethod
    def get_track(self, target_id: str) -> List[RadarTrackPoint]:
        """Return history of track points for a specific target ID."""
        pass
