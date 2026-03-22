from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime

from app.database import get_db
from app.models.db_models import Patient, Scan
from app.models.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total     = db.query(Patient).count()
    malignant = db.query(Scan).filter(Scan.status == "Malignant").count()
    benign    = db.query(Scan).filter(Scan.status == "Benign").count()
    normal    = db.query(Scan).filter(Scan.status == "Normal").count()
    pending   = db.query(Scan).filter(Scan.analyzed == False).count()
    return DashboardStats(
        total=total, malignant=malignant,
        benign=benign, normal=normal, pending=pending
    )


@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db)):
    """Scan counts per month for current year."""
    year = datetime.now().year
    rows = (
        db.query(
            extract("month", Scan.created_at).label("month"),
            func.count(Scan.id).label("count"),
        )
        .filter(extract("year", Scan.created_at) == year)
        .group_by("month")
        .all()
    )
    counts = [0] * 12
    for r in rows:
        counts[int(r.month) - 1] = r.count
    return {"year": year, "monthly": counts}
