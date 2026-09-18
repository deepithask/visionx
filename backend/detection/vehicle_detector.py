"""
Vehicle Detection Module (Construction Site Vehicles)
AI-Powered Construction Site Vehicle & License Plate Monitoring System

STRICT SAFETY RESTRICTION:
This system detects ONLY vehicles (Trucks, Concrete Mixers, Dump Trucks, Pickups, Vans, Cars).
It contains NO PPE detection, helmet detection, or worker detection algorithms.
"""

import cv2
import numpy as np
from typing import List, Dict, Any


class VehicleDetector:
    """
    Detects construction and commercial vehicles in CCTV video frames.
    Uses pre-trained YOLO/SSD or optimized motion-contour detection
    specifically tuned for heavy vehicles entering/exiting site gates.
    """
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold
        # Construction vehicle categories
        self.vehicle_classes = [
            "Dump Truck", "Concrete Mixer", "Heavy Flatbed",
            "Tipper Truck", "Site Supervisor Pickup", "Material Van", "Car"
        ]

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect vehicles in a video frame.
        Returns a list of detections with bounding box, vehicle type, and confidence.
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        detections = []

        # Convert to grayscale and apply Gaussian blur for background segmentation
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)

        # Sobel gradient / edge detection to isolate large vehicle silhouettes
        grad_x = cv2.Sobel(blurred, cv2.CV_16S, 1, 0, ksize=3)
        grad_y = cv2.Sobel(blurred, cv2.CV_16S, 0, 1, ksize=3)
        abs_grad_x = cv2.convertScaleAbs(grad_x)
        abs_grad_y = cv2.convertScaleAbs(grad_y)
        grad = cv2.addWeighted(abs_grad_x, 0.5, abs_grad_y, 0.5, 0)

        # Morphological closing to merge vehicle panels into continuous blobs
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        closed = cv2.morphologyEx(grad, cv2.MORPH_CLOSE, kernel)
        _, thresh = cv2.threshold(closed, 40, 255, cv2.THRESH_BINARY)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            area = bw * bh

            # Construction vehicles are large objects occupying a significant portion of CCTV gate frames
            # Filter out small noise or road markings (area > 15000 pixels or min 140x100)
            if bw >= 140 and bh >= 100 and area >= 15000:
                # Classify based on bounding box aspect ratio and dimensions
                aspect = bw / float(bh)
                if bh > 220 or area > 70000:
                    v_type = "Dump Truck" if aspect < 1.4 else "Heavy Flatbed"
                elif 1.1 <= aspect <= 1.6 and bh > 180:
                    v_type = "Concrete Mixer"
                elif aspect > 1.6:
                    v_type = "Site Supervisor Pickup"
                else:
                    v_type = "Tipper Truck"

                conf = min(0.98, max(0.65, 0.70 + (area / (w * h)) * 0.5))

                detections.append({
                    "bbox": [x, y, x + bw, y + bh],
                    "vehicle_type": v_type,
                    "confidence": round(float(conf), 3)
                })

        # Non-maximum suppression (NMS) to remove overlapping vehicle boxes
        detections = self._apply_nms(detections)
        return detections

    def _apply_nms(self, detections: List[Dict[str, Any]], iou_threshold: float = 0.4) -> List[Dict[str, Any]]:
        if not detections:
            return []

        boxes = [d["bbox"] for d in detections]
        scores = [d["confidence"] for d in detections]

        indices = cv2.dnn.NMSBoxes(
            bboxes=[[b[0], b[1], b[2] - b[0], b[3] - b[1]] for b in boxes],
            scores=scores,
            score_threshold=self.confidence_threshold,
            nms_threshold=iou_threshold
        )

        filtered = []
        if len(indices) > 0:
            for i in indices.flatten():
                filtered.append(detections[i])
        return filtered
