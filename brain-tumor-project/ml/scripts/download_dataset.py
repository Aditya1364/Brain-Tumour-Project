"""
Dataset Preparation Script
--------------------------
Downloads the Brain Tumor MRI Dataset from Kaggle and organises it.

Dataset: https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset
Classes: glioma | meningioma | notumor | pituitary

Usage:
    pip install kaggle
    # Place kaggle.json in ~/.kaggle/
    python ml/scripts/download_dataset.py
"""

import os
import shutil
import zipfile
from pathlib import Path

DATA_DIR   = Path("ml/data")
RAW_DIR    = DATA_DIR / "raw"
PROC_DIR   = DATA_DIR / "processed"

CLASS_MAP  = {
    "glioma":      "Malignant",
    "meningioma":  "Benign",
    "notumor":     "Normal",
    "pituitary":   "Pituitary",
}


def download_kaggle():
    try:
        import kaggle
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        print("Downloading Brain Tumor MRI Dataset from Kaggle...")
        kaggle.api.dataset_download_files(
            "masoudnickparvar/brain-tumor-mri-dataset",
            path=str(RAW_DIR),
            unzip=True,
        )
        print(f"✓ Downloaded to {RAW_DIR}")
    except Exception as e:
        print(f"Kaggle download failed: {e}")
        print("Manual download:")
        print("  1. Visit https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset")
        print("  2. Download and extract to ml/data/raw/")
        raise


def reorganise():
    """
    Expected raw structure:
        ml/data/raw/Training/{glioma,meningioma,notumor,pituitary}/
        ml/data/raw/Testing/ {glioma,meningioma,notumor,pituitary}/
    """
    for split in ["Training", "Testing"]:
        split_map = {"Training": "train", "Testing": "val"}
        out_split = split_map[split]
        for raw_cls, mapped_cls in CLASS_MAP.items():
            src = RAW_DIR / split / raw_cls
            dst = PROC_DIR / out_split / mapped_cls
            if not src.exists():
                print(f"⚠  Source not found: {src}")
                continue
            dst.mkdir(parents=True, exist_ok=True)
            for f in src.iterdir():
                shutil.copy2(f, dst / f.name)
        print(f"✓ Organised {split} → {out_split}")

    # Count
    for split in ["train", "val"]:
        for cls in CLASS_MAP.values():
            d = PROC_DIR / split / cls
            n = len(list(d.glob("*"))) if d.exists() else 0
            print(f"  {split}/{cls}: {n} images")


def create_synthetic_samples(n: int = 10):
    """Create tiny placeholder images so the app can be tested without Kaggle."""
    from PIL import Image, ImageDraw
    import random

    print(f"\nCreating {n} synthetic samples per class for quick testing...")
    for split in ["train", "val"]:
        for cls in CLASS_MAP.values():
            d = PROC_DIR / split / cls
            d.mkdir(parents=True, exist_ok=True)
            for i in range(n):
                img = Image.new("RGB", (224, 224), color=(20, 30, 60))
                draw = ImageDraw.Draw(img)
                # Fake brain ellipse
                draw.ellipse([40, 30, 184, 194], outline=(80, 120, 200), width=3)
                draw.ellipse([80, 70, 144, 154], outline=(60, 90, 160), width=2)
                if cls != "Normal":
                    r = random.randint(8, 22)
                    cx = random.randint(100, 160)
                    cy = random.randint(60, 130)
                    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(200, 50, 50), outline=(255, 80, 80), width=1)
                img.save(d / f"synthetic_{i:04d}.jpg")
    print("✓ Synthetic samples created — good for smoke-testing the pipeline")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", action="store_true", help="Create synthetic test images only")
    parser.add_argument("--n", type=int, default=20, help="Synthetic samples per class")
    args = parser.parse_args()

    if args.synthetic:
        create_synthetic_samples(args.n)
    else:
        download_kaggle()
        reorganise()
