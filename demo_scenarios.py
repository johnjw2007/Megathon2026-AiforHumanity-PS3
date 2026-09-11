"""Deterministic Demo Scenarios for Multi-Modal Fusion.

Operational Architecture (Priority Order):
1. RADAR — PRIMARY DETECTION: Establishes target existence, tracks kinematics
2. VISION — PRIMARY IDENTIFICATION: Classifies target visually
3. RF — FALLBACK / CONFIRMATION: Used when visual evidence is insufficient
4. FUSION — FINAL DECISION: Combines all evidence into three-state output

Scenarios:
  A — Radar detects target → Vision identifies drone → Fusion → DRONE
  B — Radar detects target → Vision identifies bird → Fusion → NON-DRONE
  C — Radar detects target → Vision uncertain → RF confirms drone → Fusion → DRONE
  D — Radar detects target → Vision uncertain → RF unavailable → Fusion → UNCERTAIN
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
SRC_DIR = REPO_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fusion.decision_engine import MultiModalFusionEngine, FusionDecision
from fusion.evidence import ModalityEvidence

_engine = MultiModalFusionEngine()


def _make_scenario(
    scenario_id: str,
    title: str,
    narrative: str,
    expected_state: str,
    radar_ev: ModalityEvidence = None,
    vision_ev: ModalityEvidence = None,
    rf_ev: ModalityEvidence = None,
    radar_info: dict = None,
    vision_info: dict = None,
    rf_info: dict = None,
):
    """Helper to build an (info, decision) pair."""
    decision = _engine.fuse(radar=radar_ev, vision=vision_ev, rf=rf_ev)
    info = {
        "scenario_id": scenario_id,
        "title": title,
        "narrative": narrative,
        "expected_state": expected_state,
    }
    if radar_info:
        info["radar"] = radar_info
    if vision_info:
        info["vision"] = vision_info
    if rf_info:
        info["rf"] = rf_info
    return info, decision


def get_scenario_a():
    """Scenario A: Radar detects target → Vision identifies drone → DRONE."""
    return _make_scenario(
        scenario_id="SCN-A-RADAR-VISION-DRONE",
        title="Radar + Vision Confirm Drone",
        narrative=(
            "RADAR (primary detection) establishes an airborne target at 450m with "
            "rotary-wing kinematics. VISION (primary identification) inspects the "
            "target and classifies it as a drone with high confidence. "
            "FUSION combines both sources → DRONE."
        ),
        expected_state="DRONE",
        radar_ev=ModalityEvidence("RADAR", True, True, 0.85, 0.92),
        vision_ev=ModalityEvidence("VISION", True, True, 0.90, 0.90),
        radar_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.85, "confidence": 0.92,
            "metadata": {"range_m": 450, "velocity_mps": 12.5, "rcs_dbms": -11.8, "source": "SIMULATED_RADAR"},
        },
        vision_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.90, "confidence": 0.90,
            "metadata": {"label": "drone", "occluded": False, "source": "SIMULATION"},
        },
    )


def get_scenario_b():
    """Scenario B: Radar detects target → Vision identifies bird → NON-DRONE."""
    return _make_scenario(
        scenario_id="SCN-B-RADAR-VISION-BIRD",
        title="Radar + Vision Identify Bird",
        narrative=(
            "RADAR (primary detection) detects an airborne target at 320m with "
            "biological flight kinematics (5-15 m/s, no hovering). "
            "VISION (primary identification) classifies the target as a bird. "
            "FUSION combines both sources → NON-DRONE."
        ),
        expected_state="NON-DRONE",
        radar_ev=ModalityEvidence("RADAR", True, True, 0.10, 0.85),
        vision_ev=ModalityEvidence("VISION", True, True, 0.08, 0.90),
        radar_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.10, "confidence": 0.85,
            "metadata": {"range_m": 320, "velocity_mps": 9.2, "rcs_dbms": -21.5, "source": "SIMULATED_RADAR"},
        },
        vision_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.08, "confidence": 0.90,
            "metadata": {"label": "bird", "occluded": False, "source": "SIMULATION"},
        },
    )


def get_scenario_c():
    """Scenario C: Radar detects → Vision uncertain → RF confirms drone → DRONE."""
    return _make_scenario(
        scenario_id="SCN-C-RF-FALLBACK-CONFIRM",
        title="RF Fallback Confirms Drone",
        narrative=(
            "RADAR (primary detection) detects an airborne target at 380m with "
            "rotary-wing kinematics. VISION (primary identification) is degraded "
            "by fog and returns low confidence. RF (fallback confirmation) is "
            "invoked and detects a matching electromagnetic drone signature. "
            "FUSION combines all sources → DRONE."
        ),
        expected_state="DRONE",
        radar_ev=ModalityEvidence("RADAR", True, True, 0.80, 0.88),
        vision_ev=ModalityEvidence("VISION", True, True, 0.40, 0.35),
        rf_ev=ModalityEvidence("RF", True, True, 0.92, 0.88),
        radar_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.80, "confidence": 0.88,
            "metadata": {"range_m": 380, "velocity_mps": 5.0, "rcs_dbms": -13.1, "source": "SIMULATED_RADAR"},
        },
        vision_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.40, "confidence": 0.35,
            "metadata": {"label": "unknown", "occluded": True, "source": "SIMULATION"},
        },
        rf_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.92, "confidence": 0.88,
            "metadata": {"model": "baseline", "source": "RF_CLASSIFIER"},
        },
    )


def get_scenario_d():
    """Scenario D: Radar detects → Vision uncertain → RF unavailable → UNCERTAIN."""
    return _make_scenario(
        scenario_id="SCN-D-INSUFFICIENT-EVIDENCE",
        title="Insufficient Evidence",
        narrative=(
            "RADAR (primary detection) detects an airborne target at 500m. "
            "VISION (primary identification) is degraded by weather and returns "
            "low confidence. RF (fallback) is unavailable — no electromagnetic "
            "signature captured. Insufficient evidence for classification. "
            "FUSION → UNCERTAIN for operator inspection."
        ),
        expected_state="UNCERTAIN",
        radar_ev=ModalityEvidence("RADAR", True, True, 0.60, 0.70),
        vision_ev=ModalityEvidence("VISION", True, True, 0.45, 0.30),
        radar_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.60, "confidence": 0.70,
            "metadata": {"range_m": 500, "velocity_mps": 8.0, "rcs_dbms": -15.0, "source": "SIMULATED_RADAR"},
        },
        vision_info={
            "is_available": True, "detected_target": True,
            "drone_probability": 0.45, "confidence": 0.30,
            "metadata": {"label": "unknown", "occluded": True, "source": "SIMULATION"},
        },
    )


def run_all_scenarios():
    """Run all 4 scenarios and return aggregate results."""
    results = {}
    all_passed = True
    expected = {"A": "DRONE", "B": "NON-DRONE", "C": "DRONE", "D": "UNCERTAIN"}

    for label, fn in [
        ("A", get_scenario_a),
        ("B", get_scenario_b),
        ("C", get_scenario_c),
        ("D", get_scenario_d),
    ]:
        info, decision = fn()
        passed = decision.classification == expected[label]
        results[label] = {
            "scenario_id": info["scenario_id"],
            "expected": expected[label],
            "actual": decision.classification,
            "passed": passed,
            "confidence": decision.overall_confidence,
        }
        if not passed:
            all_passed = False

    return {"all_passed": all_passed, "results": results}


if __name__ == "__main__":
    res = run_all_scenarios()
    print("=== DEMO SCENARIOS (Radar-First Architecture) ===")
    for k, v in res["results"].items():
        status = "PASS" if v["passed"] else "FAIL"
        print(f"  Scenario {k}: {v['actual']} (expected {v['expected']}) [{status}]")
    print(f"\nAll passed: {res['all_passed']}")
