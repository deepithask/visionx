"""
FastAPI Main Application Entry Point
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import CROPS_DIR, UPLOADS_DIR, SAMPLES_DIR
from backend.database.db import SessionLocal, Base, engine
from backend.database.seed_data import seed_database
from backend.services.sample_video_gen import generate_sample_cctv_video

# Import API Routers
from backend.api.auth import router as auth_router
from backend.api.video import router as video_router
from backend.api.vehicles import router as vehicles_router
from backend.api.detections import router as detections_router
from backend.api.history import router as history_router
from backend.api.alerts import router as alerts_router
from backend.api.analytics import router as analytics_router
from backend.api.search import router as search_router
from backend.api.system import router as system_router

app = FastAPI(
    title="AI-Powered Construction Site Vehicle & License Plate Monitoring System",
    description=(
        "Industrial ANPR and vehicle tracking dashboard for construction-site CCTV footage. "
        "Includes vehicle detection, tracking (V001..V999), license plate localization, "
        "image quality assessment, multi-frame OCR fusion, and entry/exit duration logging. "
        "Strictly excludes PPE and worker detection."
    ),
    version="2.0.0"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for plate crops, uploads, and sample videos
app.mount("/api/static/crops", StaticFiles(directory=str(CROPS_DIR)), name="crops")
app.mount("/api/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/api/static/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")

# Register Routers
app.include_router(auth_router)
app.include_router(video_router)
app.include_router(vehicles_router)
app.include_router(detections_router)
app.include_router(history_router)
app.include_router(alerts_router)
app.include_router(analytics_router)
app.include_router(search_router)
app.include_router(system_router)


@app.on_event("startup")
def on_startup():
    """Initializes SQLite schema, realistic construction seed data, and sample CCTV footage."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Pre-generate sample construction CCTV footage if not already present
    try:
        generate_sample_cctv_video()
    except Exception as e:
        print(f"[Warning] Failed to generate sample video during startup: {e}")


@app.get("/")
def root():
    return {
        "message": "AI Construction Site Vehicle & License Plate Monitoring System API is running.",
        "docs_url": "/docs",
        "health_check": "/api/system/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
