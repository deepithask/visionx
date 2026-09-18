"""
System Configuration & Settings
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
CROPS_DIR = DATA_DIR / "crops"
SAMPLES_DIR = DATA_DIR / "samples"

# Ensure required directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
CROPS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration (SQLite default, ready for PostgreSQL / Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'construction_anpr.db'}")

# Security / Prototype Auth
SECRET_KEY = os.getenv("SECRET_KEY", "cctv-construction-anpr-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Quality Assessment & OCR Thresholds
DEFAULT_OCR_CONFIDENCE_THRESHOLD = 0.75  # 75%
DEFAULT_QUALITY_SCORE_THRESHOLD = 45.0    # 45% (below is poor/low confidence)
LAPLACIAN_BLUR_THRESHOLD = 100.0         # Variance of Laplacian for blur detection
MIN_PLATE_WIDTH = 60                     # Min resolution width
MIN_PLATE_HEIGHT = 18                    # Min resolution height

# Tracking Settings
TRACK_MAX_AGE = 30                       # Frames to keep track without detection
TRACK_IOU_THRESHOLD = 0.35               # Minimum IoU for matching

# Virtual Line Coordinates for Gate-01 (Ratio from 0.0 to 1.0 of frame height)
ENTRY_LINE_Y_RATIO = 0.55
EXIT_LINE_Y_RATIO = 0.85

# Camera Nodes
CAMERAS = [
    {"id": "Gate-01", "name": "Main North Gate (Inbound/Outbound)", "status": "active"},
    {"id": "Gate-02", "name": "South Heavy Materials Gate", "status": "active"},
    {"id": "Gate-03", "name": "Loading & Concrete Batching Zone", "status": "active"},
]
