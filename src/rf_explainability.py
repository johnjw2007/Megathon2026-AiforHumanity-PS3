"""RF Signal Attribution and Explainability Module.

Computes temporal signal attribution using:
1. Temporal Window Occlusion: Systematically masks temporal sub-windows of the 150-sample
   baseband signal to measure impact on prediction confidence (Delta-Probability).
2. Gradient x Input Attribution: Computes input gradients of the model output with respect
   to input feature channels to identify sensitive signal segments.

Scientific note: Visualizations reflect the empirical sensitivity of the model to
local perturbations, rather than human-like cognitive reasoning.
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any, Tuple

SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import torch

from data_loader import load_dataframe, FEATURE_COLS
from evaluate import load_model
from preprocessing import transform_and_scale, raw_to_complex_baseband, extract_rf_features, TOTAL_RAW_FEATURES
from utils import device, set_seed

DEVICE = device()
SEED = 42

def compute_temporal_occlusion_attribution(
    model: torch.nn.Module,
    X_raw_sample: np.ndarray,
    scaler,
    window_size: int = 10,
    stride: int = 2,
) -> Tuple[np.ndarray, np.ndarray, float]:
    """Compute temporal occlusion attribution.
    
    Returns:
        (time_centers, attribution_scores, baseline_prob)
    """
    model.eval()
    X_raw = np.asarray(X_raw_sample, dtype=np.float64).reshape(1, 300)
    # Compute baseline prediction
    X_feat_base, _ = transform_and_scale(X_raw, scaler=scaler, fit=False)
    with torch.no_grad():
        x_ten = torch.tensor(X_feat_base, dtype=torch.float32).to(DEVICE)
        base_logit = model(x_ten).item()
        base_prob = float(torch.sigmoid(torch.tensor(base_logit)).item())
        
    X_iq = X_raw.reshape(150, 2).copy()
    time_centers = []
    attribution = []
    
    # Slide occlusion window across the 150 timesteps
    for start in range(0, 150 - window_size + 1, stride):
        end = start + window_size
        mid = (start + end) / 2.0
        
        # Occlude by zeroing out the window in raw I/Q
        X_occluded = X_iq.copy()
        X_occluded[start:end, :] = 0.0
        X_occ_raw = X_occluded.reshape(1, 300)
        
        X_occ_feat, _ = transform_and_scale(X_occ_raw, scaler=scaler, fit=False)
        with torch.no_grad():
            x_occ_ten = torch.tensor(X_occ_feat, dtype=torch.float32).to(DEVICE)
            occ_logit = model(x_occ_ten).item()
            occ_prob = float(torch.sigmoid(torch.tensor(occ_logit)).item())
            
        # Attribution score: drop in drone probability when this window is occluded
        # Higher positive score = window is essential for positive drone classification
        drop = base_prob - occ_prob
        time_centers.append(mid)
        attribution.append(drop)
        
    return np.array(time_centers), np.array(attribution), base_prob

def compute_gradient_saliency(
    model: torch.nn.Module,
    X_raw_sample: np.ndarray,
    scaler,
) -> np.ndarray:
    """Compute gradient x input saliency across the (150, 3) feature representation."""
    model.eval()
    X_raw = np.asarray(X_raw_sample, dtype=np.float64).reshape(1, 300)
    X_feat, _ = transform_and_scale(X_raw, scaler=scaler, fit=False)
    
    x_ten = torch.tensor(X_feat, dtype=torch.float32, requires_grad=True, device=DEVICE)
    logit = model(x_ten)
    prob = torch.sigmoid(logit)
    prob.backward()
    
    grad = x_ten.grad.detach().cpu().numpy()[0] # (150, 3)
    # Gradient x Input magnitude across channels
    saliency = np.sum(np.abs(grad * X_feat[0]), axis=-1) # (150,)
    return saliency

def generate_attribution_report(model_name: str = "cnn", sample_idx: int = 0):
    set_seed(SEED)
    cfg_file = Path("models/config.json")
    if not cfg_file.exists():
        raise FileNotFoundError("models/config.json not found. Run train.py first.")
    cfg = json.loads(cfg_file.read_text())
    
    from evaluate import prepare_data
    data = prepare_data(seed=SEED)
    scaler = data["scaler"]
    model = load_model(model_name)
    
    df = load_dataframe()
    # Find a true drone sample from test set
    test_idx = data["split_indices"][2]
    drone_test_indices = [idx for idx in test_idx if df.iloc[idx]["label"] == 0]
    chosen_idx = drone_test_indices[sample_idx]
    
    raw_sample = df.iloc[chosen_idx][FEATURE_COLS].values.astype(np.float64)
    raw_iq = raw_sample.reshape(150, 2)
    
    # 1. Temporal Occlusion Attribution
    t_centers, drop_scores, base_prob = compute_temporal_occlusion_attribution(
        model, raw_sample, scaler, window_size=12, stride=2
    )
    
    # 2. Gradient Saliency
    saliency = compute_gradient_saliency(model, raw_sample, scaler)
    
    # Visualization: 3-panel explainability figure
    fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
    
    t_steps = np.arange(150)
    
    # Panel 1: Raw In-Phase and Quadrature Baseband Signal
    axes[0].plot(t_steps, raw_iq[:, 0], label="In-Phase (I)", color="#1f77b4", lw=1.2)
    axes[0].plot(t_steps, raw_iq[:, 1], label="Quadrature (Q)", color="#ff7f0e", lw=1.2, alpha=0.8)
    axes[0].set_ylabel("Amplitude")
    axes[0].set_title(f"RF Signal Attribution Analysis — Drone Sample (Idx: {chosen_idx}, P(Drone): {base_prob:.4f})")
    axes[0].legend(loc="upper right")
    axes[0].grid(True, alpha=0.3)
    
    # Panel 2: Gradient x Input Feature Sensitivity
    axes[1].plot(t_steps, saliency, color="#2ca02c", lw=1.5)
    axes[1].fill_between(t_steps, 0, saliency, color="#2ca02c", alpha=0.2)
    axes[1].set_ylabel("Grad x Input Saliency")
    axes[1].set_title("Instantaneous Feature Sensitivity (Magnitude & Phase Gradients)")
    axes[1].grid(True, alpha=0.3)
    
    # Panel 3: Temporal Window Occlusion Attribution (Probability Drop)
    axes[2].plot(t_centers, drop_scores, marker="o", markersize=3, color="#d62728", lw=1.5)
    axes[2].axhline(0, color="k", linestyle="--", alpha=0.4)
    axes[2].fill_between(t_centers, 0, np.maximum(drop_scores, 0), color="#d62728", alpha=0.25, label="Essential for Detection")
    axes[2].set_ylabel("Delta P(Drone) on Occlusion")
    axes[2].set_xlabel("Sample Timestep (1 to 150)")
    axes[2].set_title("Temporal Occlusion Attribution (Window Size = 12 Samples)")
    axes[2].legend(loc="upper right")
    axes[2].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    artifacts_dir = Path("artifacts")
    reports_dir = Path("reports")
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    plt.savefig(artifacts_dir / "rf_attribution.png", dpi=130)
    plt.savefig(reports_dir / "rf_attribution.png", dpi=130)
    plt.close()
    
    # Identify top 3 most critical temporal windows
    top_window_indices = np.argsort(drop_scores)[::-1][:3]
    top_windows = [
        {"timestep_center": float(t_centers[i]), "importance_score": round(float(drop_scores[i]), 4)}
        for i in top_window_indices
    ]
    
    attribution_summary = {
        "model": model_name,
        "sample_index": int(chosen_idx),
        "true_label": 0,
        "predicted_probability": round(base_prob, 4),
        "method": "temporal_window_occlusion_and_gradient_saliency",
        "scientific_interpretation": (
            "Attribution measures empirical sensitivity: peaks in occlusion score highlight "
            "temporal sub-bursts whose removal causes the largest drop in drone classification confidence."
        ),
        "top_critical_windows": top_windows,
    }
    (artifacts_dir / "rf_attribution.json").write_text(json.dumps(attribution_summary, indent=2))
    print(f"\n=== RF EXPLAINABILITY REPORT ({model_name.upper()}) ===")
    print(f"Sample Index: {chosen_idx} | P(Drone): {base_prob:.4f}")
    print("Top Critical Temporal Windows:")
    for w in top_windows:
        print(f"  - Timestep {w['timestep_center']:.0f} (Importance / Probability Drop: {w['importance_score']:.4f})")
    print(f"Saved attribution plot to {artifacts_dir}/rf_attribution.png")
    return attribution_summary

if __name__ == "__main__":
    cfg_file = Path("models/config.json")
    model_name = "cnn"
    if cfg_file.exists():
        cfg = json.loads(cfg_file.read_text())
        model_name = cfg.get("best_model", "cnn")
    generate_attribution_report(model_name)
