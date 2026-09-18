"""
Alerts & Security Incident Management API
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime

from backend.database.db import get_db
from backend.database.models import Alert, Vehicle

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


class AlertStatusUpdate(BaseModel):
    status: str  # new, reviewed, resolved
    reviewed_by: Optional[str] = "admin"


class AuthorizeVehicleFromAlert(BaseModel):
    company: str
    vehicle_type: str
    driver_name: Optional[str] = None
    contact_number: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: new, reviewed, resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: high, medium, low"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """List site security alerts with severity and resolution state."""
    query = db.query(Alert)

    if status and status != "all":
        query = query.filter(Alert.status == status)

    if severity and severity != "all":
        query = query.filter(Alert.severity == severity)

    if alert_type and alert_type != "all":
        query = query.filter(Alert.alert_type == alert_type)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return [a.to_dict() for a in alerts]


@router.put("/{id}")
def update_alert_status(id: int, req: AlertStatusUpdate, db: Session = Depends(get_db)):
    """Update alert lifecycle status (new -> reviewed -> resolved)."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    valid_statuses = ["new", "reviewed", "resolved"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    alert.status = req.status
    alert.reviewed_by = req.reviewed_by
    if req.status == "resolved":
        alert.resolved_at = datetime.datetime.utcnow()
    else:
        alert.resolved_at = None

    db.commit()
    db.refresh(alert)
    return alert.to_dict()


@router.post("/{id}/authorize")
def quick_authorize(id: int, req: AuthorizeVehicleFromAlert, db: Session = Depends(get_db)):
    """Quickly grant authorization to a flagged unauthorized vehicle."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert or not alert.license_plate:
        raise HTTPException(status_code=404, detail="Alert not found or has no license plate.")

    clean_plate = alert.license_plate.replace(" ", "").upper()

    # Check if already registered
    vehicle = db.query(Vehicle).filter(Vehicle.license_plate == clean_plate).first()
    now = datetime.datetime.utcnow()

    if not vehicle:
        v_count = db.query(Vehicle).count() + 1
        vehicle = Vehicle(
            vehicle_id=f"V-SITE-{v_count:03d}",
            license_plate=clean_plate,
            vehicle_type=req.vehicle_type,
            company=req.company,
            driver_name=req.driver_name,
            contact_number=req.contact_number,
            authorization_status="authorized",
            permit_start_date=now,
            permit_expiry_date=now + datetime.timedelta(days=90),
            notes=f"Authorized via Alert #{id}. {req.notes or ''}"
        )
        db.add(vehicle)
    else:
        # Renew expired
        vehicle.authorization_status = "authorized"
        vehicle.permit_expiry_date = now + datetime.timedelta(days=90)

    # Mark alert as resolved
    alert.status = "resolved"
    alert.resolved_at = now
    alert.reviewed_by = "admin"

    db.commit()
    return {
        "message": f"Vehicle {clean_plate} has been authorized and alert resolved.",
        "vehicle": vehicle.to_dict(),
        "alert": alert.to_dict()
    }
