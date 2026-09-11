from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class OpticalDetectionSchema(BaseModel):
    box: List[int] = Field(..., description="[x1, y1, x2, y2] bounding box coordinates in pixels")
    label: str = Field(..., description="'drone', 'bird', 'airplane', 'clutter'")
    confidence: float = Field(..., description="Detection confidence [0.0, 1.0]")
    is_drone: bool
    area_ratio: float
    occluded: bool
    lighting: str = "normal"

class VisionPredictRequest(BaseModel):
    image_base64: Optional[str] = Field(default=None, description="Optional base64-encoded image")
    scenario_preset: Optional[str] = Field(
        default=None,
        description="Optional preset scenario: 'drone_clear', 'bird_flight', 'fog_occluded', 'clear_sky'"
    )

class VisionPredictResponse(BaseModel):
    status: str = Field(..., description="'ONLINE', 'BENCHMARK', 'NOT CONFIGURED'")
    has_target: bool
    primary_detection: Optional[OpticalDetectionSchema] = None
    all_detections: List[OpticalDetectionSchema] = Field(default_factory=list)
    drone_confidence: float
    inference_time_ms: float
    frame_width: int = 640
    frame_height: int = 480
    modality: str = "VISION"
    note: Optional[str] = None
