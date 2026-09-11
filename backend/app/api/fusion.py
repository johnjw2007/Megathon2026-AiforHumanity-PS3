"""Fusion API endpoint — multi-modal sensor fusion."""
import time
from typing import Optional
from fastapi import APIRouter, HTTPException

from backend.app.schemas.fusion import (
    FusionPredictRequest,
    FusionDecisionSchema,
    DemoScenarioRequest,
)
from backend.app.services.fusion_service import fusion_service
from backend.app.services.rf_service import rf_service
from backend.app.services.vision_service import vision_service
from backend.app.services.radar_service import radar_service
from backend.app.services.event_service import event_service

router = APIRouter()


@router.post("/predict")
async def fusion_predict(request: FusionPredictRequest):
    """Run multi-modal fusion with provided evidence."""
    t0 = time.perf_counter()
    try:
        result = fusion_service.fuse(
            radar=request.radar.model_dump() if request.radar else None,
            vision=request.vision.model_dump() if request.vision else None,
            rf=request.rf.model_dump() if request.rf else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fusion failed: {e}")

    latency_ms = (time.perf_counter() - t0) * 1000.0

    # Record event
    event_service.record(
        target_id="DIRECT-FUSION",
        radar_state="ONLINE" if request.radar else "NOT_CONFIGURED",
        vision_state="ONLINE" if request.vision else "NOT_CONFIGURED",
        rf_state="ONLINE" if request.rf else "NOT_CONFIGURED",
        fusion_result=result["classification"],
        confidence=result["overall_confidence"],
        details=result,
    )

    result["latency_ms"] = round(latency_ms, 3)
    return result


@router.post("/demo")
async def fusion_demo(request: DemoScenarioRequest):
    """Run a deterministic demo scenario."""
    from demo_scenarios import (
        get_scenario_a,
        get_scenario_b,
        get_scenario_c,
        get_scenario_d,
    )

    scenario_map = {
        "A": get_scenario_a,
        "B": get_scenario_b,
        "C": get_scenario_c,
        "D": get_scenario_d,
    }

    fn = scenario_map.get(request.scenario.upper())
    if not fn:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown scenario '{request.scenario}'. Use A, B, C, or D.",
        )

    t0 = time.perf_counter()
    info, decision = fn()
    latency_ms = (time.perf_counter() - t0) * 1000.0

    # Record event
    event_service.record(
        target_id=info["scenario_id"],
        radar_state="SIMULATED",
        vision_state="SIMULATED" if info.get("vision", {}).get("confidence", 0) > 0 else "NOT_CONFIGURED",
        rf_state="ONLINE",
        fusion_result=decision.classification,
        confidence=decision.overall_confidence,
        details={
            "scenario_id": info["scenario_id"],
            "title": info["title"],
            "narrative": info["narrative"],
        },
    )

    return {
        "scenario_id": info["scenario_id"],
        "title": info["title"],
        "narrative": info["narrative"],
        "expected_state": info["expected_state"],
        "classification": decision.classification,
        "overall_confidence": decision.overall_confidence,
        "fused_drone_score": decision.fused_drone_score,
        "sensor_agreement": decision.sensor_agreement,
        "conflicts": decision.conflicts,
        "active_modalities": decision.active_modalities,
        "rationale": decision.rationale,
        "radar": info.get("radar"),
        "vision": info.get("vision"),
        "rf": info.get("rf"),
        "latency_ms": round(latency_ms, 3),
    }
