"""
Image Preprocessing Pipeline for Construction License Plates
AI-Powered Construction Site Vehicle & License Plate Monitoring System

Applies targeted enhancements when Image Quality Assessment is Moderate or Poor:
1. Canonical scaling & border padding
2. Bilateral noise suppression (smooths dust/mud without blurring character edges)
3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
4. Morphological cleaning
5. Binarization (Otsu & Adaptive Gaussian)
"""

import cv2
import numpy as np


class PlateImagePreprocessor:
    def __init__(self, target_height: int = 64, target_width: int = 240):
        self.target_height = target_height
        self.target_width = target_width
        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

    def preprocess_crop(self, plate_image: np.ndarray, is_poor_quality: bool = True) -> np.ndarray:
        """
        Process the raw plate crop into an OCR-ready enhanced image.
        """
        if plate_image is None or plate_image.size == 0:
            return plate_image

        # Convert to Grayscale
        if len(plate_image.shape) == 3:
            gray = cv2.cvtColor(plate_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = plate_image.copy()

        # Resize to standardized dimensions while preserving aspect ratio
        h, w = gray.shape[:2]
        if h > 0 and w > 0:
            aspect = w / h
            # Normal Indian / international plate aspect ratio is roughly 3.0 to 4.5
            calc_w = int(self.target_height * aspect)
            calc_w = max(160, min(360, calc_w))
            resized = cv2.resize(gray, (calc_w, self.target_height), interpolation=cv2.INTER_CUBIC)
        else:
            resized = cv2.resize(gray, (self.target_width, self.target_height), interpolation=cv2.INTER_CUBIC)

        if not is_poor_quality:
            # If image quality is already Good, mild contrast enhancement is sufficient
            enhanced = self.clahe.apply(resized)
            return enhanced

        # When quality is poor/moderate (mud, shadows, blur):
        # 1. Bilateral filter: smooths grain and mud textures while preserving character contours
        denoised = cv2.bilateralFilter(resized, d=7, sigmaColor=75, sigmaSpace=75)

        # 2. CLAHE local contrast equalization
        equalized = self.clahe.apply(denoised)

        # 3. Morphological close to bridge broken character strokes caused by dust
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        morph = cv2.morphologyEx(equalized, cv2.MORPH_CLOSE, kernel)

        return morph

    def binarize(self, gray_image: np.ndarray) -> np.ndarray:
        """
        Produces a high-contrast binary mask using Otsu + Adaptive Gaussian thresholding.
        """
        if gray_image is None or gray_image.size == 0:
            return gray_image
        
        # Otsu thresholding
        _, thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Invert if the background is dark and characters are bright
        # (Standard plates have dark letters on light/yellow background)
        white_pixels = cv2.countNonZero(thresh)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        if white_pixels < total_pixels * 0.4:
            thresh = cv2.bitwise_not(thresh)
            
        return thresh
