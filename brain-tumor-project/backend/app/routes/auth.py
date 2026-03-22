"""
Authentication Routes
---------------------
POST /api/auth/signup  — register new doctor account + send welcome email
POST /api/auth/login   — login, returns JWT token
GET  /api/auth/me      — get current logged-in user
POST /api/auth/logout  — logout
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import hashlib
import secrets

from app.database import get_db
from app.models.db_models import Doctor

router = APIRouter()

# ── Simple in-memory token store ──────────────────────────────────────
_token_store: dict = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Schemas ───────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name:       str
    email:      str
    password:   str
    hospital:   Optional[str] = ""
    speciality: Optional[str] = ""
    license_no: Optional[str] = ""


class LoginRequest(BaseModel):
    email:    str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    doctor:       dict


# ── Helpers ───────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(doctor_id: int) -> str:
    token = secrets.token_hex(32)
    _token_store[token] = doctor_id
    return token


def get_current_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token or token not in _token_store:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    doctor_id = _token_store[token]
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


def doctor_to_dict(d) -> dict:
    return {
        "id":         d.id,
        "name":       d.name,
        "email":      d.email,
        "hospital":   d.hospital   or "",
        "speciality": d.speciality or "",
        "license_no": d.license_no or "",
        "created_at": str(d.created_at)[:10] if d.created_at else "",
    }


# ── Background email task ─────────────────────────────────────────────
def _send_welcome_email(doctor_email: str, doctor_name: str, hospital: str):
    """Run in background so signup response is not delayed."""
    try:
        from app.utils.email_notifications import send_welcome
        result = send_welcome(
            doctor_email=doctor_email,
            doctor_name=doctor_name,
            hospital=hospital or "",
        )
        if result:
            print(f"[Auth] Welcome email sent to {doctor_email}")
        else:
            print(f"[Auth] Welcome email skipped for {doctor_email}")
    except Exception as e:
        print(f"[Auth] Welcome email error: {e}")


# ── Routes ────────────────────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(
    data:       SignupRequest,
    background: BackgroundTasks,
    db:         Session = Depends(get_db),
):
    # Check email not already registered
    existing = db.query(Doctor).filter(Doctor.email == data.email.strip().lower()).first()
    if existing:
        raise HTTPException(400, "Email already registered. Please log in.")

    doctor = Doctor(
        name        = data.name.strip(),
        email       = data.email.strip().lower(),
        password    = hash_password(data.password),
        hospital    = data.hospital    or "",
        speciality  = data.speciality  or "",
        license_no  = data.license_no  or "",
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    token = create_token(doctor.id)

    # Send welcome email in background (non-blocking)
    background.add_task(
        _send_welcome_email,
        doctor.email,
        doctor.name,
        doctor.hospital or "",
    )

    print(f"[Auth] New doctor registered: {doctor.name} ({doctor.email})")

    return TokenResponse(access_token=token, doctor=doctor_to_dict(doctor))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(
        Doctor.email == data.email.strip().lower()
    ).first()

    if not doctor or doctor.password != hash_password(data.password):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(doctor.id)
    print(f"[Auth] Doctor logged in: {doctor.name} ({doctor.email})")

    return TokenResponse(access_token=token, doctor=doctor_to_dict(doctor))


@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    if token and token in _token_store:
        del _token_store[token]
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(doctor=Depends(get_current_doctor)):
    return doctor_to_dict(doctor)