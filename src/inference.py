"""Real-time inference API for the RF drone detector."""
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Union

# Ensure src/ is accessible regardless of execution working directory
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import numpy as np
import torch
import joblib

from utils import device
from models import DroneCNNv2, BaselineLogistic
from preprocessing import transform_and_scale, TOTAL_RAW_FEATURES

DEVICE = device()
CFG_PATH = Path("models/config.json")
CNN_PATH = Path("models/drone_detector.pt")
BASELINE_PATH = Path("models/baseline.pt")
SCALER_PATH = Path("models/preprocessing.joblib")
LEGACY_SCALER_PATH = Path("models/preprocessing.pkl")

class RFInferenceEngine:
    """Production-grade RF Drone Inference Engine."""
    
    def __init__(self, model_name: Optional[str] = None, threshold: Optional[float] = None):
        if not CFG_PATH.exists():
            raise FileNotFoundError(f"Configuration file not found at {CFG_PATH}. Please train the model first.")
        self.cfg = json.loads(CFG_PATH.read_text())
        
        # Load scaler
        if SCALER_PATH.exists():
            self.scaler = joblib.load(SCALER_PATH)
        elif LEGACY_SCALER_PATH.exists():
            self.scaler = joblib.load(LEGACY_SCALER_PATH)
        else:
            raise FileNotFoundError(f"Scaler not found at {SCALER_PATH} or {LEGACY_SCALER_PATH}")
            
        self.name = model_name or self.cfg.get("best_model", "cnn")
        if threshold is not None:
            self.thr = float(threshold)
        else:
            model_thrs = self.cfg.get("model_thresholds", {})
            self.thr = float(model_thrs.get(self.name, self.cfg.get("detection_threshold", 0.5)))
        self.model = self._load_model(self.name)

    def _load_model(self, model_name: str) -> torch.nn.Module:
        if model_name not in ("cnn", "baseline"):
            raise ValueError(f"Unknown model name '{model_name}'. Must be 'cnn' or 'baseline'.")
            
        pt_path = CNN_PATH if model_name == "cnn" else BASELINE_PATH
        if not pt_path.exists():
            raise FileNotFoundError(f"Model artifact not found at {pt_path}")
            
        ckpt = torch.load(pt_path, map_location=DEVICE, weights_only=False)
        state = ckpt.get("state_dict", ckpt)
        
        pre = self.cfg.get("preprocessing", {})
        seq_len = pre.get("seq_len", 150)
        n_channels = pre.get("n_feature_channels", 3)
        input_dim = pre.get("input_dim", 450)
        
        if model_name == "cnn":
            m = DroneCNNv2(seq_len=seq_len, n_channels=n_channels)
        else:
            m = BaselineLogistic(input_dim=input_dim)
            
        m.load_state_dict(state)
        m.to(DEVICE).eval()
        return m

    def _validate_and_format_input(self, sample: Union[dict, list, np.ndarray]) -> np.ndarray:
        if isinstance(sample, dict):
            if "features" in sample:
                raw = sample["features"]
            else:
                # Check for keys "0".."299"
                try:
                    raw = [sample[str(i)] for i in range(TOTAL_RAW_FEATURES)]
                except KeyError:
                    raise ValueError(f"Dictionary must contain 'features' key or keys '0' to '{TOTAL_RAW_FEATURES - 1}'.")
        else:
            raw = sample

        arr = np.asarray(raw, dtype=np.float64)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
            
        if arr.shape[-1] != TOTAL_RAW_FEATURES:
            raise ValueError(f"Invalid input shape {arr.shape}. Expected exactly {TOTAL_RAW_FEATURES} features.")
            
        if not np.all(np.isfinite(arr)):
            raise ValueError("Input features contain NaN or infinite values.")
            
        return arr

    def predict_proba(self, sample: Union[dict, list, np.ndarray]) -> np.ndarray:
        """Return probability of being a DRONE for single or multiple samples."""
        X_raw = self._validate_and_format_input(sample)
        X_feat, _ = transform_and_scale(X_raw, scaler=self.scaler, fit=False)
        x_tensor = torch.tensor(X_feat, dtype=torch.float32).to(DEVICE)
        
        with torch.no_grad():
            logits = self.model(x_tensor)
            probs = torch.sigmoid(logits.squeeze(-1)).cpu().numpy()
            
        return np.atleast_1d(probs)

    def predict(self, sample: Union[dict, list, np.ndarray]) -> Dict[str, Any]:
        """Classify single sample as DRONE or NON-DRONE with full decision metadata."""
        probs = self.predict_proba(sample)
        prob = float(probs[0])
        classification = "DRONE" if prob >= self.thr else "NON-DRONE"
        
        return {
            "classification": classification,
            "probability": round(prob, 4),
            "confidence": round(prob if classification == "DRONE" else (1.0 - prob), 4),
            "threshold": round(self.thr, 4),
            "model": self.name,
            "modality": "RF",
            "features_processed": TOTAL_RAW_FEATURES,
        }

_INFERENCE_ENGINE: Optional[RFInferenceEngine] = None

def predict_drone(sample: Union[dict, list, np.ndarray], model_name: Optional[str] = None) -> Dict[str, Any]:
    global _INFERENCE_ENGINE
    if _INFERENCE_ENGINE is None or (model_name is not None and _INFERENCE_ENGINE.name != model_name):
        _INFERENCE_ENGINE = RFInferenceEngine(model_name=model_name)
    return _INFERENCE_ENGINE.predict(sample)

if __name__ == "__main__":
    try:
        from data_loader import load_dataframe, FEATURE_COLS
    except ImportError:
        from src.data_loader import load_dataframe, FEATURE_COLS
        
    df = load_dataframe()
    sample_row = df.iloc[0][FEATURE_COLS].to_dict()
    true_label = int(df.iloc[0]["label"])
    
    print("Running sample RF inference...")
    result = predict_drone(sample_row)
    result["true_label"] = true_label
    result["true_class"] = "DRONE" if true_label == 0 else "NON-DRONE"
    print(json.dumps(result, indent=2))

