"""
SQLAlchemy ORM Data Models
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.database.db import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), unique=True, index=True, nullable=False)
    license_plate = Column(String(20), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # Truck, Concrete Mixer, Dump Truck, Van, etc.
    company = Column(String(100), nullable=False)      # Apex Infrastructure, Titan Cement, etc.
    driver_name = Column(String(100), nullable=True)
    contact_number = Column(String(30), nullable=True)
    authorization_status = Column(String(20), default="authorized", index=True)  # authorized, unauthorized, expired
    permit_start_date = Column(DateTime, nullable=True)
    permit_expiry_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "license_plate": self.license_plate,
            "vehicle_type": self.vehicle_type,
            "company": self.company,
            "driver_name": self.driver_name,
            "contact_number": self.contact_number,
            "authorization_status": self.authorization_status,
            "permit_start_date": self.permit_start_date.isoformat() if self.permit_start_date else None,
            "permit_expiry_date": self.permit_expiry_date.isoformat() if self.permit_expiry_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), index=True, nullable=True)
    tracking_id = Column(String(20), index=True, nullable=False)  # V001, V002
    camera_id = Column(String(50), default="Gate-01", index=True)
    vehicle_type = Column(String(50), nullable=False)
    license_plate = Column(String(20), index=True, nullable=False)
    raw_plate = Column(String(20), nullable=True)
    ocr_confidence = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    quality_status = Column(String(20), default="Good")  # Good, Moderate, Poor
    authorization_status = Column(String(20), default="authorized")  # authorized, unauthorized, expired, low_confidence
    bbox_vehicle = Column(String(100), nullable=True)  # "x1,y1,x2,y2"
    bbox_plate = Column(String(100), nullable=True)    # "x1,y1,x2,y2"
    plate_crop_path = Column(String(255), nullable=True)
    frame_number = Column(Integer, default=0)
    is_fused = Column(Boolean, default=False)
    frames_fused_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "tracking_id": self.tracking_id,
            "camera_id": self.camera_id,
            "vehicle_type": self.vehicle_type,
            "license_plate": self.license_plate,
            "raw_plate": self.raw_plate,
            "ocr_confidence": round(self.ocr_confidence, 3),
            "quality_score": round(self.quality_score, 1),
            "quality_status": self.quality_status,
            "authorization_status": self.authorization_status,
            "bbox_vehicle": self.bbox_vehicle,
            "bbox_plate": self.bbox_plate,
            "plate_crop_path": self.plate_crop_path,
            "frame_number": self.frame_number,
            "is_fused": self.is_fused,
            "frames_fused_count": self.frames_fused_count,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class OCRResult(Base):
    """Stores per-frame OCR attempts for multi-frame fusion breakdown"""
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(20), index=True, nullable=False)
    frame_number = Column(Integer, nullable=False)
    raw_text = Column(String(20), nullable=False)
    confidence = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    char_confidences = Column(Text, nullable=True)  # JSON formatted character weights
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "tracking_id": self.tracking_id,
            "frame_number": self.frame_number,
            "raw_text": self.raw_text,
            "confidence": round(self.confidence, 3),
            "quality_score": round(self.quality_score, 1),
            "char_confidences": self.char_confidences,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class EntryExitLog(Base):
    __tablename__ = "entry_exit_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), nullable=True, index=True)
    license_plate = Column(String(20), nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False)
    company = Column(String(100), nullable=True)
    camera_id = Column(String(50), default="Gate-01")
    entry_time = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    exit_time = Column(DateTime, nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(String(20), default="inside", index=True)  # inside, exited
    authorization_status = Column(String(20), default="authorized")  # authorized, unauthorized, expired
    snapshot_path = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "license_plate": self.license_plate,
            "vehicle_type": self.vehicle_type,
            "company": self.company,
            "camera_id": self.camera_id,
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "duration_minutes": self.duration_minutes,
            "status": self.status,
            "authorization_status": self.authorization_status,
            "snapshot_path": self.snapshot_path,
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # unauthorized_vehicle, expired_permit, low_confidence_ocr, unreadable_plate, repeated_failed_recognition
    severity = Column(String(20), default="medium")  # high, medium, low
    vehicle_id = Column(String(50), nullable=True)
    license_plate = Column(String(20), nullable=True, index=True)
    camera_id = Column(String(50), default="Gate-01")
    message = Column(Text, nullable=False)
    snapshot_path = Column(String(255), nullable=True)
    status = Column(String(20), default="new", index=True)  # new, reviewed, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "vehicle_id": self.vehicle_id,
            "license_plate": self.license_plate,
            "camera_id": self.camera_id,
            "message": self.message,
            "snapshot_path": self.snapshot_path,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "reviewed_by": self.reviewed_by,
        }


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    status = Column(String(20), default="active")  # active, offline
    fps = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "status": self.status,
            "fps": self.fps,
        }
