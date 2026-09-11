"""Genuine Vision Detection using TorchVision pre-trained Faster R-CNN.

Uses the pre-trained Faster R-CNN model (ResNet50-FPN backbone) trained on COCO dataset.
Can detect 91 object classes including: person, car, bird, airplane, etc.

Detection Logic for Drone Classification:
- If known non-drone objects detected (person, car, bird, airplane, etc.) → NON-DRONE
- If small aerial object detected with no known class → potentially suspicious
- If nothing detected → UNCERTAIN
"""
import time
import numpy as np
import torch
import torchvision
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from typing import Dict, Any, List, Optional, Tuple

# COCO class names (91 classes)
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A',
    'N/A', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
    'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

# Classes that are definitely NOT drones
NON_DRONE_CLASSES = {
    'person', 'bicycle', 'car', 'motorcycle', 'bus', 'train', 'truck',
    'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
    'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
    'chair', 'couch', 'bed', 'toilet', 'tv', 'laptop', 'cell phone',
    'bottle', 'cup', 'bowl', 'potted plant', 'dining table',
}

# Classes that could be aerial vehicles (but not drones)
AIRCRAFT_CLASSES = {'airplane', 'boat'}

# Unknown/small objects that could potentially be drones
SUSPICIOUS_AERIAL_CLASSES = set()  # Objects not in known classes


class LiveVisionDetector:
    """Genuine vision detection using TorchVision pre-trained Faster R-CNN."""
    
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.device = torch.device('cpu')
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained Faster R-CNN model."""
        try:
            weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
            self.model = fasterrcnn_resnet50_fpn(weights=weights)
            self.model.to(self.device)
            self.model.eval()
            self._transforms = weights.transforms()
            print(f"[VISION] Loaded Faster R-CNN (ResNet50-FPN) on {self.device}")
        except Exception as e:
            print(f"[VISION] Failed to load model: {e}")
            self.model = None
    
    def _preprocess(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for Faster R-CNN."""
        # Convert BGR to RGB if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            # Assume BGR (OpenCV format), convert to RGB
            image = image[:, :, ::-1].copy()
        
        # Convert to PIL Image for torchvision transforms
        from PIL import Image
        pil_image = Image.fromarray(image)
        
        # Apply transforms
        tensor = self._transforms(pil_image)
        return tensor.unsqueeze(0).to(self.device)
    
    def detect(self, image: np.ndarray) -> Dict[str, Any]:
        """Run genuine object detection on image.
        
        Args:
            image: numpy array (H, W, 3) in BGR or RGB format
            
        Returns:
            Detection results with classification logic
        """
        t0 = time.perf_counter()
        
        if self.model is None:
            return self._fallback_detection()
        
        try:
            # Preprocess
            tensor = self._preprocess(image)
            
            # Run inference
            with torch.no_grad():
                predictions = self.model(tensor)[0]
            
            # Process results
            boxes = predictions['boxes'].cpu().numpy()
            labels = predictions['labels'].cpu().numpy()
            scores = predictions['scores'].cpu().numpy()
            
            # Filter by confidence
            mask = scores >= self.confidence_threshold
            boxes = boxes[mask]
            labels = labels[mask]
            scores = scores[mask]
            
            # Classify detections
            detections = []
            has_non_drone = False
            has_aircraft = False
            has_suspicious = False
            
            for box, label_idx, score in zip(boxes, labels, scores):
                if label_idx < len(COCO_CLASSES):
                    class_name = COCO_CLASSES[label_idx]
                else:
                    class_name = 'unknown'
                
                detection = {
                    'box': box.tolist(),
                    'label': class_name,
                    'confidence': float(score),
                    'is_drone': False,  # Default: not a drone
                }
                detections.append(detection)
                
                # Classify
                if class_name in NON_DRONE_CLASSES:
                    has_non_drone = True
                elif class_name in AIRCRAFT_CLASSES:
                    has_aircraft = True
                elif class_name == '__background__':
                    continue
                else:
                    # Unknown class - could be suspicious
                    has_suspicious = True
            
            # Make drone classification decision
            inference_time = (time.perf_counter() - t0) * 1000.0
            
            if has_non_drone:
                # Definitely not a drone - known non-drone objects present
                classification = 'NON-DRONE'
                drone_confidence = 0.1
                rationale = f"Known non-drone objects detected: {[d['label'] for d in detections if d['label'] in NON_DRONE_CLASSES]}"
            elif has_aircraft:
                # Aircraft detected - likely not a drone
                classification = 'NON-DRONE'
                drone_confidence = 0.2
                rationale = f"Aircraft detected: {[d['label'] for d in detections if d['label'] in AIRCRAFT_CLASSES]}"
            elif has_suspicious and len(detections) > 0:
                # Unknown objects detected - potentially suspicious
                classification = 'UNCERTAIN'
                drone_confidence = 0.5
                rationale = f"Unknown objects detected: {[d['label'] for d in detections]}"
            elif len(detections) == 0:
                # Nothing detected
                classification = 'UNCERTAIN'
                drone_confidence = 0.3
                rationale = "No objects detected in frame"
            else:
                # Default uncertain
                classification = 'UNCERTAIN'
                drone_confidence = 0.4
                rationale = "Insufficient evidence for classification"
            
            return {
                'status': 'LIVE',
                'has_target': len(detections) > 0,
                'primary_detection': detections[0] if detections else None,
                'all_detections': detections,
                'drone_confidence': drone_confidence,
                'inference_time_ms': inference_time,
                'frame_width': image.shape[1] if len(image.shape) >= 2 else 640,
                'frame_height': image.shape[0] if len(image.shape) >= 2 else 480,
                'model': 'Faster R-CNN (ResNet50-FPN)',
                'model_type': 'torchvision_pretrained',
                'classification': classification,
                'rationale': rationale,
            }
            
        except Exception as e:
            return {
                'status': 'ERROR',
                'has_target': False,
                'primary_detection': None,
                'all_detections': [],
                'drone_confidence': 0.0,
                'inference_time_ms': (time.perf_counter() - t0) * 1000.0,
                'frame_width': 640,
                'frame_height': 480,
                'model': 'none',
                'model_type': 'error',
                'classification': 'UNCERTAIN',
                'rationale': f'Detection error: {str(e)}',
            }
    
    def _fallback_detection(self) -> Dict[str, Any]:
        """Fallback when model is not available."""
        return {
            'status': 'NOT_CONFIGURED',
            'has_target': False,
            'primary_detection': None,
            'all_detections': [],
            'drone_confidence': 0.0,
            'inference_time_ms': 0.0,
            'frame_width': 640,
            'frame_height': 480,
            'model': 'none',
            'model_type': 'fallback',
            'classification': 'UNCERTAIN',
            'rationale': 'Vision model not loaded',
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get current vision system status."""
        if self.model is not None:
            return {
                'status': 'LIVE',
                'model': 'Faster R-CNN (ResNet50-FPN)',
                'model_type': 'torchvision_pretrained',
                'device': str(self.device),
                'confidence_threshold': self.confidence_threshold,
                'classes': len(COCO_CLASSES) - 1,  # Exclude background
                'note': 'Genuine pre-trained object detection model',
            }
        else:
            return {
                'status': 'NOT_CONFIGURED',
                'model': 'none',
                'model_type': 'none',
                'device': 'none',
                'confidence_threshold': self.confidence_threshold,
                'classes': 0,
                'note': 'Vision model failed to load',
            }


# Singleton instance
live_detector = LiveVisionDetector(confidence_threshold=0.5)
