"""Data loading and splitting for the drone detector dataset."""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
import joblib

CSV = Path("astra_dataset.csv")
FEATURE_COLS = [str(i) for i in range(300)]
LABEL_COL = "label"
SEQ_LEN = 150
N_CHANNELS = 2

# Drone class mapping (preserve original multiclass labels)
DRONE_CLASSES = [0]
NON_DRONE_CLASSES = [1, 2, 3]
CLASS_NAMES = {0: "DRONE", 1: "NON-DRONE"}
INV_CLASS_NAMES = {0: 0, 1: 1}

def load_dataframe() -> pd.DataFrame:
    return pd.read_csv(CSV)

def build_binary_target(y: np.ndarray) -> np.ndarray:
    return np.where(np.isin(y, DRONE_CLASSES), 1, 0).astype(np.int64)

def samples_to_sequences(X: np.ndarray) -> np.ndarray:
    # X shape (N, 300) -> (N, 150, 2)
    return X.reshape(-1, SEQ_LEN, N_CHANNELS).astype(np.float32)

def split_dataset(
    X: np.ndarray,
    y_bin: np.ndarray,
    seed: int = 42,
    test_size: float = 0.15,
    val_ratio: float = 0.15,
) -> tuple:
    """Stratified split into train/val/test. Returns numpy arrays.

    Note: No grouping variable exists in the dataset, so we use stratified
    splitting and explicitly note the limitation that object-level leakage is
    not controlled.
    """
    sss_test = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    train_idx, test_idx = next(sss_test.split(X, y_bin))
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y_bin[train_idx], y_bin[test_idx]

    val_frac = val_ratio / (1 - test_size)
    sss_val = StratifiedShuffleSplit(n_splits=1, test_size=val_frac, random_state=seed)
    tr_idx, val_idx = next(sss_val.split(X_train, y_train))
    X_tr, X_val = X_train[tr_idx], X_train[val_idx]
    y_tr, y_val = y_train[tr_idx], y_train[val_idx]
    return (X_tr, y_tr), (X_val, y_val), (X_test, y_test), (train_idx[tr_idx], val_idx, test_idx)

from preprocessing import transform_and_scale, SEQ_LEN, RAW_CHANNELS, FEATURE_CHANNELS, TOTAL_RAW_FEATURES

def scale_complex_magnitude_only_v2(X_seq: np.ndarray, scaler: StandardScaler | None = None, fit: bool = False) -> tuple:
    """Wrapper around centralized transform_and_scale."""
    # If X_seq is (N, 150, 2), flatten to (N, 300) for transform_and_scale
    if X_seq.ndim == 3:
        X_seq = X_seq.reshape(X_seq.shape[0], -1)
    return transform_and_scale(X_seq, scaler=scaler, fit=fit)

def prepare_data(seed: int = 42):
    df = load_dataframe()
    X_raw = df[FEATURE_COLS].values.astype(np.float64)
    y_orig = df[LABEL_COL].values
    y_bin = build_binary_target(y_orig)
    (X_tr, y_tr), (X_val, y_val), (X_test, y_test), idx = split_dataset(X_raw, y_bin, seed=seed)
    X_tr_s, scaler = transform_and_scale(X_tr, fit=True)
    X_val_s, _ = transform_and_scale(X_val, scaler=scaler, fit=False)
    X_test_s, _ = transform_and_scale(X_test, scaler=scaler, fit=False)
    return {
        "X_train": X_tr_s,
        "y_train": y_tr,
        "X_val": X_val_s,
        "y_val": y_val,
        "X_test": X_test_s,
        "y_test": y_test,
        "y_orig_train": y_orig[idx[0]],
        "y_orig_val": y_orig[idx[1]],
        "y_orig_test": y_orig[idx[2]],
        "scaler": scaler,
        "class_mapping": {"drone_classes": DRONE_CLASSES, "non_drone_classes": NON_DRONE_CLASSES},
        "feature_info": {
            "seq_len": SEQ_LEN,
            "n_input_channels": RAW_CHANNELS,
            "n_channels": FEATURE_CHANNELS,
            "n_feature_channels": FEATURE_CHANNELS,
            "input_dim": SEQ_LEN * FEATURE_CHANNELS
        },
        "split_indices": idx,
    }
