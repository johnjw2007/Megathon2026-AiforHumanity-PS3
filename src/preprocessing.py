"""Preprocessing helpers and canonical RF signal transformation."""
import json
from pathlib import Path
from typing import Optional, Tuple
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler

SEQ_LEN = 150
RAW_CHANNELS = 2
FEATURE_CHANNELS = 3
TOTAL_RAW_FEATURES = 300

def raw_to_complex_baseband(X_raw: np.ndarray) -> np.ndarray:
    """Convert raw 300-dim feature vector(s) to complex baseband array (N, 150).
    
    Pairs (0,1), (2,3), ..., (298,299) represent interleaved (I, Q) samples.
    """
    X = np.asarray(X_raw, dtype=np.float64)
    if X.ndim == 1:
        X = X.reshape(1, -1)
    if X.shape[-1] != TOTAL_RAW_FEATURES:
        raise ValueError(f"Expected {TOTAL_RAW_FEATURES} features, got {X.shape[-1]}")
    if not np.all(np.isfinite(X)):
        raise ValueError("Input contains NaN or Inf values")
        
    X_reshaped = X.reshape(-1, SEQ_LEN, RAW_CHANNELS)
    I = X_reshaped[:, :, 0]
    Q = X_reshaped[:, :, 1]
    return I + 1j * Q

def extract_rf_features(z: np.ndarray) -> np.ndarray:
    """Extract 3-channel representation: log-magnitude, cos(phase), sin(phase).
    
    Args:
        z: Complex baseband signal of shape (N, 150).
    Returns:
        feats: Real array of shape (N, 150, 3).
    """
    mag = np.abs(z)
    mag_safe = np.maximum(mag, 1e-8)
    log_mag = np.log(mag_safe)
    phase = np.angle(z)
    cos_phase = np.cos(phase)
    sin_phase = np.sin(phase)
    feats = np.stack([log_mag, cos_phase, sin_phase], axis=-1)
    return feats.astype(np.float32)

def transform_and_scale(
    X_raw: np.ndarray,
    scaler: Optional[StandardScaler] = None,
    fit: bool = False
) -> Tuple[np.ndarray, StandardScaler]:
    """Canonical transformation pipeline from raw 300-dim samples to scaled features.
    
    Returns:
        (feats_scaled, scaler) where feats_scaled has shape (N, 150, 3).
    """
    z = raw_to_complex_baseband(X_raw)
    feats = extract_rf_features(z)
    N, T, C = feats.shape
    feats_flat = feats.reshape(N, -1)
    if fit:
        scaler = StandardScaler()
        scaler.fit(feats_flat)
    elif scaler is None:
        raise ValueError("Scaler must be provided when fit=False")
    feats_scaled = scaler.transform(feats_flat).reshape(N, T, C).astype(np.float32)
    return feats_scaled, scaler

def save_preprocessing(scaler: StandardScaler, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, out_dir / "scaler.joblib")
    config = {
        "scaler_type": "StandardScaler",
        "representation": "complex_baseband_iq",
        "channels": ["log_magnitude", "cos_phase", "sin_phase"],
        "seq_len": SEQ_LEN,
        "n_input_channels": RAW_CHANNELS,
        "n_feature_channels": FEATURE_CHANNELS,
        "input_dim": SEQ_LEN * FEATURE_CHANNELS,
        "normalization_fit_on": "train_only",
    }
    (out_dir / "preprocessing_config.json").write_text(json.dumps(config, indent=2))

def load_scaler(path: Path) -> StandardScaler:
    return joblib.load(path)
