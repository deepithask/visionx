"""
Database Seeder with Realistic Construction Site Data
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

import datetime
from sqlalchemy.orm import Session
from backend.database.models import Vehicle, Detection, EntryExitLog, Alert, Camera, OCRResult
from backend.database.db import engine, Base


def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # If vehicles already exist, skip re-seeding
    if db.query(Vehicle).first() is not None:
        return

    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=6, minute=0, second=0, microsecond=0)

    # 1. Cameras
    cameras = [
        Camera(id="Gate-01", name="Main North Gate (Inbound/Outbound)", location="North Perimeter Gate", status="active", fps=30),
        Camera(id="Gate-02", name="South Heavy Materials Gate", location="South Service Road", status="active", fps=30),
        Camera(id="Gate-03", name="Loading & Concrete Batching Zone", location="Zone C Central Yard", status="active", fps=30),
    ]
    db.add_all(cameras)

    # 2. Vehicles (Database of registered contractors, authorizations, and permits)
    vehicles = [
        Vehicle(
            vehicle_id="V-SITE-001",
            license_plate="TN38AB1234",
            vehicle_type="Dump Truck",
            company="Apex Infrastructure Ltd",
            driver_name="Rajesh Kumar",
            contact_number="+91 98450 11223",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=90),
            permit_expiry_date=now + datetime.timedelta(days=180),
            notes="Primary gravel & aggregate transporter"
        ),
        Vehicle(
            vehicle_id="V-SITE-002",
            license_plate="MH12DE4567",
            vehicle_type="Concrete Mixer",
            company="Titan Ready-Mix Concrete",
            driver_name="Sunil Patil",
            contact_number="+91 98220 33445",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=60),
            permit_expiry_date=now + datetime.timedelta(days=120),
            notes="Scheduled pouring batches 1 & 2"
        ),
        Vehicle(
            vehicle_id="V-SITE-003",
            license_plate="KA03MF7890",
            vehicle_type="Heavy Flatbed",
            company="BuildCorp Heavy Works",
            driver_name="Manoj Gowda",
            contact_number="+91 98800 55667",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=120),
            permit_expiry_date=now + datetime.timedelta(days=60),
            notes="Steel rebar delivery contractor"
        ),
        Vehicle(
            vehicle_id="V-SITE-004",
            license_plate="DL01CA2468",
            vehicle_type="Site Supervisor Pickup",
            company="Apex Infrastructure Ltd",
            driver_name="Vikram Singh",
            contact_number="+91 98110 77889",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=180),
            permit_expiry_date=now + datetime.timedelta(days=365),
            notes="Site Engineer & Safety Officer vehicle"
        ),
        Vehicle(
            vehicle_id="V-SITE-005",
            license_plate="KL07BN1357",
            vehicle_type="Excavator Lowboy",
            company="Metro Earthmovers Co",
            driver_name="Abdul Rahman",
            contact_number="+91 98470 99001",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=45),
            permit_expiry_date=now + datetime.timedelta(days=200),
            notes="Foundation excavation crew"
        ),
        Vehicle(
            vehicle_id="V-SITE-006",
            license_plate="TN09BQ9988",
            vehicle_type="Tipper Truck",
            company="Premier Earth Logistics",
            driver_name="Dhanush Selvam",
            contact_number="+91 98400 12345",
            authorization_status="expired",  # Expired permit test case!
            permit_start_date=now - datetime.timedelta(days=180),
            permit_expiry_date=now - datetime.timedelta(days=5),
            notes="Permit expired on 13-Sept. Renewal pending payment."
        ),
        Vehicle(
            vehicle_id="V-SITE-007",
            license_plate="HR26DK5544",
            vehicle_type="Material Van",
            company="Zenith Electricals Site Subcontractor",
            driver_name="Amit Sharma",
            contact_number="+91 98100 45678",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=30),
            permit_expiry_date=now + datetime.timedelta(days=90),
            notes="Cabling and electrical conduits"
        ),
        Vehicle(
            vehicle_id="V-SITE-008",
            license_plate="KA05NB3322",
            vehicle_type="Water Tanker",
            company="Apex Infrastructure Ltd",
            driver_name="Basavaraj K",
            contact_number="+91 98860 67890",
            authorization_status="authorized",
            permit_start_date=now - datetime.timedelta(days=300),
            permit_expiry_date=now + datetime.timedelta(days=65),
            notes="Dust suppression and concrete curing"
        ),
    ]
    db.add_all(vehicles)
    db.commit()

    # 3. Entry & Exit Logs (Past and current visits)
    logs = [
        # Inside currently
        EntryExitLog(
            vehicle_id="V-SITE-001",
            license_plate="TN38AB1234",
            vehicle_type="Dump Truck",
            company="Apex Infrastructure Ltd",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(minutes=95),
            exit_time=None,
            duration_minutes=None,
            status="inside",
            authorization_status="authorized",
        ),
        EntryExitLog(
            vehicle_id="V-SITE-002",
            license_plate="MH12DE4567",
            vehicle_type="Concrete Mixer",
            company="Titan Ready-Mix Concrete",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(minutes=42),
            exit_time=None,
            duration_minutes=None,
            status="inside",
            authorization_status="authorized",
        ),
        EntryExitLog(
            vehicle_id="V-SITE-004",
            license_plate="DL01CA2468",
            vehicle_type="Site Supervisor Pickup",
            company="Apex Infrastructure Ltd",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(hours=3, minutes=15),
            exit_time=None,
            duration_minutes=None,
            status="inside",
            authorization_status="authorized",
        ),
        # Completed visits earlier today
        EntryExitLog(
            vehicle_id="V-SITE-003",
            license_plate="KA03MF7890",
            vehicle_type="Heavy Flatbed",
            company="BuildCorp Heavy Works",
            camera_id="Gate-02",
            entry_time=now - datetime.timedelta(hours=4, minutes=30),
            exit_time=now - datetime.timedelta(hours=2, minutes=50),
            duration_minutes=100,
            status="exited",
            authorization_status="authorized",
        ),
        EntryExitLog(
            vehicle_id="V-SITE-005",
            license_plate="KL07BN1357",
            vehicle_type="Excavator Lowboy",
            company="Metro Earthmovers Co",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(hours=5),
            exit_time=now - datetime.timedelta(hours=3, minutes=40),
            duration_minutes=80,
            status="exited",
            authorization_status="authorized",
        ),
        EntryExitLog(
            vehicle_id="V-SITE-008",
            license_plate="KA05NB3322",
            vehicle_type="Water Tanker",
            company="Apex Infrastructure Ltd",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(hours=6),
            exit_time=now - datetime.timedelta(hours=5, minutes=10),
            duration_minutes=50,
            status="exited",
            authorization_status="authorized",
        ),
        # Unauthorized vehicle visit recorded
        EntryExitLog(
            vehicle_id=None,
            license_plate="TN40XX9999",
            vehicle_type="Unregistered Tipper",
            company="Unknown Contractor",
            camera_id="Gate-01",
            entry_time=now - datetime.timedelta(hours=1, minutes=20),
            exit_time=now - datetime.timedelta(minutes=55),
            duration_minutes=25,
            status="exited",
            authorization_status="unauthorized",
        ),
        # Expired permit vehicle attempt
        EntryExitLog(
            vehicle_id="V-SITE-006",
            license_plate="TN09BQ9988",
            vehicle_type="Tipper Truck",
            company="Premier Earth Logistics",
            camera_id="Gate-02",
            entry_time=now - datetime.timedelta(minutes=30),
            exit_time=now - datetime.timedelta(minutes=15),
            duration_minutes=15,
            status="exited",
            authorization_status="expired",
        ),
    ]
    db.add_all(logs)

    # 4. Alerts
    alerts = [
        Alert(
            alert_type="unauthorized_vehicle",
            severity="high",
            license_plate="TN40XX9999",
            camera_id="Gate-01",
            message="Vehicle TN40XX9999 entered Gate-01 but is not registered in the site database.",
            status="new",
            created_at=now - datetime.timedelta(hours=1, minutes=20)
        ),
        Alert(
            alert_type="expired_permit",
            severity="medium",
            vehicle_id="V-SITE-006",
            license_plate="TN09BQ9988",
            camera_id="Gate-02",
            message="Vehicle TN09BQ9988 (Premier Earth Logistics) permit expired 5 days ago (13-Sept-2026).",
            status="new",
            created_at=now - datetime.timedelta(minutes=30)
        ),
        Alert(
            alert_type="low_confidence_ocr",
            severity="low",
            license_plate="TN38AB????",
            camera_id="Gate-01",
            message="License plate obstructed by dust/mud. Laplacian variance score 24.3 (Poor). Marked for review.",
            status="reviewed",
            reviewed_by="supervisor_1",
            created_at=now - datetime.timedelta(hours=2, minutes=10)
        ),
        Alert(
            alert_type="repeated_failed_recognition",
            severity="medium",
            license_plate="UNKNOWN-REF-12",
            camera_id="Gate-03",
            message="Multiple consecutive frames failed OCR confidence threshold (below 45%). Preprocessing applied.",
            status="resolved",
            reviewed_by="admin",
            created_at=now - datetime.timedelta(hours=5, minutes=15),
            resolved_at=now - datetime.timedelta(hours=4)
        )
    ]
    db.add_all(alerts)

    # 5. Detections & OCR Fusion Samples
    detections = [
        Detection(
            session_id="session-live-01",
            tracking_id="V023",
            camera_id="Gate-01",
            vehicle_type="Dump Truck",
            license_plate="TN38AB1234",
            raw_plate="TN38AB1234",
            ocr_confidence=0.965,
            quality_score=88.4,
            quality_status="Good",
            authorization_status="authorized",
            bbox_vehicle="140,110,580,420",
            bbox_plate="320,360,450,395",
            frame_number=145,
            is_fused=True,
            frames_fused_count=5,
            timestamp=now - datetime.timedelta(minutes=95)
        ),
        Detection(
            session_id="session-live-01",
            tracking_id="V024",
            camera_id="Gate-01",
            vehicle_type="Concrete Mixer",
            license_plate="MH12DE4567",
            raw_plate="MH12DE4567",
            ocr_confidence=0.942,
            quality_score=82.1,
            quality_status="Good",
            authorization_status="authorized",
            bbox_vehicle="110,95,540,410",
            bbox_plate="285,340,410,380",
            frame_number=210,
            is_fused=True,
            frames_fused_count=4,
            timestamp=now - datetime.timedelta(minutes=42)
        ),
        Detection(
            session_id="session-live-01",
            tracking_id="V025",
            camera_id="Gate-01",
            vehicle_type="Tipper Truck",
            license_plate="TN40XX9999",
            raw_plate="TN40XX9999",
            ocr_confidence=0.915,
            quality_score=78.6,
            quality_status="Good",
            authorization_status="unauthorized",
            bbox_vehicle="130,120,560,430",
            bbox_plate="310,365,435,400",
            frame_number=330,
            is_fused=True,
            frames_fused_count=4,
            timestamp=now - datetime.timedelta(hours=1, minutes=20)
        ),
    ]
    db.add_all(detections)

    # 6. Sample OCR results demonstrating Multi-Frame Fusion
    ocr_frames = [
        OCRResult(tracking_id="V023", frame_number=141, raw_text="TN38AB?234", confidence=0.88, quality_score=76.0, char_confidences='{"T":0.99,"N":0.98,"3":0.97,"8":0.95,"A":0.94,"B":0.92,"?":0.40,"2":0.96,"3":0.98,"4":0.99}'),
        OCRResult(tracking_id="V023", frame_number=142, raw_text="TN38AB1234", confidence=0.95, quality_score=84.0, char_confidences='{"T":0.99,"N":0.99,"3":0.98,"8":0.97,"A":0.96,"B":0.95,"1":0.93,"2":0.97,"3":0.99,"4":0.99}'),
        OCRResult(tracking_id="V023", frame_number=143, raw_text="TN38AB1234", confidence=0.97, quality_score=89.0, char_confidences='{"T":0.99,"N":0.99,"3":0.99,"8":0.98,"A":0.98,"B":0.97,"1":0.96,"2":0.98,"3":0.99,"4":0.99}'),
        OCRResult(tracking_id="V023", frame_number=144, raw_text="TN38A?1234", confidence=0.89, quality_score=79.0, char_confidences='{"T":0.99,"N":0.98,"3":0.97,"8":0.96,"A":0.94,"?":0.45,"1":0.95,"2":0.97,"3":0.98,"4":0.99}'),
        OCRResult(tracking_id="V023", frame_number=145, raw_text="TN38AB1234", confidence=0.97, quality_score=91.0, char_confidences='{"T":0.99,"N":0.99,"3":0.99,"8":0.98,"A":0.98,"B":0.97,"1":0.97,"2":0.98,"3":0.99,"4":0.99}'),
    ]
    db.add_all(ocr_frames)

    db.commit()
