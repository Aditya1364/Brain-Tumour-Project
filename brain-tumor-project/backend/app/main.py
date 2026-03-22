from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.routes import patients, scans, dashboard, reports, auth
from app.config import settings

Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("reports", exist_ok=True)

app = FastAPI(
    title="NeuralOnco API",
    description="Brain Tumor Detection ML System",
    version="2.4.1",
)

# Allow ALL origins — works for localhost, ngrok, any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(patients.router,  prefix="/api/patients",  tags=["patients"])
app.include_router(scans.router,     prefix="/api/scans",     tags=["scans"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(reports.router,   prefix="/api/reports",   tags=["reports"])

@app.get("/")
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "2.4.1"}

@app.get("/health")
def health():
    return {"status": "healthy"}
