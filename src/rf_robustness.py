"""Controlled robustness evaluation for the RF drone detector.

Evaluates performance under realistic channel degradations:
- Additive white Gaussian noise (SNR sweep from 25 dB down to 0 dB)
- Signal attenuation and amplitude scaling (0.25x, 0.5x, 1.5x, 2.0x)
- Phase perturbation / carrier frequency offset emulation (+-pi/4, +-pi/2)
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any, List

SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

from data_loader import prepare_data, FEATURE_COLS, load_dataframe
from evaluate import load_model, predict_probs
from preprocessing import transform_and_scale, raw_to_complex_baseband, extract_rf_features
from utils import set_seed, device

DEVICE = device()
SEED = 42

def add_noise_to_snr(X_raw: np.ndarray, snr_db: float) -> np.ndarray:
    """Add Gaussian noise to raw 300-dim interleaved I/Q signal to achieve target SNR (dB)."""
    X = np.asarray(X_raw, dtype=np.float64)
    # Reshape to (N, 150, 2)
    X_iq = X.reshape(-1, 150, 2)
    # Signal power per sample: mean over timesteps of (I^2 + Q^2)
    sig_power = np.mean(X_iq[:, :, 0]**2 + X_iq[:, :, 1]**2, axis=1, keepdims=True)[:, :, None] # (N, 1, 1)
    snr_linear = 10.0 ** (snr_db / 10.0)
    noise_power = sig_power / snr_linear
    # Distribute noise power equally between I and Q: std = sqrt(noise_power / 2)
    noise_std = np.sqrt(noise_power / 2.0)
    noise = np.random.normal(0.0, 1.0, size=X_iq.shape) * noise_std
    noisy_iq = X_iq + noise
    return noisy_iq.reshape(-1, 300)

def scale_amplitude(X_raw: np.ndarray, scale_factor: float) -> np.ndarray:
    """Apply amplitude scaling to signal (emulating distance attenuation / AGC drift)."""
    return X_raw * scale_factor

def perturb_phase(X_raw: np.ndarray, phase_shift_rad: float) -> np.ndarray:
    """Apply uniform phase rotation to complex baseband (emulating carrier phase error)."""
    z = raw_to_complex_baseband(X_raw)
    rotated_z = z * np.exp(1j * phase_shift_rad)
    # Back to interleaved I/Q
    I = np.real(rotated_z)
    Q = np.imag(rotated_z)
    stacked = np.stack([I, Q], axis=-1)
    return stacked.reshape(-1, 300)

def evaluate_on_perturbed_data(model, X_pert: np.ndarray, y_true: np.ndarray, scaler, threshold: float) -> Dict[str, float]:
    """Preprocess perturbed raw data and evaluate metrics using the validation-optimized threshold."""
    X_scaled, _ = transform_and_scale(X_pert, scaler=scaler, fit=False)
    probs = predict_probs(model, X_scaled)
    y_pred = (probs >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    fpr = float(fp / (fp + tn)) if (fp + tn) else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) else 0.0
    
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, probs)), 4),
        "fpr": round(fpr, 4),
        "fnr": round(fnr, 4),
        "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
    }

def run_robustness_experiments(model_name: str = "cnn") -> pd.DataFrame:
    set_seed(SEED)
    cfg_path = Path("models/config.json")
    if not cfg_path.exists():
        raise FileNotFoundError("models/config.json not found. Run train.py and evaluate.py first.")
    cfg = json.loads(cfg_path.read_text())
    
    model = load_model(model_name)
    threshold = float(cfg.get("model_thresholds", {}).get(model_name, cfg.get("detection_threshold", 0.5)))
    
    # Load raw test set
    df = load_dataframe()
    data = prepare_data(seed=SEED)
    test_idx = data["split_indices"][2]
    X_test_raw = df.iloc[test_idx][FEATURE_COLS].values.astype(np.float64)
    y_test = data["y_test"]
    scaler = data["scaler"]
    
    rows = []
    
    # 1. Clean Baseline Condition
    clean_metrics = evaluate_on_perturbed_data(model, X_test_raw, y_test, scaler, threshold)
    rows.append({
        "Category": "Baseline",
        "Condition": "Clean (No Perturbation)",
        "Parameter": 0.0,
        **clean_metrics
    })
    
    # 2. Additive White Gaussian Noise Sweep (SNR: 25 dB down to 0 dB)
    snr_levels = [25.0, 20.0, 15.0, 10.0, 5.0, 0.0]
    for snr in snr_levels:
        X_noisy = add_noise_to_snr(X_test_raw, snr)
        m = evaluate_on_perturbed_data(model, X_noisy, y_test, scaler, threshold)
        rows.append({
            "Category": "AWGN",
            "Condition": f"SNR = {snr} dB",
            "Parameter": snr,
            **m
        })
        
    # 3. Amplitude Scaling Sweep (Attenuation / Saturation)
    scale_factors = [0.25, 0.5, 0.75, 1.25, 1.5, 2.0]
    for sf in scale_factors:
        X_scaled = scale_amplitude(X_test_raw, sf)
        m = evaluate_on_perturbed_data(model, X_scaled, y_test, scaler, threshold)
        rows.append({
            "Category": "Amplitude Scaling",
            "Condition": f"Scale = {sf}x",
            "Parameter": sf,
            **m
        })
        
    # 4. Phase Shift / Carrier Phase Error
    phase_shifts = [-np.pi/2, -np.pi/4, np.pi/4, np.pi/2]
    for ps in phase_shifts:
        deg = int(round(np.degrees(ps)))
        X_phase = perturb_phase(X_test_raw, ps)
        m = evaluate_on_perturbed_data(model, X_phase, y_test, scaler, threshold)
        rows.append({
            "Category": "Phase Perturbation",
            "Condition": f"Phase Shift = {deg} deg",
            "Parameter": ps,
            **m
        })
        
    df_results = pd.DataFrame(rows)
    artifacts_dir = Path("artifacts")
    reports_dir = Path("reports")
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    df_results.to_csv(artifacts_dir / f"rf_robustness_{model_name}.csv", index=False)
    df_results.to_csv(reports_dir / f"rf_robustness_{model_name}.csv", index=False)
    
    summary_dict = {
        "model": model_name,
        "threshold": threshold,
        "experiments": rows,
    }
    (artifacts_dir / f"rf_robustness_{model_name}.json").write_text(json.dumps(summary_dict, indent=2))
    
    # Rename columns for clean presentation
    display_cols = {
        "Category": "Category",
        "Condition": "Condition",
        "recall": "Recall",
        "precision": "Precision",
        "fpr": "FPR",
        "f1": "F1",
        "roc_auc": "ROC-AUC",
    }
    df_display = df_results[[c for c in display_cols if c in df_results.columns]].rename(columns=display_cols)
    print(f"\n=== RF ROBUSTNESS EVALUATION ({model_name.upper()}) ===")
    print(df_display.to_string(index=False))
    print(f"\nSaved robustness report to {artifacts_dir}/rf_robustness_{model_name}.csv")
    return df_results

if __name__ == "__main__":
    run_robustness_experiments("baseline")
    run_robustness_experiments("cnn")
