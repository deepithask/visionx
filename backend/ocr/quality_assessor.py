"""
Image Quality Assessment Module
AI-Powered Construction Site Vehicle & License Plate Monitoring System

Construction CCTV footage often suffers from:
- Dust and mud splatters on plates
- Motion blur from vehicle movement
- Glare from direct sun or site floodlights
- Low light at dusk/dawn/night
- Poor resolution or distance

This module computes:
1. Blur Score (Laplacian variance)
2. Brightness Score (Mean pixel intensity penalty)
3. Contrast Score (Standard deviation / RMS contrast)
4. Resolution Score (Pixel dimensions)
-> Aggregate Quality Score (0 - 100%) and Status ("Good", "Moderate", "Poor")
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple


class PlateQualityAssessor:
    def __init__(
        self,
        blur_thresh: float = 100.0,
        min_width: int = 60,
        min_height: int = 18,
        poor_thresh: float = 45.0
    ):
        self.blur_thresh = blur_thresh
        self.min_width = min_width
        self.min_height = min_height
        self.poor_thresh = poor_thresh

    def assess_crop(self, plate_image: np.ndarray) -> Dict[str, Any]:
        """
        Assess an isolated license plate crop image.
        Returns detailed metric breakdown and aggregate quality score.
        """
        if plate_image is None or plate_image.size == 0:
            return {
                "quality_score": 0.0,
                "status": "Poor",
                "blur_score": 0.0,
                "brightness_score": 0.0,
                "contrast_score": 0.0,
                "resolution_score": 0.0,
                "is_blurred": True,
                "is_low_light": True,
                "is_glare": False,
                "details": "Empty or corrupted plate crop"
            }

        h, w = plate_image.shape[:2]

        # Convert to grayscale if needed
        if len(plate_image.shape) == 3:
            gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = plate_image

        # 1. Blur calculation via Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        # Scale: 0 to 250+ maps to 0 to 100%
        blur_score = min(100.0, max(0.0, (laplacian_var / self.blur_thresh) * 75.0))
        is_blurred = laplacian_var < self.blur_thresh

        # 2. Brightness calculation (0 to 255)
        # Optimal brightness range is 80 - 180
        mean_brightness = float(np.mean(gray))
        if 80 <= mean_brightness <= 180:
            brightness_score = 100.0
        elif mean_brightness < 80:
            brightness_score = max(10.0, (mean_brightness / 80.0) * 100.0)
        else:
            brightness_score = max(10.0, ((255.0 - mean_brightness) / 75.0) * 100.0)

        is_low_light = mean_brightness < 60
        is_glare = mean_brightness > 215

        # 3. Contrast calculation (standard deviation of pixel intensities)
        # High contrast between plate background and black characters is essential
        std_contrast = float(np.std(gray))
        # Good contrast std is typically >= 40
        contrast_score = min(100.0, max(0.0, (std_contrast / 45.0) * 100.0))

        # 4. Resolution score
        # Target plate dimensions >= 120 x 36
        w_ratio = min(1.0, w / 120.0)
        h_ratio = min(1.0, h / 36.0)
        resolution_score = (w_ratio * 0.6 + h_ratio * 0.4) * 100.0

        # Weighted aggregate score
        # Blur and contrast are most critical for character segmentation
        overall_score = (
            blur_score * 0.35 +
            contrast_score * 0.30 +
            brightness_score * 0.20 +
            resolution_score * 0.15
        )
        overall_score = round(min(100.0, max(0.0, overall_score)), 1)

        # Status categorization
        if overall_score >= 70.0:
            status = "Good"
        elif overall_score >= self.poor_thresh:
            status = "Moderate"
        else:
            status = "Poor"

        details = []
        if is_blurred:
            details.append("Motion/lens blur detected")
        if is_low_light:
            details.append("Low illumination")
        if is_glare:
            details.append("High specular reflection / glare")
        if w < self.min_width or h < self.min_height:
            details.append("Low pixel resolution")
        if not details:
            details.append("Optimal plate image quality")

        return {
            "quality_score": overall_score,
            "status": status,
            "blur_score": round(blur_score, 1),
            "laplacian_var": round(laplacian_var, 1),
            "brightness_score": round(brightness_score, 1),
            "mean_brightness": round(mean_brightness, 1),
            "contrast_score": round(contrast_score, 1),
            "resolution_score": round(resolution_score, 1),
            "resolution": f"{w}x{h}",
            "is_blurred": is_blurred,
            "is_low_light": is_low_light,
            "is_glare": is_glare,
            "details": ", ".join(details)
        }
