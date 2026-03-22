"""
Brain Tumor Classifier — Training Script
-----------------------------------------
Fine-tunes ResNet-50 on the Brain Tumor MRI Dataset.

Usage:
    cd brain-tumor-project
    python ml/scripts/train.py --epochs 50 --batch 32 --lr 1e-4

Output:
    ml/models/resnet50_brain_tumor.pth   ← best checkpoint
    ml/models/training_log.json          ← loss / accuracy curves
"""

import os, json, argparse, time, copy
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
import numpy as np

# ── Paths ─────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
DATA_DIR  = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(exist_ok=True)

CLASS_NAMES = ["Normal", "Benign", "Malignant", "Pituitary"]


# ── Transforms ────────────────────────────────────────────────────────
def get_transforms():
    train_tf = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train_tf, val_tf


# ── Model ─────────────────────────────────────────────────────────────
def build_model(num_classes: int = 4, freeze_backbone: bool = True) -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False
        # Unfreeze layer4 + fc for fine-tuning
        for param in model.layer4.parameters():
            param.requires_grad = True
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes),
    )
    return model


# ── Training loop ────────────────────────────────────────────────────
def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    train_tf, val_tf = get_transforms()

    train_ds = datasets.ImageFolder(str(DATA_DIR / "train"), transform=train_tf)
    val_ds   = datasets.ImageFolder(str(DATA_DIR / "val"),   transform=val_tf)

    train_dl = DataLoader(train_ds, batch_size=args.batch, shuffle=True,  num_workers=4, pin_memory=True)
    val_dl   = DataLoader(val_ds,   batch_size=args.batch, shuffle=False, num_workers=4, pin_memory=True)

    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")
    print(f"Classes: {train_ds.classes}")

    model     = build_model(num_classes=len(train_ds.classes)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    best_acc    = 0.0
    best_wts    = copy.deepcopy(model.state_dict())
    log         = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        for phase, loader in [("train", train_dl), ("val", val_dl)]:
            model.train() if phase == "train" else model.eval()
            running_loss = running_correct = total = 0

            for images, labels in loader:
                images, labels = images.to(device), labels.to(device)
                optimizer.zero_grad()
                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(images)
                    loss    = criterion(outputs, labels)
                    if phase == "train":
                        loss.backward()
                        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                        optimizer.step()

                running_loss    += loss.item() * images.size(0)
                running_correct += (outputs.argmax(1) == labels).sum().item()
                total           += labels.size(0)

            epoch_loss = running_loss / total
            epoch_acc  = running_correct / total * 100

            log[f"{phase}_loss"].append(round(epoch_loss, 4))
            log[f"{phase}_acc"].append(round(epoch_acc, 2))

            if phase == "val" and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_wts = copy.deepcopy(model.state_dict())
                torch.save(best_wts, MODEL_DIR / "resnet50_brain_tumor.pth")
                print(f"  ✓ Saved best model (acc={best_acc:.2f}%)")

        if hasattr(scheduler, "step"):
            scheduler.step()

        dt = time.time() - t0
        print(f"Epoch {epoch:3d}/{args.epochs}  "
              f"train_loss={log['train_loss'][-1]:.4f}  train_acc={log['train_acc'][-1]:.1f}%  "
              f"val_loss={log['val_loss'][-1]:.4f}  val_acc={log['val_acc'][-1]:.1f}%  "
              f"[{dt:.1f}s]")

    # Save log
    with open(MODEL_DIR / "training_log.json", "w") as f:
        json.dump(log, f, indent=2)
    print(f"\nTraining complete. Best val acc: {best_acc:.2f}%")
    print(f"Model saved to: {MODEL_DIR / 'resnet50_brain_tumor.pth'}")


# ── Evaluate ─────────────────────────────────────────────────────────
def evaluate(args):
    from sklearn.metrics import classification_report, confusion_matrix

    device   = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _, val_tf = get_transforms()
    val_ds   = datasets.ImageFolder(str(DATA_DIR / "val"), transform=val_tf)
    val_dl   = DataLoader(val_ds, batch_size=args.batch, shuffle=False, num_workers=4)

    model = build_model(num_classes=len(val_ds.classes)).to(device)
    model.load_state_dict(torch.load(MODEL_DIR / "resnet50_brain_tumor.pth", map_location=device))
    model.eval()

    all_preds, all_labels = [], []
    with torch.no_grad():
        for images, labels in val_dl:
            preds = model(images.to(device)).argmax(1).cpu().tolist()
            all_preds.extend(preds)
            all_labels.extend(labels.tolist())

    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=val_ds.classes))
    print("Confusion Matrix:")
    print(confusion_matrix(all_labels, all_preds))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int,   default=50)
    parser.add_argument("--batch",  type=int,   default=32)
    parser.add_argument("--lr",     type=float, default=1e-4)
    parser.add_argument("--eval",   action="store_true", help="Evaluate only (no training)")
    args = parser.parse_args()

    if args.eval:
        evaluate(args)
    else:
        train(args)
        evaluate(args)
