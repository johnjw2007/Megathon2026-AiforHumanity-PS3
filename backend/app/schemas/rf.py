from typing import List, Optional, Dict, Any
import math
from pydantic import BaseModel, Field, field_validator

class RFPredictRequest(BaseModel):
    samples: List[float] = Field(
        ...,
        description="Exactly 300 interleaved numeric I/Q baseband features (150 I, 150 Q)",
        min_length=300,
        max_length=300
    )
    model_name: Optional[str] = Field(
        default=None,
        description="Target model architecture: 'baseline' or 'cnn'. Defaults to best model (baseline)."
    )

    @field_validator("samples")
    @classmethod
    def validate_samples(cls, v: List[float]) -> List[float]:
        if len(v) != 300:
            raise ValueError(f"Input samples must contain exactly 300 numeric values, received {len(v)}.")
        for idx, val in enumerate(v):
            if not isinstance(val, (int, float)):
                raise ValueError(f"Sample index {idx} is non-numeric: {val}")
            if math.isnan(val):
                raise ValueError(f"Sample index {idx} contains NaN value.")
            if math.isinf(val):
                raise ValueError(f"Sample index {idx} contains infinite value.")
        return v

class RFPredictResponse(BaseModel):
    classification: str = Field(..., description="'DRONE' or 'NON-DRONE'")
    probability: float = Field(..., description="Calibrated probability of being a DRONE [0.0, 1.0]")
    confidence: float = Field(..., description="Confidence in the classification [0.0, 1.0]")
    threshold: float = Field(..., description="Operating threshold used for binary decision")
    model: str = Field(..., description="Model architecture used for inference")
    latency_ms: float = Field(..., description="Measured real inference latency in milliseconds")
    features_processed: int = 300
    modality: str = "RF"
    waveform: Optional[Dict[str, List[float]]] = Field(
        default=None,
        description="Deinterleaved waveform arrays: 'i' (150 points) and 'q' (150 points)"
    )

class RFSampleInfo(BaseModel):
    sample_id: str
    label: int
    ground_truth: str
    description: str
    features: List[float]
    waveform: Dict[str, List[float]]
