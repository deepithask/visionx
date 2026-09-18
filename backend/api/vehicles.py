"""
Vehicle Database Management API
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
import re

from backend.database.db import get_db
from backend.database.models import Vehicle

router = APIRouter(prefix="/api/vehicles", tags=["Vehicle Management"])


class VehicleCreate(BaseModel):
    vehicle_id: str = Field(..., example="V-SITE-009")
    license_plate: str = Field(..., example="TN38AB9999")
    vehicle_type: str = Field(..., example="Dump Truck")
    company: str = Field(..., example="Apex Infrastructure Ltd")
    driver_name: Optional[str] = Field(None, example="Arun Vijay")
    contact_number: Optional[str] = Field(None, example="+91 98400 99887")
    authorization_status: str = Field("authorized", example="authorized")
    permit_start_date: Optional[str] = Field(None, example="2026-09-01")
    permit_expiry_date: Optional[str] = Field(None, example="2027-03-01")
    notes: Optional[str] = None


class VehicleUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_type: Optional[str] = None
    company: Optional[str] = None
    driver_name: Optional[str] = None
    contact_number: Optional[str] = None
    authorization_status: Optional[str] = None
    permit_start_date: Optional[str] = None
    permit_expiry_date: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_vehicles(
    search: Optional[str] = Query(None, description="Search by license plate, vehicle ID, driver, or contractor"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    status: Optional[str] = Query(None, description="Filter by authorization status: authorized, unauthorized, expired"),
    company: Optional[str] = Query(None, description="Filter by company"),
    db: Session = Depends(get_db)
):
    """List all registered construction vehicles with search and filtering."""
    query = db.query(Vehicle)

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            (Vehicle.license_plate.ilike(s)) |
            (Vehicle.vehicle_id.ilike(s)) |
            (Vehicle.company.ilike(s)) |
            (Vehicle.driver_name.ilike(s))
        )

    if vehicle_type and vehicle_type != "all":
        query = query.filter(Vehicle.vehicle_type == vehicle_type)

    if status and status != "all":
        query = query.filter(Vehicle.authorization_status == status)

    if company and company != "all":
        query = query.filter(Vehicle.company == company)

    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return [v.to_dict() for v in vehicles]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(v_in: VehicleCreate, db: Session = Depends(get_db)):
    """Register a new vehicle in the site database."""
    # Normalize plate: uppercase, remove spaces/hyphens
    clean_plate = re.sub(r'[^A-Z0-9]', '', v_in.license_plate.upper())
    if len(clean_plate) < 4:
        raise HTTPException(status_code=400, detail="Invalid license plate format. Must be at least 4 alphanumeric characters.")

    # Check if plate already registered
    existing = db.query(Vehicle).filter(Vehicle.license_plate == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle with license plate '{clean_plate}' is already registered (ID: {existing.vehicle_id}).")

    # Check vehicle_id uniqueness
    existing_id = db.query(Vehicle).filter(Vehicle.vehicle_id == v_in.vehicle_id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail=f"Vehicle ID '{v_in.vehicle_id}' already exists.")

    start_dt = None
    if v_in.permit_start_date:
        try:
            start_dt = datetime.datetime.fromisoformat(v_in.permit_start_date.replace("Z", ""))
        except ValueError:
            pass

    expiry_dt = None
    if v_in.permit_expiry_date:
        try:
            expiry_dt = datetime.datetime.fromisoformat(v_in.permit_expiry_date.replace("Z", ""))
        except ValueError:
            pass

    vehicle = Vehicle(
        vehicle_id=v_in.vehicle_id,
        license_plate=clean_plate,
        vehicle_type=v_in.vehicle_type,
        company=v_in.company,
        driver_name=v_in.driver_name,
        contact_number=v_in.contact_number,
        authorization_status=v_in.authorization_status,
        permit_start_date=start_dt,
        permit_expiry_date=expiry_dt,
        notes=v_in.notes
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle.to_dict()


@router.get("/{id}")
def get_vehicle(id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return vehicle.to_dict()


@router.put("/{id}")
def update_vehicle(id: int, v_in: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if v_in.vehicle_id is not None:
        vehicle.vehicle_id = v_in.vehicle_id
    if v_in.vehicle_type is not None:
        vehicle.vehicle_type = v_in.vehicle_type
    if v_in.company is not None:
        vehicle.company = v_in.company
    if v_in.driver_name is not None:
        vehicle.driver_name = v_in.driver_name
    if v_in.contact_number is not None:
        vehicle.contact_number = v_in.contact_number
    if v_in.authorization_status is not None:
        vehicle.authorization_status = v_in.authorization_status
    if v_in.notes is not None:
        vehicle.notes = v_in.notes

    if v_in.permit_start_date is not None:
        try:
            vehicle.permit_start_date = datetime.datetime.fromisoformat(v_in.permit_start_date.replace("Z", ""))
        except ValueError:
            pass

    if v_in.permit_expiry_date is not None:
        try:
            vehicle.permit_expiry_date = datetime.datetime.fromisoformat(v_in.permit_expiry_date.replace("Z", ""))
        except ValueError:
            pass

    db.commit()
    db.refresh(vehicle)
    return vehicle.to_dict()


@router.delete("/{id}")
def delete_vehicle(id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    db.delete(vehicle)
    db.commit()
    return {"message": f"Vehicle {vehicle.license_plate} deleted successfully."}
