"""
Updated scans.py — adds email notifications after analysis
Replace your existing backend/app/routes/scans.py with this file
"""

import os, uuid, json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.db_models import Scan, Patient, Doctor
from app.models.schemas import ScanOut
from app.ml.predictor import predict
from app.ml.gradcam import generate_gradcam
from app.config import settings

# Import email (gracefully — won't break if email not configured)
try:
    from app.utils.email_notifications import send_scan_result, send_critical_alert
    EMAIL_OK = True
except ImportError:
    EMAIL_OK = False

router = APIRouter()


def _send_notifications(scan, patient, db: Session):
    """Run in background — send email notifications after scan analysis."""
    if not EMAIL_OK:
        return
    try:
        # Get doctor email
        doctor = db.query(Doctor).first()
        if not doctor or not doctor.email:
            return

        # Send scan result email
        send_scan_result(
            doctor_email  = doctor.email,
            patient_name  = patient.name if patient else "Unknown",
            patient_code  = patient.patient_code if patient else "—",
            scan_id       = scan.id,
            status        = scan.status or "Unknown",
            confidence    = scan.confidence or 0,
            tumor_type    = scan.tumor_type or "—",
            tumor_grade   = scan.tumor_grade or "—",
            location      = scan.tumor_location or "—",
            recommendation= scan.recommendation or "",
        )

        # Extra critical alert for malignant findings
        if scan.status == "Malignant" and (scan.confidence or 0) > 80:
            send_critical_alert(
                doctor_email = doctor.email,
                patient_name = patient.name if patient else "Unknown",
                patient_code = patient.patient_code if patient else "—",
                confidence   = scan.confidence or 0,
                tumor_type   = scan.tumor_type or "—",
            )
    except Exception as e:
        print(f"[Email] Background notification error: {e}")


@router.post("/upload", response_model=ScanOut, status_code=201)
async def upload_scan(
    file:       UploadFile = File(...),
    patient_id: str        = Form(""),
    db:         Session    = Depends(get_db),
):
    ext      = os.path.splitext(file.filename)[-1] or ".jpg"
    fname    = f"{uuid.uuid4().hex}{ext}"
    fpath    = os.path.join(settings.UPLOAD_DIR, fname)
    contents = await file.read()
    with open(fpath, "wb") as f:
        f.write(contents)

    pat_id = None
    if patient_id:
        try:
            pat_id = int(patient_id)
        except ValueError:
            p = db.query(Patient).filter(Patient.patient_code == patient_id).first()
            if p:
                pat_id = p.id

    if pat_id is None:
        first = db.query(Patient).first()
        if first:
            pat_id = first.id
        else:
            placeholder = Patient(name="Unknown", patient_code="BT-000")
            db.add(placeholder)
            db.commit()
            db.refresh(placeholder)
            pat_id = placeholder.id

    scan = Scan(
        patient_id=pat_id,
        filename=file.filename,
        file_path=fpath,
        mri_type="T1-Gd",
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.post("/{scan_id}/analyze", response_model=ScanOut)
def analyze_scan(
    scan_id:    int,
    background: BackgroundTasks,
    db:         Session = Depends(get_db),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    result = predict(scan.file_path)

    heatmap_path = None
    try:
        heatmap_fname = f"heatmap_{scan_id}.jpg"
        heatmap_path  = os.path.join(settings.UPLOAD_DIR, heatmap_fname)
        generate_gradcam(scan.file_path, heatmap_path)
    except Exception as e:
        print(f"Heatmap error: {e}")

    scan.analyzed       = True
    scan.status         = result["status"]
    scan.confidence     = result["confidence"]
    scan.tumor_type     = result["type"]
    scan.tumor_grade    = result.get("grade", "—")
    scan.tumor_location = result.get("location", "—")
    scan.tumor_size     = result.get("size", "—")
    scan.tumor_volume   = result.get("volume_cm3")
    scan.edema_volume   = result.get("edema_cm3")
    scan.enhancement    = result.get("enhancement", "—")
    scan.recommendation = result.get("recommendation", "")
    scan.probabilities  = json.dumps(result.get("probabilities", []))
    scan.heatmap_path   = heatmap_path

    db.commit()
    db.refresh(scan)

    # Send email notification in background (non-blocking)
    patient = db.query(Patient).filter(Patient.id == scan.patient_id).first()
    background.add_task(_send_notifications, scan, patient, db)

    return scan


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    return scan


@router.get("/{scan_id}/heatmap")
def get_heatmap(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or not scan.heatmap_path or not os.path.exists(scan.heatmap_path):
        raise HTTPException(404, "Heatmap not available")
    return FileResponse(scan.heatmap_path, media_type="image/jpeg")


@router.get("", response_model=list[ScanOut])
def list_scans(
    patient_id: Optional[int] = Query(None),
    limit:      int           = Query(100),
    db:         Session       = Depends(get_db),
):
    q = db.query(Scan)
    if patient_id is not None:
        q = q.filter(Scan.patient_id == patient_id)
    return q.order_by(Scan.created_at.desc()).limit(limit).all()
