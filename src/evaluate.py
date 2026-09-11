"""Threshold optimization and final evaluation."""
import json
import sys
from pathlib import Path
from time import perf_counter

SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)

from data_loader import prepare_data, FEATURE_COLS, LABEL_COL, load_dataframe
from models import DroneCNN, DroneCNNv2, BaselineLogistic, model_param_count
from utils import device, set_seed

DEVICE = device()
SEED = 42

def load_model(name: str):
    cfg_path = Path("models/config.json")
    if not cfg_path.exists():
        raise FileNotFoundError(f"Configuration {cfg_path} not found. Run train.py first.")
    cfg = json.loads(cfg_path.read_text())
    
    pt_name = "drone_detector.pt" if name == "cnn" else "baseline.pt"
    pt_path = Path("models") / pt_name
    if not pt_path.exists():
        raise FileNotFoundError(f"Model checkpoint {pt_path} not found. Run train.py first.")
        
    ckpt = torch.load(pt_path, map_location=DEVICE, weights_only=False)
    state = ckpt.get("state_dict")
    
    if name == "cnn":
        # Feature representation has 3 channels: log_magnitude, cos(phase), sin(phase)
        n_channels = cfg["preprocessing"].get("n_feature_channels", 3)
        seq_len = cfg["preprocessing"].get("seq_len", 150)
        m = DroneCNNv2(seq_len=seq_len, n_channels=n_channels)
    else:
        m = BaselineLogistic(input_dim=cfg["preprocessing"]["input_dim"])
        
    m.load_state_dict(state)
    m.to(DEVICE).eval()
    return m

def predict_probs(model, X):
    ds = torch.utils.data.TensorDataset(torch.tensor(X, dtype=torch.float32))
    dl = torch.utils.data.DataLoader(ds, batch_size=256, shuffle=False)
    probs = []
    with torch.no_grad():
        for (xb,) in dl:
            xb = xb.to(DEVICE)
            logits = model(xb)
            probs.append(torch.sigmoid(logits.squeeze(-1)).cpu().numpy())
    return np.concatenate(probs)

def threshold_optimization(y_true, y_prob, out_dir: Path):
    thresholds = np.arange(0.05, 0.96, 0.05)
    rows = []
    for t in thresholds:
        y_pred = (y_prob >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        rows.append({
            "threshold": t,
            "precision": precision_score(y_true, y_pred, zero_division=0),
            "recall": recall_score(y_true, y_pred, zero_division=0),
            "f1": f1_score(y_true, y_pred, zero_division=0),
            "fpr": fp / (fp + tn) if (fp+tn) else 0,
            "fnr": fn / (fn + tp) if (fn+tp) else 0,
            "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
        })
    df = __import__("pandas").DataFrame(rows)
    df.to_csv(out_dir / "threshold_sweep.csv", index=False)
    # Select threshold prioritizing high recall while keeping FPR reasonable
    cand = df[(df["recall"] >= 0.95) & (df["fpr"] <= 0.10)]
    if len(cand):
        chosen = cand.sort_values("f1", ascending=False).iloc[0]
    else:
        chosen = df.sort_values("f1", ascending=False).iloc[0]
    plt.figure()
    plt.plot(df["threshold"], df["recall"], label="recall")
    plt.plot(df["threshold"], df["precision"], label="precision")
    plt.plot(df["threshold"], df["fpr"], label="fpr")
    plt.axvline(chosen["threshold"], color="k", linestyle="--", label="chosen")
    plt.xlabel("threshold")
    plt.ylabel("score")
    plt.legend()
    plt.savefig(out_dir / "threshold_tradeoff.png", dpi=120)
    plt.close()
    return float(chosen["threshold"]), df

def evaluate_model(name: str):
    set_seed(SEED)
    data = prepare_data(seed=SEED)
    X_test, y_test = data["X_test"], data["y_test"]
    model = load_model(name)
    probs = predict_probs(model, X_test)
    return y_test, probs, model

def final_report(name: str, threshold: float):
    y_test, probs, model = evaluate_model(name)
    y_pred = (probs >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, probs),
        "pr_auc": average_precision_score(y_test, probs),
        "fpr": fp / (fp + tn) if (fp+tn) else 0,
        "fnr": fn / (fn + tp) if (fn+tp) else 0,
        "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
    }
    print("\n=== FINAL TEST REPORT ===")
    print("model:", name)
    print("threshold:", threshold)
    print("confusion matrix:\n", confusion_matrix(y_test, y_pred))
    print("metrics:", {k: round(float(v),4) if isinstance(v,float) else v for k,v in metrics.items()})
    # Confusion matrix plot
    cm = confusion_matrix(y_test, y_pred)
    plt.figure()
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                xticklabels=["NonDrone", "Drone"], yticklabels=["NonDrone", "Drone"])
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.savefig(Path("reports") / f"confusion_matrix_{name}.png", dpi=120)
    plt.close()
    return metrics

def error_analysis(name: str, threshold: float):
    set_seed(SEED)
    data = prepare_data(seed=SEED)
    df = load_dataframe()
    X_raw = df[FEATURE_COLS].values.astype(np.float64)
    y_orig = df[LABEL_COL].values
    X_seq = X_raw.reshape(-1, 150, 2).astype(np.float32)
    (X_test, y_test) = data["X_test"], data["y_test"]
    # retrieve original labels for test set using indices
    test_idx = data["split_indices"][2]
    y_orig_test = y_orig[test_idx]
    model = load_model(name)
    probs = predict_probs(model, X_test)
    y_pred = (probs >= threshold).astype(int)
    # FP: predicted drone but actually non-drone
    fp_idx = np.where((y_pred == 1) & (y_test == 0))[0]
    fn_idx = np.where((y_pred == 0) & (y_test == 1))[0]
    tp_idx = np.where((y_pred == 1) & (y_test == 1))[0]
    tn_idx = np.where((y_pred == 0) & (y_test == 0))[0]
    def save_waveforms(idxs, title, fname):
        if len(idxs) == 0:
            return
        fig, axes = plt.subplots(min(4, len(idxs)), 1, figsize=(8, 2*min(4, len(idxs))))
        if min(4, len(idxs)) == 1:
            axes = [axes]
        for ax, i in zip(axes, idxs[:4]):
            sig = X_seq[test_idx[i]]
            t = np.arange(sig.shape[0])
            ax.plot(t, sig[:,0], label="I")
            ax.plot(t, sig[:,1], label="Q")
            orig_lbl = int(y_orig_test[i])
            ax.set_title(f"{title} idx={i} orig_class={orig_lbl} prob={probs[i]:.3f}")
            ax.legend()
            ax.grid(True)
        fig.tight_layout()
        fig.savefig(Path("reports") / fname, dpi=120)
        plt.close(fig)
    save_waveforms(fp_idx, "False Positive", "fp_samples.png")
    save_waveforms(fn_idx, "False Negative", "fn_samples.png")
    save_waveforms(tp_idx, "True Positive", "tp_samples.png")
    save_waveforms(tn_idx, "True Negative", "tn_samples.png")
    print("\n=== ERROR ANALYSIS ===")
    print("FP count:", len(fp_idx), " FN count:", len(fn_idx))
    print("FP orig classes:", np.unique(y_orig_test[fp_idx], return_counts=True))
    print("FN orig classes:", np.unique(y_orig_test[fn_idx], return_counts=True))
    return fp_idx, fn_idx

def measure_latency_and_size(model, X_sample, model_path: Path):
    """Measure single-sample inference latency (ms), parameter count, and artifact file size (KB)."""
    model.eval()
    x_tensor = torch.tensor(X_sample[:1], dtype=torch.float32).to(DEVICE)
    # Warmup
    with torch.no_grad():
        for _ in range(20):
            _ = model(x_tensor)
    # Measurement
    latencies = []
    with torch.no_grad():
        for _ in range(200):
            t0 = perf_counter()
            _ = model(x_tensor)
            latencies.append((perf_counter() - t0) * 1000.0)  # ms
            
    mean_latency_ms = float(np.mean(latencies))
    p95_latency_ms = float(np.percentile(latencies, 95))
    params = model_param_count(model)
    size_bytes = model_path.stat().st_size if model_path.exists() else 0
    return {
        "mean_latency_ms": round(mean_latency_ms, 4),
        "p95_latency_ms": round(p95_latency_ms, 4),
        "parameters": params,
        "model_size_bytes": size_bytes,
        "model_size_kb": round(size_bytes / 1024.0, 2),
    }

def run():
    cfg_path = Path("models/config.json")
    if not cfg_path.exists():
        raise FileNotFoundError("models/config.json not found. Run train.py first.")
    cfg = json.loads(cfg_path.read_text())
    
    # Enforce configuration contract: strict key lookup with no fallback typo
    best_name = cfg["model"]["best_by_val_roc_auc"]
    
    reports_dir = Path("reports")
    artifacts_dir = Path("artifacts")
    reports_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Threshold optimization on validation set
    set_seed(SEED)
    data = prepare_data(seed=SEED)
    val_probs_cnn = predict_probs(load_model("cnn"), data["X_val"])
    val_probs_base = predict_probs(load_model("baseline"), data["X_val"])
    thr_cnn, sweep_cnn = threshold_optimization(data["y_val"], val_probs_cnn, reports_dir)
    thr_base, sweep_base = threshold_optimization(data["y_val"], val_probs_base, reports_dir)
    
    print("\n=== THRESHOLD OPTIMIZATION (validation) ===")
    print(f"cnn chosen threshold: {thr_cnn:.4f}")
    print(f"baseline chosen threshold: {thr_base:.4f}")

    # Evaluate BOTH models on the test set for a rigorous benchmark
    test_results = {}
    benchmarks = {}
    curves = {}
    for name, thr in [("baseline", thr_base), ("cnn", thr_cnn)]:
        y_test, probs, model = evaluate_model(name)
        y_pred = (probs >= thr).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        fpr_val = float(fp / (fp + tn)) if (fp + tn) else 0.0
        fnr_val = float(fn / (fn + tp)) if (fn + tp) else 0.0
        metrics = {
            "threshold": thr,
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
            "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, probs)), 4),
            "pr_auc": round(float(average_precision_score(y_test, probs)), 4),
            "fpr": round(fpr_val, 4),
            "fnr": round(fnr_val, 4),
            "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
        }
        test_results[name] = metrics
        
        # Benchmark latency & size
        pt_path = Path("models") / ("drone_detector.pt" if name == "cnn" else "baseline.pt")
        bench = measure_latency_and_size(model, data["X_test"], pt_path)
        benchmarks[name] = bench
        
        # Save confusion matrix plot
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(5, 4))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                    xticklabels=["NonDrone", "Drone"], yticklabels=["NonDrone", "Drone"])
        plt.title(f"Confusion Matrix: {name.upper()} (thr={thr:.2f})")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.tight_layout()
        plt.savefig(reports_dir / f"confusion_matrix_{name}.png", dpi=120)
        plt.close()
        
        # ROC / PR curve points
        fpr_arr, tpr_arr, _ = roc_curve(y_test, probs)
        prec_arr, rec_arr, _ = precision_recall_curve(y_test, probs)
        curves[name] = {
            "fpr": fpr_arr, "tpr": tpr_arr,
            "prec": prec_arr, "rec": rec_arr,
        }

    # Combined ROC Curves
    plt.figure(figsize=(6, 5))
    plt.plot(curves["baseline"]["fpr"], curves["baseline"]["tpr"], label=f"Baseline (AUC = {test_results['baseline']['roc_auc']:.4f})")
    plt.plot(curves["cnn"]["fpr"], curves["cnn"]["tpr"], label=f"DroneCNNv2 (AUC = {test_results['cnn']['roc_auc']:.4f})")
    plt.plot([0, 1], [0, 1], "k--", alpha=0.5)
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curves Comparison")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(artifacts_dir / "roc_curve.png", dpi=120)
    plt.savefig(reports_dir / "roc_curve.png", dpi=120)
    plt.close()

    # Combined PR Curves
    plt.figure(figsize=(6, 5))
    plt.plot(curves["baseline"]["rec"], curves["baseline"]["prec"], label=f"Baseline (PR-AUC = {test_results['baseline']['pr_auc']:.4f})")
    plt.plot(curves["cnn"]["rec"], curves["cnn"]["prec"], label=f"DroneCNNv2 (PR-AUC = {test_results['cnn']['pr_auc']:.4f})")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curves Comparison")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(artifacts_dir / "precision_recall_curve.png", dpi=120)
    plt.savefig(reports_dir / "precision_recall_curve.png", dpi=120)
    plt.close()

    # Error analysis for chosen best model
    chosen_thr = thr_cnn if best_name == "cnn" else thr_base
    error_analysis(best_name, chosen_thr)

    # Save comprehensive comparison artifact
    comparison = {
        "metrics": test_results,
        "benchmarks": benchmarks,
        "best_model": best_name,
        "chosen_threshold": chosen_thr,
    }
    (artifacts_dir / "model_comparison.json").write_text(json.dumps(comparison, indent=2))
    (artifacts_dir / "rf_baseline_metrics.json").write_text(json.dumps(test_results[best_name], indent=2))

    # Update config with optimized detection threshold
    cfg["detection_threshold"] = chosen_thr
    cfg["model_thresholds"] = {"baseline": round(float(thr_base), 4), "cnn": round(float(thr_cnn), 4)}
    cfg["best_model"] = best_name
    cfg_path.write_text(json.dumps(cfg, indent=2))
    print("\n=== MODEL COMPARISON BENCHMARK ===")
    for m in ["baseline", "cnn"]:
        print(f"[{m.upper()}] Metrics: {test_results[m]} | Benchmarks: {benchmarks[m]}")
    print(f"\nSaved comparison artifacts to {artifacts_dir}/")

if __name__ == "__main__":
    run()
