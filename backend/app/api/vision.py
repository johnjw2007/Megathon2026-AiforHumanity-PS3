"""Vision Detection API endpoint.

Uses TorchVision pre-trained Faster R-CNN for genuine object detection.
Can detect 91 COCO object classes for drone classification.
"""
from typing import Optional
import base64
import numpy as np
from fastapi import APIRouter, HTTPException

from backend.app.schemas.vision import VisionPredictRequest, VisionPredictResponse
from backend.app.services.vision_service import vision_service

router = APIRouter()


@router.post("/predict", response_model=VisionPredictResponse)
async def vision_predict(request: VisionPredictRequest):
    """Run vision detection.
    
    If image_base64 is provided, run genuine detection using TorchVision model.
    If scenario_preset is provided, run simulation with preset scenario.
    Otherwise return current vision status.
    """
    try:
        image = None
        
        # Decode base64 image if provided
        if request.image_base64:
            try:
                import cv2
                img_bytes = base64.b64decode(request.image_base64)
                parr = np.frombuffer(img_bytes, dtype=np.uint8)
                image = cv2.imdecode(parr, cv2.IMREAD_COLOR)
                if image is None:
                    raise ValueError("Failed to decode image")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image: {e}")
        
        result = vision_service.predict(
            scenario_preset=request.scenario_preset,
            image=image
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision detection failed: {e}")
    return result


@router.get("/status")
async def vision_status():
    return vision_service.get_status()
