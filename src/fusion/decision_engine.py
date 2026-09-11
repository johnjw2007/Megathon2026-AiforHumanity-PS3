"""Multi-Modal Sensor Fusion and Three-State Decision Engine.

Operational Architecture (Priority Order):
1. RADAR — PRIMARY DETECTION: Establishes target existence, tracks kinematics,
   estimates range/velocity/position. The radar layer determines IF a target exists.
2. VISION — PRIMARY IDENTIFICATION: Inspects the detected target to determine
   whether visual characteristics resemble a drone or other object class.
3. RF — FALLBACK / CONFIRMATION: Used when visual evidence is insufficient,
   ambiguous, unavailable, or when additional electromagnetic confirmation is useful.
4. FUSION — FINAL DECISION: Combines all available evidence into a three-state output.

Produces Three-State Decision:
- DRONE: Strong, concordant multi-modal evidence.
- NON-DRONE: Modalities agree target is non-drone (bird, aircraft, clutter).
- UNCERTAIN: Insufficient evidence, severe sensor disagreement, or sensor occlusion.
"""
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import numpy as np
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fusion.evidence import ModalityEvidence

@dataclass
class FusionDecision:
    """Explainable three-state fusion output."""
    classification: str             # 'DRONE', 'NON-DRONE', 'UNCERTAIN'
    overall_confidence: float       # Confidence in the final decision [0.0, 1.0]
    fused_drone_score: float        # Weighted aggregate drone probability [0.0, 1.0]
    sensor_agreement: float         # Concordance metric across modalities [0.0, 1.0]
    conflicts: List[str]            # Modalities showing severe contradiction
    active_modalities: List[str]    # Modalities contributing to this decision
    rationale: str                  # Explainable natural language justification
    evidence_summary: Dict[str, Any]# Breakdown of individual sensor inputs

class MultiModalFusionEngine:
    """Configurable, evidence-weighted decision engine."""

    def __init__(
        self,
        drone_threshold: float = 0.65,
        non_drone_threshold: float = 0.35,
        min_agreement_threshold: float = 0.40,
        weights: Optional[Dict[str, float]] = None,
    ):
        self.drone_threshold = drone_threshold
        self.non_drone_threshold = non_drone_threshold
        self.min_agreement_threshold = min_agreement_threshold
        # Sensor weights reflect operational priority:
        # Radar (0.45): PRIMARY detection — establishes target existence & kinematics
        # Vision (0.35): PRIMARY identification — classifies target visually
        # RF (0.20): FALLBACK / confirmation — auxiliary electromagnetic evidence
        self.weights = weights or {"RADAR": 0.45, "VISION": 0.35, "RF": 0.20}

    def fuse(
        self,
        radar: Optional[ModalityEvidence] = None,
        vision: Optional[ModalityEvidence] = None,
        rf: Optional[ModalityEvidence] = None,
    ) -> FusionDecision:
        """Execute multi-modal evidence fusion and return an explainable decision."""
        evidences: List[ModalityEvidence] = []
        if radar and radar.is_available:
            evidences.append(radar)
        if vision and vision.is_available:
            evidences.append(vision)
        if rf and rf.is_available:
            evidences.append(rf)

        # Case 0: No active sensors available
        if not evidences:
            return FusionDecision(
                classification="UNCERTAIN",
                overall_confidence=0.0,
                fused_drone_score=0.5,
                sensor_agreement=0.0,
                conflicts=[],
                active_modalities=[],
                rationale="Zero sensor evidence available: all sensor feeds offline or disconnected.",
                evidence_summary={},
            )

        evidence_summary = {e.modality: e.to_dict() for e in evidences}
        active_modalities = [e.modality for e in evidences]

        # Case 1: Radar reports NO target detected at all
        # Radar is the primary detection layer — if it says no target, the airspace is clear.
        if radar and radar.is_available and not radar.detected_target:
            return FusionDecision(
                classification="NON-DRONE",
                overall_confidence=round(radar.confidence, 4),
                fused_drone_score=0.0,
                sensor_agreement=1.0,
                conflicts=[],
                active_modalities=active_modalities,
                rationale="Radar (primary detection) confirmed airspace is clear; no airborne target detected.",
                evidence_summary=evidence_summary,
            )

        # Compute weighted aggregate drone probability
        total_weight = 0.0
        weighted_drone_sum = 0.0
        drone_votes = []

        for e in evidences:
            w = self.weights.get(e.modality, 1.0) * e.confidence
            weighted_drone_sum += e.drone_probability * w
            total_weight += w
            drone_votes.append(e.drone_probability)

        fused_score = weighted_drone_sum / total_weight if total_weight > 0 else 0.5
        fused_score = float(np.clip(fused_score, 0.0, 1.0))

        # Measure sensor agreement: 1.0 - standard deviation of normalized drone votes
        if len(drone_votes) > 1:
            vote_spread = float(np.std(drone_votes)) # 0.0 (perfect agreement) to 0.5 (maximum conflict)
            agreement = float(np.clip(1.0 - (vote_spread * 2.0), 0.0, 1.0))
        else:
            agreement = 1.0

        # Detect pairwise severe conflicts (e.g. one says >0.85, another says <0.15)
        conflicts = []
        for i in range(len(evidences)):
            for j in range(i + 1, len(evidences)):
                e1, e2 = evidences[i], evidences[j]
                if abs(e1.drone_probability - e2.drone_probability) > 0.60:
                    conflicts.append(f"{e1.modality} vs {e2.modality}")

        # Compute overall confidence
        avg_sensor_conf = float(np.mean([e.confidence for e in evidences]))
        # Confidence increases with agreement and sensor confidence
        decision_confidence = avg_sensor_conf * (0.6 + 0.4 * agreement)

        # Three-state decision rules
        # Rule A: Contradictory evidence or poor agreement -> UNCERTAIN
        if conflicts and agreement < self.min_agreement_threshold:
            classification = "UNCERTAIN"
            rationale = (
                f"Severe sensor conflict detected ({', '.join(conflicts)}). "
                f"Sensors exhibit divergent indications (agreement: {agreement:.2f}); "
                f"escalating to UNCERTAIN for operator inspection."
            )
            decision_confidence *= 0.70  # Conflict reduces confidence

        # Rule B: Insufficient evidence (e.g. single weak modality)
        elif len(evidences) == 1 and avg_sensor_conf < 0.65:
            classification = "UNCERTAIN"
            rationale = (
                f"Insufficient evidence: single modality ({evidences[0].modality}) reporting with marginal "
                f"confidence ({avg_sensor_conf:.2f})."
            )

        # Rule C: Clear Drone
        elif fused_score >= self.drone_threshold:
            classification = "DRONE"
            supporting = [e.modality for e in evidences if e.drone_probability >= 0.50]
            rationale = (
                f"Positive drone confirmation: fused score {fused_score:.2f} >= {self.drone_threshold:.2f}. "
                f"Supported by {', '.join(supporting)}."
            )

        # Rule D: Clear Non-Drone
        elif fused_score <= self.non_drone_threshold:
            classification = "NON-DRONE"
            supporting = [e.modality for e in evidences if e.drone_probability < 0.50]
            rationale = (
                f"Confirmed non-drone target: fused score {fused_score:.2f} <= {self.non_drone_threshold:.2f}. "
                f"Supported by {', '.join(supporting)}."
            )

        # Rule E: Intermediate score with no decisive resolution
        else:
            classification = "UNCERTAIN"
            rationale = (
                f"Equivocal evidence: fused score {fused_score:.2f} lies between decision thresholds "
                f"[{self.non_drone_threshold:.2f}, {self.drone_threshold:.2f}]."
            )

        return FusionDecision(
            classification=classification,
            overall_confidence=round(float(decision_confidence), 4),
            fused_drone_score=round(float(fused_score), 4),
            sensor_agreement=round(float(agreement), 4),
            conflicts=conflicts,
            active_modalities=active_modalities,
            rationale=rationale,
            evidence_summary=evidence_summary,
        )
