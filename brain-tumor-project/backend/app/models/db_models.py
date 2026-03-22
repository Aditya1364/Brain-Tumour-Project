from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id           = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True)
    name         = Column(String, nullable=False)
    age          = Column(Integer)
    gender       = Column(String)
    dob          = Column(String)
    phone        = Column(String)
    email        = Column(String)
    address      = Column(Text)
    symptoms     = Column(Text)
    history      = Column(Text)
    referred_by  = Column(String)
    mri_type     = Column(String, default="T1-Gd")
    priority     = Column(String, default="Normal")
    notes        = Column(Text)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    scans = relationship("Scan", back_populates="patient", cascade="all, delete")


class Scan(Base):
    __tablename__ = "scans"

    id              = Column(Integer, primary_key=True, index=True)
    patient_id      = Column(Integer, ForeignKey("patients.id"), nullable=False)
    filename        = Column(String)
    file_path       = Column(String)
    mri_type        = Column(String)
    analyzed        = Column(Boolean, default=False)

    status          = Column(String)
    confidence      = Column(Float)
    tumor_type      = Column(String)
    tumor_grade     = Column(String)
    tumor_location  = Column(String)
    tumor_size      = Column(String)
    tumor_volume    = Column(Float)
    edema_volume    = Column(Float)
    enhancement     = Column(String)
    recommendation  = Column(Text)
    probabilities   = Column(Text)
    heatmap_path    = Column(String)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="scans")


# ── Doctor / Auth ─────────────────────────────────────────────────────
class Doctor(Base):
    __tablename__ = "doctors"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    password    = Column(String, nullable=False)   # SHA-256 hashed
    hospital    = Column(String, default="")
    speciality  = Column(String, default="")
    license_no  = Column(String, default="")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
