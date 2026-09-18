"""
Vehicle Entry/Exit History and Audit Logs API
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from backend.database.db import get_db
from backend.database.models import EntryExitLog, Vehicle

router = APIRouter(prefix="/api/history", tags=["Vehicle History"])


@router.get("")
def list_history(
    search: Optional[str] = Query(None, description="Search by plate number, vehicle ID, or contractor"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    status: Optional[str] = Query(None, description="Filter by entry status: inside, exited"),
    auth_status: Optional[str] = Query(None, description="Filter by authorization: authorized, unauthorized, expired"),
    camera_id: Optional[str] = Query(None, description="Filter by camera/gate"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve comprehensive site vehicle entry/exit audit logs."""
    query = db.query(EntryExitLog)

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            (EntryExitLog.license_plate.ilike(s)) |
            (EntryExitLog.vehicle_id.ilike(s)) |
            (EntryExitLog.company.ilike(s))
        )

    if vehicle_type and vehicle_type != "all":
        query = query.filter(EntryExitLog.vehicle_type == vehicle_type)

    if status and status != "all":
        query = query.filter(EntryExitLog.status == status)

    if auth_status and auth_status != "all":
        query = query.filter(EntryExitLog.authorization_status == auth_status)

    if camera_id and camera_id != "all":
        query = query.filter(EntryExitLog.camera_id == camera_id)

    logs = query.order_by(EntryExitLog.entry_time.desc()).limit(limit).all()
    return [l.to_dict() for l in logs]


@router.get("/{id}")
def get_history_detail(id: int, db: Session = Depends(get_db)):
    """Retrieve detailed visit profile with permit and contractor records."""
    log = db.query(EntryExitLog).filter(EntryExitLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="History log not found.")

    res = log.to_dict()
    # Enrich with vehicle permit details if registered
    vehicle = db.query(Vehicle).filter(Vehicle.license_plate == log.license_plate).first()
    if vehicle:
        res["vehicle_profile"] = vehicle.to_dict()
    else:
        res["vehicle_profile"] = None

    return res
