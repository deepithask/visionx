"""
System Health, Configuration Settings, and Demo Management API
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from backend.database.db import get_db, Base, engine
from backend.database.models import Camera, Vehicle, EntryExitLog, Alert
from backend.database.seed_data import seed_database
from backend.config import (
    DEFAULT_OCR_CONFIDENCE_THRESHOLD,
    DEFAULT_QUALITY_SCORE_THRESHOLD,
    ENTRY_LINE_Y_RATIO,
    EXIT_LINE_Y_RATIO,
    CAMERAS
)
from backend.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/api/system", tags=["System & Settings"])


class SettingsUpdate(BaseModel):
    ocr_confidence_threshold: float = 0.75
    quality_score_threshold: float = 45.0
    entry_line_y_ratio: float = 0.55
    exit_line_y_ratio: float = 0.85


# In-memory settings state
_runtime_settings = {
    "ocr_confidence_threshold": DEFAULT_OCR_CONFIDENCE_THRESHOLD,
    "quality_score_threshold": DEFAULT_QUALITY_SCORE_THRESHOLD,
    "entry_line_y_ratio": ENTRY_LINE_Y_RATIO,
    "exit_line_y_ratio": EXIT_LINE_Y_RATIO,
    "site_name": "Metro SkyTower Infrastructure - Project Alpha",
    "active_gate": "Gate-01 North Inbound"
}


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint confirming database, video pipeline, and OCR status."""
    vehicles_count = db.query(Vehicle).count()
    return {
        "status": "healthy",
        "service": "AI-Powered Construction Site Vehicle & License Plate Monitoring System",
        "version": "2.0.0",
        "database": "connected",
        "registered_vehicles_count": vehicles_count,
        "pipeline_running": pipeline_service.is_running,
        "pipeline_paused": pipeline_service.is_paused,
        "cameras": CAMERAS
    }


@router.get("/settings")
def get_settings():
    return {
        "settings": _runtime_settings,
        "cameras": CAMERAS
    }


@router.put("/settings")
def update_settings(req: SettingsUpdate):
    _runtime_settings["ocr_confidence_threshold"] = req.ocr_confidence_threshold
    _runtime_settings["quality_score_threshold"] = req.quality_score_threshold
    _runtime_settings["entry_line_y_ratio"] = req.entry_line_y_ratio
    _runtime_settings["exit_line_y_ratio"] = req.exit_line_y_ratio
    return {
        "message": "Settings updated successfully.",
        "settings": _runtime_settings
    }


@router.post("/reset-demo")
def reset_demo_database(db: Session = Depends(get_db)):
    """Wipe and re-seed the SQLite database with fresh construction scenario data."""
    pipeline_service.stop_session()
    pipeline_service.tracker.reset()
    
    # Drop all and recreate
    Base.metadata.drop_all(bind=engine)
    seed_database(db)
    
    return {
        "message": "Database reset to initial demo state successfully.",
        "vehicles": db.query(Vehicle).count(),
        "alerts": db.query(Alert).count()
    }
