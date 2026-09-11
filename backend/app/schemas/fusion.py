from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ModalityEvidenceSchema(BaseModel):
    modality: str = "UNKNOWN"
    is_available: bool = True
    detected_target: bool = True
    drone_probability: float = 0.5
    confidence: float = 0.5
    weight: float = 1.0
    metadata: Dict[str, Any] = {}


class FusionPredictRequest(BaseModel):
    radar: Optional[ModalityEvidenceSchema] = None
    vision: Optional[ModalityEvidenceSchema] = None
    rf: Optional[ModalityEvidenceSchema] = None


class FusionDecisionSchema(BaseModel):
    classification: str = Field(..., description="DRONE, NON-DRONE, or UNCERTAIN")
    overall_confidence: float
    fused_drone_score: float
    sensor_agreement: float
    conflicts: List[str]
    active_modalities: List[str]
    rationale: str
    evidence_summary: Dict[str, Any]


class DemoScenarioRequest(BaseModel):
    scenario: str = Field(
        default="A",
        description="Scenario letter: A (triple confirm), B (bird rejection), C (occluded drone), D (sensor conflict)",
    )
