from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Patient ──────────────────────────────────────────────────────────
class PatientCreate(BaseModel):
    name:        str
    age:         Optional[int]   = None
    gender:      Optional[str]   = "Male"
    dob:         Optional[str]   = None
    phone:       Optional[str]   = None
    email:       Optional[str]   = None
    address:     Optional[str]   = None
    symptoms:    Optional[str]   = None
    history:     Optional[str]   = None
    referred_by: Optional[str]   = None
    mri_type:    Optional[str]   = "T1-Gd"
    priority:    Optional[str]   = "Normal"
    notes:       Optional[str]   = None


class PatientOut(PatientCreate):
    id:           int
    patient_code: str
    created_at:   Optional[datetime]

    class Config:
        from_attributes = True


# ── Scan ─────────────────────────────────────────────────────────────
class ScanOut(BaseModel):
    id:             int
    patient_id:     int
    filename:       Optional[str]
    mri_type:       Optional[str]
    analyzed:       bool
    status:         Optional[str]
    confidence:     Optional[float]
    tumor_type:     Optional[str]
    tumor_grade:    Optional[str]
    tumor_location: Optional[str]
    tumor_size:     Optional[str]
    tumor_volume:   Optional[float]
    edema_volume:   Optional[float]
    enhancement:    Optional[str]
    recommendation: Optional[str]
    probabilities:  Optional[str]
    heatmap_path:   Optional[str]
    created_at:     Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total:     int
    malignant: int
    benign:    int
    normal:    int
    pending:   int


# ── Analysis result ───────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    status:         str
    confidence:     float
    type:           str
    grade:          str
    location:       str
    size:           str
    volume:         str
    edema:          str
    enhancement:    str
    recommendation: str
    probabilities:  List[List]
