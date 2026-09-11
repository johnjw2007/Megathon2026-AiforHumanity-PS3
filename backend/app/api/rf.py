"""RF Classification API endpoint."""
import time
from fastapi import APIRouter, HTTPException

from backend.app.schemas.rf import RFPredictRequest, RFPredictResponse
from backend.app.services.rf_service import rf_service

router = APIRouter()


@router.post("/predict", response_model=RFPredictResponse)
async def rf_predict(request: RFPredictRequest):
    """Run real RF inference on 300 I/Q features using the trained model."""
    try:
        result = rf_service.predict(request.samples)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RF inference failed: {e}")

    return RFPredictResponse(
        classification=result["classification"],
        probability=result["probability"],
        confidence=result["confidence"],
        threshold=result["threshold"],
        model=result["model"],
        latency_ms=result["latency_ms"],
        features_processed=result["features_processed"],
        modality="RF",
        waveform={
            "i": request.samples[0::2][:150],
            "q": request.samples[1::2][:150],
        },
    )


@router.get("/samples")
async def rf_samples(count: int = 5):
    """Get real RF samples from the Astra dataset for demo/testing."""
    return rf_service.get_samples(count=min(count, 20))


@router.get("/status")
async def rf_status():
    return rf_service.get_status()
