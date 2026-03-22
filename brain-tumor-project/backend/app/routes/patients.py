"""
Updated patients.py — sends welcome email when patient is registered
Replace your existing backend/app/routes/patients.py with this file
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import random, string

from app.database import get_db
from app.models.db_models import Patient, Doctor
from app.models.schemas import PatientCreate, PatientOut

try:
    from app.utils.email_notifications import send_patient_registered
    EMAIL_OK = True
except ImportError:
    EMAIL_OK = False

router = APIRouter()


def generate_code(db: Session) -> str:
    while True:
        code = "BT-" + "".join(random.choices(string.digits, k=3))
        if not db.query(Patient).filter(Patient.patient_code == code).first():
            return code


def _notify_patient_registered(patient, db: Session):
    if not EMAIL_OK:
        return
    try:
        doctor = db.query(Doctor).first()
        if doctor and doctor.email:
            send_patient_registered(
                doctor_email  = doctor.email,
                patient_name  = patient.name,
                patient_code  = patient.patient_code,
                priority      = patient.priority or "Normal",
            )
    except Exception as e:
        print(f"[Email] Patient registration notify error: {e}")


@router.get("", response_model=List[PatientOut])
def list_patients(
    skip:   int = 0,
    limit:  int = 100,
    search: Optional[str] = Query(None),
    db:     Session = Depends(get_db),
):
    q = db.query(Patient)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Patient.name.ilike(like) |
            Patient.patient_code.ilike(like)
        )
    return q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(
    data:       PatientCreate,
    background: BackgroundTasks,
    db:         Session = Depends(get_db),
):
    patient = Patient(**data.model_dump(), patient_code=generate_code(db))
    db.add(patient)
    db.commit()
    db.refresh(patient)
    background.add_task(_notify_patient_registered, patient, db)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    return p


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, data: PatientCreate, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    db.delete(p)
    db.commit()
    return {"deleted": True}
