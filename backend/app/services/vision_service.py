"""Vision Service — uses TorchVision pre-trained Faster R-CNN for genuine object detection.

Uses the pre-trained Faster R-CNN (ResNet50-FPN) model trained on COCO dataset.
Can detect 91 object classes including: person, car, bird, airplane, etc.

Detection Logic:
- Known non-drone objects detected → NON-DRONE
- Aircraft detected → NON-DRONE
- Unknown objects detected → UNCERTAIN
- Nothing detected → UNCERTAIN

STATUS HONESTY:
- If no camera/image provided: status = "SIMULATION"
- If genuine image provided: status = "LIVE"
- Always clearly label the source
"""
from typing import Dict, Any, Optional

from vision.live_detector import live_detector, LiveVisionDetector


class VisionService:
    """Vision detection service using TorchVision pre-trained model."""

    def __init__(self):
        self._detector = live_detector

    def get_status(self) -> Dict[str, Any]:
        """Get vision system status. Always reports SIMULATION unless live image is being processed."""
        detector_status = self._detector.get_status()
        model_name = detector_status.get("model", "none")
        
        # No camera connected = SIMULATION
        return {
            "status": "SIMULATION",
            "model": model_name,
            "device": detector_status.get("device", "none"),
            "note": f"Vision model loaded ({model_name}). No live camera connected. Use scenario_preset for simulation or provide image_base64 for genuine detection.",
        }

    def predict(self, scenario_preset: Optional[str] = None, image=None) -> Dict[str, Any]:
        """Run vision detection.
        
        Args:
            scenario_preset: Optional preset scenario name for simulation
            image: Optional numpy array (H, W, 3) for live detection
        """
        import numpy as np

        # If live image provided, use genuine detection
        if image is not None:
            result = self._detector.detect(image)
            return {
                "status": "LIVE",
                "has_target": result["has_target"],
                "primary_detection": result["primary_detection"],
                "all_detections": result["all_detections"],
                "drone_confidence": result["drone_confidence"],
                "inference_time_ms": result["inference_time_ms"],
                "frame_width": result["frame_width"],
                "frame_height": result["frame_height"],
                "modality": "VISION",
                "model": result.get("model", "none"),
                "classification": result.get("classification", "UNCERTAIN"),
                "rationale": result.get("rationale", ""),
                "note": f"Genuine detection using {result.get('model', 'unknown')} model",
            }

        # If no preset and no image, return SIMULATION status
        if scenario_preset is None:
            return {
                "status": "SIMULATION",
                "has_target": False,
                "primary_detection": None,
                "all_detections": [],
                "drone_confidence": 0.0,
                "inference_time_ms": 0.0,
                "frame_width": 640,
                "frame_height": 480,
                "modality": "VISION",
                "model": "simulation",
                "classification": "UNCERTAIN",
                "rationale": "No image provided. Vision is in SIMULATION mode.",
                "note": "No live camera connected. Use scenario_preset for simulation or provide image_base64 for genuine detection.",
            }

        # Simulation mode with preset scenarios
        from vision.optical_validation import create_synthetic_frame, build_benchmark_suite
        from vision.detector import OpticalDroneDetector

        sim_detector = OpticalDroneDetector(confidence_threshold=0.50)
        suite = build_benchmark_suite()
        preset_map = {
            "drone_clear": "TC-VIS-01",
            "bird_flight": "TC-VIS-10",
            "fog_occluded": "TC-VIS-08",
            "clear_sky": "TC-VIS-02",
            "ambiguous": "TC-VIS-12",
        }
        tc_id = preset_map.get(scenario_preset, "TC-VIS-01")
        tc = next((t for t in suite if t["id"] == tc_id), suite[0])

        img, meta = create_synthetic_frame(background=tc["bg"], targets=tc["targets"])
        result = sim_detector.detect(img, metadata=meta)

        detections = []
        for d in result.all_detections:
            detections.append({
                "box": d.box,
                "label": d.label,
                "confidence": d.confidence,
                "is_drone": d.is_drone,
                "area_ratio": d.area_ratio,
                "occluded": d.occluded,
                "lighting": d.lighting,
            })

        return {
            "status": "SIMULATION",
            "has_target": result.has_target,
            "primary_detection": detections[0] if detections else None,
            "all_detections": detections,
            "drone_confidence": result.drone_confidence,
            "inference_time_ms": result.inference_time_ms,
            "frame_width": result.frame_width,
            "frame_height": result.frame_height,
            "modality": "VISION",
            "model": "simulation",
            "classification": "UNCERTAIN" if not result.has_target else ("DRONE" if result.drone_confidence > 0.5 else "NON-DRONE"),
            "rationale": f"Simulated detection using preset '{scenario_preset}'",
            "note": f"SIMULATED vision detection using preset '{scenario_preset}'. Not real camera data.",
        }


vision_service = VisionService()
