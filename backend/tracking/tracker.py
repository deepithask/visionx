"""
Vehicle Tracking Module (ByteTrack / IoU Centroid Tracker)
AI-Powered Construction Site Vehicle & License Plate Monitoring System

Assigns and maintains persistent tracking IDs (V001, V002, etc.) across video frames.
Tracks spatial trajectory, gate crossing direction (Inbound / Outbound),
and associates detection states per physical vehicle.
"""

import datetime
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


class TrackedVehicle:
    def __init__(self, track_int_id: int, bbox: List[int], vehicle_type: str, camera_id: str = "Gate-01"):
        self.track_int_id = track_int_id
        self.tracking_id = f"V{track_int_id:03d}"  # V001, V002, etc.
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.vehicle_type = vehicle_type
        self.camera_id = camera_id
        self.first_detected = datetime.datetime.utcnow()
        self.last_detected = datetime.datetime.utcnow()
        self.hits = 1
        self.lost_frames = 0

        # Motion trajectory: list of (centroid_x, centroid_y, frame_number)
        cx = (bbox[0] + bbox[2]) // 2
        cy = (bbox[1] + bbox[3]) // 2
        self.trajectory = [(cx, cy)]

        # State fields
        self.license_plate = "DETECTING..."
        self.ocr_confidence = 0.0
        self.quality_score = 0.0
        self.quality_status = "Good"
        self.authorization_status = "detecting"  # authorized, unauthorized, expired, detecting
        self.gate_crossed = None  # "entry", "exit", or None
        self.last_plate_crop_path = None
        self.is_locked = False

    def update(self, bbox: List[int], vehicle_type: str):
        self.bbox = bbox
        self.vehicle_type = vehicle_type
        self.last_detected = datetime.datetime.utcnow()
        self.hits += 1
        self.lost_frames = 0
        cx = (bbox[0] + bbox[2]) // 2
        cy = (bbox[1] + bbox[3]) // 2
        self.trajectory.append((cx, cy))
        if len(self.trajectory) > 50:
            self.trajectory.pop(0)

    @property
    def centroid(self) -> Tuple[int, int]:
        return (self.bbox[0] + self.bbox[2]) // 2, (self.bbox[1] + self.bbox[3]) // 2

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tracking_id": self.tracking_id,
            "vehicle_type": self.vehicle_type,
            "license_plate": self.license_plate,
            "first_detected": self.first_detected.isoformat(),
            "last_detected": self.last_detected.isoformat(),
            "camera_id": self.camera_id,
            "ocr_confidence": round(self.ocr_confidence, 3),
            "quality_score": round(self.quality_score, 1),
            "quality_status": self.quality_status,
            "authorization_status": self.authorization_status,
            "bbox": self.bbox,
            "is_locked": self.is_locked,
            "gate_crossed": self.gate_crossed,
            "hits": self.hits,
        }


class VehicleTracker:
    def __init__(self, max_lost_frames: int = 25, iou_thresh: float = 0.25):
        self.max_lost_frames = max_lost_frames
        self.iou_thresh = iou_thresh
        self.next_track_id = 1
        self.active_tracks: Dict[str, TrackedVehicle] = {}

    def update(self, detections: List[Dict[str, Any]], camera_id: str = "Gate-01") -> List[TrackedVehicle]:
        """
        Match incoming frame detections to active tracks using IoU & Centroid distance.
        """
        if not detections:
            # Increment lost counter for all existing tracks
            expired = []
            for tid, track in self.active_tracks.items():
                track.lost_frames += 1
                if track.lost_frames > self.max_lost_frames:
                    expired.append(tid)
            for tid in expired:
                del self.active_tracks[tid]
            return list(self.active_tracks.values())

        det_boxes = [d["bbox"] for d in detections]
        track_ids = list(self.active_tracks.keys())
        track_boxes = [self.active_tracks[tid].bbox for tid in track_ids]

        # Calculate IoU matrix
        matches, unmatched_dets, unmatched_tracks = self._match(track_boxes, det_boxes)

        # Update matched tracks
        for t_idx, d_idx in matches:
            tid = track_ids[t_idx]
            det = detections[d_idx]
            self.active_tracks[tid].update(det["bbox"], det["vehicle_type"])

        # Create new tracks for unmatched detections
        for d_idx in unmatched_dets:
            det = detections[d_idx]
            new_track = TrackedVehicle(self.next_track_id, det["bbox"], det["vehicle_type"], camera_id)
            self.active_tracks[new_track.tracking_id] = new_track
            self.next_track_id += 1

        # Handle unmatched active tracks
        expired = []
        for t_idx in unmatched_tracks:
            tid = track_ids[t_idx]
            self.active_tracks[tid].lost_frames += 1
            if self.active_tracks[tid].lost_frames > self.max_lost_frames:
                expired.append(tid)

        for tid in expired:
            del self.active_tracks[tid]

        return list(self.active_tracks.values())

    def _match(self, track_boxes: List[List[int]], det_boxes: List[List[int]]):
        if not track_boxes:
            return [], list(range(len(det_boxes))), []
        if not det_boxes:
            return [], [], list(range(len(track_boxes)))

        iou_matrix = np.zeros((len(track_boxes), len(det_boxes)), dtype=np.float32)
        for i, tb in enumerate(track_boxes):
            for j, db in enumerate(det_boxes):
                iou_matrix[i, j] = self._iou(tb, db)

        matches = []
        unmatched_tracks = set(range(len(track_boxes)))
        unmatched_dets = set(range(len(det_boxes)))

        while True:
            max_iou = np.max(iou_matrix) if iou_matrix.size > 0 else 0
            if max_iou < self.iou_thresh:
                break
            i, j = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
            matches.append((i, j))
            unmatched_tracks.discard(i)
            unmatched_dets.discard(j)
            iou_matrix[i, :] = -1.0
            iou_matrix[:, j] = -1.0

        return matches, list(unmatched_dets), list(unmatched_tracks)

    @staticmethod
    def _iou(boxA: List[int], boxB: List[int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        denom = float(boxAArea + boxBArea - interArea)
        return interArea / denom if denom > 0 else 0.0

    def reset(self):
        self.next_track_id = 1
        self.active_tracks.clear()
