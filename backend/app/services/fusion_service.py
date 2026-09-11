"""Fusion Service — multi-modal sensor fusion and three-state decision engine."""
import time
from typing import Dict, Any, Optional

from fusion.evidence import ModalityEvidence
from fusion.decision_engine import MultiModalFusionEngine


class FusionService:
    """Multi-modal fusion engine."""

    def __init__(self):
        self._engine = MultiModalFusionEngine()

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "ONLINE",
            "mode": "rule_based_weighted_fusion",
            "note": "Three-state decision engine: DRONE / NON-DRONE / UNCERTAIN",
        }

    def fuse(
        self,
        radar: Optional[Dict[str, Any]] = None,
        vision: Optional[Dict[str, Any]] = None,
        rf: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Run fusion on provided evidence dicts. Missing modalities are treated as unavailable."""
        r_ev = None
        v_ev = None
        rf_ev = None

        if radar:
            r_ev = ModalityEvidence(
                modality="RADAR",
                is_available=radar.get("is_available", True),
                detected_target=radar.get("detected_target", True),
                drone_probability=radar.get("drone_probability", 0.5),
                confidence=radar.get("confidence", 0.5),
                weight=radar.get("weight", 1.0),
                metadata=radar.get("metadata", {}),
            )

        if vision:
            v_ev = ModalityEvidence(
                modality="VISION",
                is_available=vision.get("is_available", True),
                detected_target=vision.get("detected_target", True),
                drone_probability=vision.get("drone_probability", 0.5),
                confidence=vision.get("confidence", 0.5),
                weight=vision.get("weight", 1.0),
                metadata=vision.get("metadata", {}),
            )

        if rf:
            rf_ev = ModalityEvidence(
                modality="RF",
                is_available=rf.get("is_available", True),
                detected_target=rf.get("detected_target", True),
                drone_probability=rf.get("drone_probability", 0.5),
                confidence=rf.get("confidence", 0.5),
                weight=rf.get("weight", 1.0),
                metadata=rf.get("metadata", {}),
            )

        decision = self._engine.fuse(radar=r_ev, vision=v_ev, rf=rf_ev)
        return {
            "classification": decision.classification,
            "overall_confidence": decision.overall_confidence,
            "fused_drone_score": decision.fused_drone_score,
            "sensor_agreement": decision.sensor_agreement,
            "conflicts": decision.conflicts,
            "active_modalities": decision.active_modalities,
            "rationale": decision.rationale,
            "evidence_summary": decision.evidence_summary,
        }


fusion_service = FusionService()
