"""Training pipeline for the drone detector."""
import json
import sys
import os
from pathlib import Path
from time import perf_counter

SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)

import utils
from models import DroneCNN, DroneCNNv2, BaselineLogistic, model_param_count
from data_loader import prepare_data, build_binary_target, load_dataframe, FEATURE_COLS, LABEL_COL

DEVICE = utils.device()
SEED = 42
BATCH_SIZE = 256
EPOCHS = 100
LR = 1e-3
PATIENCE = 12

def _to_loader(X, y, batch_size=BATCH_SIZE, shuffle=True):
    ds = TensorDataset(torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32))
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle)

def _metrics(y_true, y_prob):
    y_pred = (y_prob >= 0.5).astype(int)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_prob),
        "pr_auc": average_precision_score(y_true, y_prob),
    }

def train_model():
    utils.set_seed(SEED)
    data = prepare_data(seed=SEED)
    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]
    input_dim = data["feature_info"]["input_dim"]
    seq_len = data["feature_info"]["seq_len"]
    n_channels = data["feature_info"]["n_channels"]

    print("=== TRAINING ===")
    print("device:", DEVICE)
    print("train/val/test sizes:", len(y_train), len(y_val), len(y_test))
    print("binary class distribution train:", dict(zip(*np.unique(y_train, return_counts=True))))
    print("input_dim:", input_dim, "seq_len:", seq_len, "n_channels:", n_channels)

    train_loader = _to_loader(X_train, y_train, shuffle=True)
    val_loader = _to_loader(X_val, y_val, shuffle=False)
    test_loader = _to_loader(X_test, y_test, shuffle=False)

    models = {}
    results = {}

    # Model A: baseline logistic (via sklearn-style torch training)
    baseline = BaselineLogistic(input_dim=input_dim).to(DEVICE)
    opt = torch.optim.AdamW(baseline.parameters(), lr=LR)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
    best_val = -1
    best_state = None
    best_epoch = 0
    start = perf_counter()
    for epoch in range(1, EPOCHS + 1):
        baseline.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            opt.zero_grad()
            logits = baseline(xb)
            loss = nn.functional.binary_cross_entropy_with_logits(logits.squeeze(-1), yb)
            loss.backward()
            opt.step()
        sched.step()
        baseline.eval()
        val_probs = []
        with torch.no_grad():
            for xb, yb in val_loader:
                xb = xb.to(DEVICE)
                logits = baseline(xb)
                val_probs.append(torch.sigmoid(logits.squeeze(-1)).cpu().numpy())
        val_probs = np.concatenate(val_probs)
        auc = roc_auc_score(y_val, val_probs)
        if auc > best_val:
            best_val = auc
            best_state = {k: v.cpu().clone() for k, v in baseline.state_dict().items()}
            best_epoch = epoch
        if epoch % 20 == 0 or epoch == 1:
            print(f"baseline epoch {epoch}: val_roc_auc={auc:.6f}")
    dur = perf_counter() - start
    baseline.load_state_dict(best_state)
    baseline.eval()
    test_probs = []
    with torch.no_grad():
        for xb, yb in test_loader:
            xb = xb.to(DEVICE)
            logits = baseline(xb)
            test_probs.append(torch.sigmoid(logits.squeeze(-1)).cpu().numpy())
    test_probs = np.concatenate(test_probs)
    test_metrics = _metrics(y_test, test_probs)
    models["baseline"] = {"path": None, "arch": "BaselineLogistic", "params": model_param_count(baseline)}
    results["baseline"] = {"val_best_roc_auc": best_val, "best_epoch": best_epoch, "test": test_metrics, "train_seconds": dur}

    # Model B: DroneCNN
    cnn = DroneCNNv2(seq_len=seq_len, n_channels=3).to(DEVICE)
    opt = torch.optim.AdamW(cnn.parameters(), lr=LR)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
    best_val = -1
    best_state = None
    best_epoch = 0
    start = perf_counter()
    for epoch in range(1, EPOCHS + 1):
        cnn.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            opt.zero_grad()
            logits = cnn(xb)
            loss = nn.functional.binary_cross_entropy_with_logits(logits.squeeze(-1), yb)
            loss.backward()
            opt.step()
        sched.step()
        cnn.eval()
        val_probs = []
        with torch.no_grad():
            for xb, yb in val_loader:
                xb = xb.to(DEVICE)
                logits = cnn(xb)
                val_probs.append(torch.sigmoid(logits.squeeze(-1)).cpu().numpy())
        val_probs = np.concatenate(val_probs)
        auc = roc_auc_score(y_val, val_probs)
        if auc > best_val:
            best_val = auc
            best_state = {k: v.cpu().clone() for k, v in cnn.state_dict().items()}
            best_epoch = epoch
        if epoch % 20 == 0 or epoch == 1:
            print(f"cnn epoch {epoch}: val_roc_auc={auc:.6f}")
    dur = perf_counter() - start
    cnn.load_state_dict(best_state)
    cnn.eval()
    test_probs = []
    with torch.no_grad():
        for xb, yb in test_loader:
            xb = xb.to(DEVICE)
            logits = cnn(xb)
            test_probs.append(torch.sigmoid(logits.squeeze(-1)).cpu().numpy())
    test_probs = np.concatenate(test_probs)
    test_metrics = _metrics(y_test, test_probs)
    models["cnn"] = {"path": "models/drone_detector.pt", "arch": "DroneCNN", "params": model_param_count(cnn)}
    results["cnn"] = {"val_best_roc_auc": best_val, "best_epoch": best_epoch, "test": test_metrics, "train_seconds": dur}

    # Select best model by validation ROC-AUC
    best_name = max(results, key=lambda k: results[k]["val_best_roc_auc"])
    print("BEST MODEL BY VAL ROC-AUC:", best_name)

    # Ensure directories exist
    models_dir = Path("models")
    reports_dir = Path("reports")
    artifacts_dir = Path("artifacts")
    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Unified artifact saving: save standard PyTorch checkpoints with metadata
    cnn_artifact_path = models_dir / "drone_detector.pt"
    baseline_artifact_path = models_dir / "baseline.pt"
    scaler_artifact_path = models_dir / "preprocessing.joblib"

    torch.save({
        "model_type": "DroneCNNv2",
        "state_dict": cnn.state_dict(),
        "config": {"seq_len": seq_len, "n_channels": 3},
        "metrics": results["cnn"],
    }, cnn_artifact_path)

    torch.save({
        "model_type": "BaselineLogistic",
        "state_dict": baseline.state_dict(),
        "config": {"input_dim": input_dim},
        "metrics": results["baseline"],
    }, baseline_artifact_path)

    # Save scaler
    import joblib
    joblib.dump(data["scaler"], scaler_artifact_path)
    # Also save fallback legacy path if needed
    joblib.dump(data["scaler"], models_dir / "preprocessing.pkl")

    # Update models dict with true artifact paths
    models["cnn"]["path"] = str(cnn_artifact_path)
    models["baseline"]["path"] = str(baseline_artifact_path)

    # Save comprehensive configuration
    config = {
        "dataset": {"path": str(Path("astra_dataset.csv").resolve()), "rows": 2800, "n_classes_original": 4},
        "binary_classes": {"drone": [0], "non_drone": [1, 2, 3]},
        "split": {"train": int(len(y_train)), "val": int(len(y_val)), "test": int(len(y_test)), "strategy": "stratified", "seed": SEED},
        "preprocessing": data["feature_info"],
        "model": {"baseline": models["baseline"], "cnn": models["cnn"], "best_by_val_roc_auc": best_name},
        "training": {"epochs": EPOCHS, "batch_size": BATCH_SIZE, "lr": LR, "patience": PATIENCE, "device": str(DEVICE), "seed": SEED},
        "best_epoch": {k: results[k]["best_epoch"] for k in results},
        "val_best_roc_auc": {k: results[k]["val_best_roc_auc"] for k in results},
        "test_metrics": {k: results[k]["test"] for k in results},
        "train_seconds": {k: results[k]["train_seconds"] for k in results},
    }
    (models_dir / "config.json").write_text(json.dumps(config, indent=2))
    print(f"Artifacts successfully saved to {models_dir}/ (drone_detector.pt, baseline.pt, preprocessing.joblib, config.json)")
    return config, results, data

if __name__ == "__main__":
    cfg, res, data = train_model()
    print("\n=== TRAINING SUMMARY ===")
    for name in ["baseline", "cnn"]:
        m = res[name]["test"]
        print(name, "params:", cfg["model"][name]["params"], "best_epoch:", res[name]["best_epoch"], "val_roc_auc:", res[name]["val_best_roc_auc"], "test:", {k: round(float(v),4) for k,v in m.items()})
