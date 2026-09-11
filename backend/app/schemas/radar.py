from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RadarDetectionSchema(BaseModel):
    target_id: str
    has_target: bool
    range_m: float
    azimuth_deg: float
    elevation_deg: float
    radial_velocity_mps: float
    estimated_rcs_dbms: float
    confidence: float
    is_simulated: bool = True
    source: str = "SIMULATED_RADAR"
    track_length: int = 0
    kinematic_class_hint: str = "unknown"


class RadarStatusResponse(BaseModel):
    status: str = "SIMULATION"
    update_rate_hz: float = 10.0
    mode: str = "simulated"
    note: str = "No real radar hardware connected. Data is SIMULATED."


class RadarTargetsResponse(BaseModel):
    targets: List[RadarDetectionSchema]
    source: str = "SIMULATED_RADAR"
    note: str = "All radar data is SIMULATED. No live hardware."
