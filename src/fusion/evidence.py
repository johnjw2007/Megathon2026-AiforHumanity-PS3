"""Sensor Evidence Schema for Multi-Modal Fusion."""
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional
import time

@dataclass
class ModalityEvidence:
    """Standardized evidence packet from an individual sensing modality."""
    modality: str                          # 'RADAR', 'VISION', 'RF'
    is_available: bool                     # True if sensor is operational and reporting
    detected_target: bool                  # True if an airborne target is observed
    drone_probability: float               # Probability [0.0, 1.0] that target is a drone
    confidence: float                      # Sensor measurement confidence [0.0, 1.0]
    weight: float = 1.0                    # Relative modality importance weight
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
