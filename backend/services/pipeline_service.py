"""
End-to-End Video Processing & Computer Vision Pipeline Service
AI-Powered Construction Site Vehicle & License Plate Monitoring System

STRICT SAFETY SCOPE:
Exclusively vehicle tracking, license plate localization, quality assessment,
multi-frame OCR fusion, authorization lookup, and virtual gate crossing.
Strictly NO PPE, helmet, or worker detection.
"""

import cv2
import os
import uuid
import datetime
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Generator
from sqlalchemy.orm import Session

from backend.config import (
    CROPS_DIR, ENTRY_LINE_Y_RATIO, EXIT_LINE_Y_RATIO,
    DEFAULT_OCR_CONFIDENCE_THRESHOLD, DEFAULT_QUALITY_SCORE_THRESHOLD
)
from backend.database.models import Vehicle, Detection, EntryExitLog, Alert, OCRResult
from backend.detection.vehicle_detector import VehicleDetector
from backend.detection.plate_detector import LicensePlateDetector
from backend.tracking.tracker import VehicleTracker, TrackedVehicle
from backend.ocr.quality_assessor import PlateQualityAssessor
from backend.ocr.preprocessor import PlateImagePreprocessor
from backend.ocr.ocr_engine import LicensePlateOCREngine
from backend.ocr.fusion import MultiFrameOCRFusion


class VideoPipelineService:
    def __init__(self):
        self.vehicle_detector = VehicleDetector()
        self.plate_detector = LicensePlateDetector()
        self.tracker = VehicleTracker()
        self.quality_assessor = PlateQualityAssessor()
        self.preprocessor = PlateImagePreprocessor()
        self.ocr_engine = LicensePlateOCREngine()
        self.fusion_engine = MultiFrameOCRFusion(min_frames_for_lock=3)

        # Active session control
        self.is_running = False
        self.is_paused = False
        self.current_session_id = None
        self.current_video_path = None
        self.frame_index = 0

        # Cache of known plates from DB to speed up live lookup
        self._auth_cache: Dict[str, Dict[str, Any]] = {}

    def start_session(self, video_path: str, session_id: Optional[str] = None):
        self.current_session_id = session_id or str(uuid.uuid4())[:8]
        self.current_video_path = video_path
        self.is_running = True
        self.is_paused = False
        self.frame_index = 0
        self.tracker.reset()
        return self.current_session_id

    def pause_session(self):
        self.is_paused = True

    def resume_session(self):
        self.is_paused = False

    def stop_session(self):
        self.is_running = False
        self.is_paused = False

    def process_frame(
        self,
        frame: np.ndarray,
        db: Session,
        camera_id: str = "Gate-01"
    ) -> Dict[str, Any]:
        """
        Processes a single video frame through the full ANPR and tracking pipeline.
        """
        self.frame_index += 1
        h, w = frame.shape[:2]
        entry_y = int(h * ENTRY_LINE_Y_RATIO)
        exit_y = int(h * EXIT_LINE_Y_RATIO)

        # 1. Vehicle Detection
        raw_detections = self.vehicle_detector.detect(frame)

        # 2. Vehicle Tracking
        tracked_vehicles = self.tracker.update(raw_detections, camera_id=camera_id)

        frame_detections_info = []

        # Annotations copy
        annotated_frame = frame.copy()

        # Draw Virtual Gate Lines
        cv2.line(annotated_frame, (0, entry_y), (w, entry_y), (0, 200, 255), 2)
        cv2.putText(annotated_frame, "ENTRY GATE LINE", (15, entry_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1, cv2.LINE_AA)

        cv2.line(annotated_frame, (0, exit_y), (w, exit_y), (0, 140, 255), 2)
        cv2.putText(annotated_frame, "EXIT GATE LINE", (15, exit_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 160, 255), 1, cv2.LINE_AA)

        for track in tracked_vehicles:
            vx1, vy1, vx2, vy2 = track.bbox
            v_centroid_y = (vy1 + vy2) // 2

            # 3. License Plate Detection & Cropping
            plate_res = self.plate_detector.detect_plate(frame, track.bbox)

            plate_box = None
            plate_crop_url = None
            plate_crop_img = None
            plate_confidence = 0.0

            if plate_res:
                plate_box = plate_res["bbox"]
                plate_confidence = plate_res["confidence"]
                plate_crop_img = plate_res["crop"]

                # 4. Image Quality Assessment
                qa_res = self.quality_assessor.assess_crop(plate_crop_img)
                track.quality_score = qa_res["quality_score"]
                track.quality_status = qa_res["status"]

                # 5. Image Preprocessing (if Moderate or Poor)
                is_poor = qa_res["status"] in ["Moderate", "Poor"]
                processed_crop = self.preprocessor.preprocess_crop(plate_crop_img, is_poor_quality=is_poor)

                # 6. OCR Character Recognition
                ocr_res = self.ocr_engine.recognize(processed_crop, quality_score=qa_res["quality_score"])
                raw_ocr_text = ocr_res["text"]
                raw_ocr_conf = ocr_res["confidence"]
                char_confs = ocr_res["char_confidences"]

                # Save crop image file for inspection
                crop_filename = f"crop_{track.tracking_id}_{self.frame_index}.jpg"
                crop_disk_path = CROPS_DIR / crop_filename
                if not crop_disk_path.exists() and plate_crop_img.size > 0:
                    cv2.imwrite(str(crop_disk_path), plate_crop_img)
                plate_crop_url = f"/api/static/crops/{crop_filename}"
                track.last_plate_crop_path = plate_crop_url

                # 7. Multi-Frame OCR Fusion
                if raw_ocr_text:
                    fusion_result = self.fusion_engine.add_observation(
                        tracking_id=track.tracking_id,
                        frame_number=self.frame_index,
                        raw_text=raw_ocr_text,
                        confidence=raw_ocr_conf,
                        quality_score=qa_res["quality_score"],
                        char_confidences=char_confs
                    )
                    track.license_plate = fusion_result["fused_plate"]
                    track.ocr_confidence = fusion_result["fused_confidence"]
                    track.is_locked = fusion_result["is_locked"]

                    # Persist frame OCR observation to DB
                    try:
                        ocr_db_entry = OCRResult(
                            tracking_id=track.tracking_id,
                            frame_number=self.frame_index,
                            raw_text=raw_ocr_text,
                            confidence=raw_ocr_conf,
                            quality_score=qa_res["quality_score"]
                        )
                        db.add(ocr_db_entry)
                    except Exception:
                        pass
                else:
                    # Low confidence / unreadable OCR
                    track.ocr_confidence = raw_ocr_conf
                    if not track.is_locked:
                        track.license_plate = "READING..."

                # 8. Vehicle Database Lookup & Authorization Decision
                if track.license_plate and track.license_plate not in ["DETECTING...", "READING..."]:
                    auth_info = self._lookup_vehicle(track.license_plate, db)
                    track.authorization_status = auth_info["status"]

                    # Handle Low-Confidence OCR status
                    if track.ocr_confidence < DEFAULT_OCR_CONFIDENCE_THRESHOLD or track.quality_score < DEFAULT_QUALITY_SCORE_THRESHOLD:
                        if auth_info["status"] == "unauthorized":
                            track.authorization_status = "low_confidence"

            # 9. Gate Crossing Detection
            if track.gate_crossed is None:
                # Check crossing from above to below entry line
                if len(track.trajectory) >= 2:
                    prev_cy = track.trajectory[-2][1]
                    curr_cy = track.trajectory[-1][1]
                    if prev_cy < entry_y <= curr_cy:
                        track.gate_crossed = "entry"
                        self._record_gate_event(track, "inside", db, camera_id)
                    elif prev_cy < exit_y <= curr_cy:
                        track.gate_crossed = "exit"
                        self._record_gate_event(track, "exited", db, camera_id)

            # Draw visual bounding boxes on annotated frame
            status_color = (0, 220, 100)  # Green: Authorized
            if track.authorization_status == "unauthorized":
                status_color = (40, 40, 230)  # Red: Unauthorized
            elif track.authorization_status in ["expired", "low_confidence"]:
                status_color = (0, 180, 255)  # Amber / Yellow

            # Vehicle Bounding Box
            cv2.rectangle(annotated_frame, (vx1, vy1), (vx2, vy2), status_color, 2)

            # Header label: ID + Type
            header_text = f"{track.tracking_id} | {track.vehicle_type}"
            cv2.putText(annotated_frame, header_text, (vx1 + 6, vy1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.52, status_color, 2, cv2.LINE_AA)

            # Plate Box and Text
            if plate_box:
                px1, py1, px2, py2 = plate_box
                cv2.rectangle(annotated_frame, (px1, py1), (px2, py2), (255, 255, 255), 2)
                plate_label = f"{track.license_plate} ({int(track.ocr_confidence * 100)}%)"
                cv2.putText(annotated_frame, plate_label, (px1, py1 - 6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1, cv2.LINE_AA)

            # Status badge icon
            auth_tag = track.authorization_status.upper()
            cv2.putText(annotated_frame, f"[{auth_tag}]", (vx2 - 100, vy1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, status_color, 2, cv2.LINE_AA)

            frame_detections_info.append({
                "tracking_id": track.tracking_id,
                "vehicle_type": track.vehicle_type,
                "bbox_vehicle": [vx1, vy1, vx2, vy2],
                "bbox_plate": plate_box,
                "license_plate": track.license_plate,
                "ocr_confidence": round(track.ocr_confidence, 3),
                "quality_score": round(track.quality_score, 1),
                "quality_status": track.quality_status,
                "authorization_status": track.authorization_status,
                "plate_crop_path": track.last_plate_crop_path,
                "is_locked": track.is_locked
            })

        db.commit()

        return {
            "frame_number": self.frame_index,
            "session_id": self.current_session_id,
            "camera_id": camera_id,
            "active_vehicles_count": len(tracked_vehicles),
            "detections": frame_detections_info,
            "annotated_frame": annotated_frame
        }

    def _lookup_vehicle(self, plate: str, db: Session) -> Dict[str, Any]:
        """Look up plate in vehicle database and verify permit validity."""
        clean_plate = plate.replace(" ", "").replace("-", "").upper()
        
        # Check cache first
        if clean_plate in self._auth_cache:
            return self._auth_cache[clean_plate]

        vehicle = db.query(Vehicle).filter(Vehicle.license_plate == clean_plate).first()
        now = datetime.datetime.utcnow()

        if not vehicle:
            res = {"status": "unauthorized", "vehicle": None}
            # Record unauthorized alert if not already recently alerted
            self._create_alert(clean_plate, "unauthorized_vehicle", "high",
                               f"Vehicle {clean_plate} detected without registration in site database.", db)
        else:
            if vehicle.permit_expiry_date and vehicle.permit_expiry_date < now:
                res = {"status": "expired", "vehicle": vehicle.to_dict()}
                self._create_alert(clean_plate, "expired_permit", "medium",
                                   f"Vehicle {clean_plate} permit expired on {vehicle.permit_expiry_date.strftime('%Y-%m-%d')}.", db)
            else:
                res = {"status": "authorized", "vehicle": vehicle.to_dict()}

        self._auth_cache[clean_plate] = res
        return res

    def _create_alert(self, plate: str, alert_type: str, severity: str, message: str, db: Session):
        """Creates alert if duplicate alert was not already generated recently."""
        recent = db.query(Alert).filter(
            Alert.license_plate == plate,
            Alert.alert_type == alert_type,
            Alert.status.in_(["new", "reviewed"])
        ).first()
        if not recent:
            alert = Alert(
                alert_type=alert_type,
                severity=severity,
                license_plate=plate,
                camera_id="Gate-01",
                message=message,
                status="new"
            )
            db.add(alert)
            db.commit()

    def _record_gate_event(self, track: TrackedVehicle, status: str, db: Session, camera_id: str):
        """Records entry or exit event and calculates site stay duration."""
        now = datetime.datetime.utcnow()
        clean_plate = track.license_plate

        if status == "inside":
            # New entry log
            log = EntryExitLog(
                vehicle_id=track.tracking_id,
                license_plate=clean_plate,
                vehicle_type=track.vehicle_type,
                camera_id=camera_id,
                entry_time=now,
                status="inside",
                authorization_status=track.authorization_status,
                snapshot_path=track.last_plate_crop_path
            )
            db.add(log)
        elif status == "exited":
            # Find open entry log
            open_log = db.query(EntryExitLog).filter(
                EntryExitLog.license_plate == clean_plate,
                EntryExitLog.status == "inside"
            ).order_by(EntryExitLog.entry_time.desc()).first()

            if open_log:
                open_log.exit_time = now
                duration = int((now - open_log.entry_time).total_seconds() / 60)
                open_log.duration_minutes = max(1, duration)
                open_log.status = "exited"
            else:
                log = EntryExitLog(
                    vehicle_id=track.tracking_id,
                    license_plate=clean_plate,
                    vehicle_type=track.vehicle_type,
                    camera_id=camera_id,
                    entry_time=now - datetime.timedelta(minutes=45),
                    exit_time=now,
                    duration_minutes=45,
                    status="exited",
                    authorization_status=track.authorization_status,
                    snapshot_path=track.last_plate_crop_path
                )
                db.add(log)
        db.commit()


# Singleton pipeline service instance
pipeline_service = VideoPipelineService()
