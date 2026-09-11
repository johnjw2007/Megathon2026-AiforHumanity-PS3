"""RF Classification Service — wraps the existing ML inference pipeline."""
import time
from typing import Dict, Any, Optional, Union

import numpy as np

from inference import RFInferenceEngine, predict_drone
from models import model_param_count, DroneCNNv2, BaselineLogistic


class RFService:
    """Singleton RF inference service."""

    def __init__(self):
        self._engine: Optional[RFInferenceEngine] = None
        self._status = "OFFLINE"
        self._model_info: Dict[str, Any] = {}
        self._load()

    def _load(self):
        try:
            self._engine = RFInferenceEngine()
            self._status = "ONLINE"
            # Gather model info
            name = self._engine.name
            if name == "cnn":
                m = DroneCNNv2(seq_len=150, n_channels=3)
            else:
                m = BaselineLogistic(input_dim=450)
            self._model_info = {
                "model": name,
                "params": model_param_count(m),
                "threshold": self._engine.thr,
            }
        except Exception as e:
            self._status = "ERROR"
            self._model_info = {"error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        return {"status": self._status, **self._model_info}

    def predict(self, samples: list) -> Dict[str, Any]:
        if self._engine is None:
            raise RuntimeError("RF model not loaded.")
        t0 = time.perf_counter()
        arr = np.asarray(samples, dtype=np.float64)
        result = self._engine.predict(arr)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        result["latency_ms"] = round(latency_ms, 3)
        return result

    def get_samples(self, count: int = 5) -> list:
        """Return real samples from the dataset for the demo UI."""
        from data_loader import load_dataframe, FEATURE_COLS

        df = load_dataframe()
        samples = []
        for i in range(min(count, len(df))):
            row = df.iloc[i]
            features = [float(row[c]) for c in FEATURE_COLS]
            label = int(row["label"])
            samples.append({
                "sample_id": f"SAMPLE-{i:04d}",
                "label": label,
                "ground_truth": "DRONE" if label == 0 else "NON-DRONE",
                "description": f"Sample {i} from Astra dataset",
                "features": features,
                "waveform": {
                    "i": features[0::2],
                    "q": features[1::2],
                },
            })
        return samples


rf_service = RFService()
