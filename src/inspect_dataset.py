"""Inspect the CSV dataset and print a dataset inspection report."""
import os
import numpy as np
import pandas as pd
from pathlib import Path

CSV = Path("astra_dataset.csv")

def main() -> None:
    print("=" * 70)
    print("DATASET INSPECTION REPORT")
    print("=" * 70)

    print("filename/path:", CSV.resolve())
    print("file_size_bytes:", os.path.getsize(CSV))

    df = pd.read_csv(CSV)
    print("rows:", len(df))
    print("columns:", df.shape[1])
    print("column_names:", list(df.columns))

    print("\ndtypes summary:")
    print(df.dtypes.astype(str).value_counts().to_string())

    print("\nmissing_values_per_column (top 10):")
    print(df.isna().sum().sort_values(ascending=False).head(10).to_string())
    print("total_missing_cells:", int(df.isna().sum().sum()))
    print("duplicate_rows:", int(df.duplicated().sum()))

    print("\nfirst_5_rows:")
    print(df.head().to_string())
    print("\nlast_5_rows:")
    print(df.tail().to_string())

    print("\nlabel_column: 'label'")
    print("unique_labels:", sorted(df['label'].unique().tolist()))
    print("class_distribution (4-way):")
    print(df['label'].value_counts().sort_index().to_string())

    feat_cols = [c for c in df.columns if c != 'label']
    X = df[feat_cols].astype(np.float64).values
    print("\nfeature_array_shape:", X.shape)
    print("global_mean_range:", float(X.mean(axis=0).min()), "to", float(X.mean(axis=0).max()))
    print("global_std_range:", float(X.std(axis=0).min()), "to", float(X.std(axis=0).max()))
    print("global_min/max:", float(X.min()), float(X.max()))

    print("\nFEATURE REPRESENTATION ANALYSIS")
    print("Each row is one sample with 300 numeric features.")
    print("Inspection shows columns occur in pairs (0,1),(2,3),...,(298,299).")
    print("We interpret this as 150 complex baseband samples (I,Q) per row -> shape (N,150,2).")
    print("Sequence length = 150; channels = 2 (I, Q); column order preserved as time order.")

    print("\nDATASET STRUCTURE CLASSIFICATION")
    print("Option (3): fixed-length windows extracted from longer signals.")
    print("Each row is an independent window. No ID/track/session column present,")
    print("so no group-based split is possible. We use stratified splitting and")
    print("explicitly note the limitation that object-level leakage is not controlled.")

    print("\nPOSSIBLE TARGET COLUMN")
    print("'label' (int 0..3). Unique classes: 4.")
    print("We later map class 0 -> DRONE, classes 1,2,3 -> NON-DRONE.")

if __name__ == "__main__":
    main()
