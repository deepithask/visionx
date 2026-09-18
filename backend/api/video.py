"""
CCTV Video Ingestion, Streaming, and Processing Endpoints
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

import os
import cv2
import time
import shutil
import asyncio
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import UPLOADS_DIR, SAMPLES_DIR
from backend.database.db import get_db
from backend.services.pipeline_service import pipeline_service
from backend.services.sample_video_gen import generate_sample_cctv_video

router = APIRouter(prefix="/api/video", tags=["Video Processing"])


class VideoControlRequest(BaseModel):
    action: str  # start, pause, resume, stop
    video_source: Optional[str] = "sample"  # sample or uploaded path
    camera_id: Optional[str] = "Gate-01"


# Global live stream buffer
_latest_annotated_frame_bytes: Optional[bytes] = None
_latest_metadata: dict = {
    "status": "idle",
    "session_id": None,
    "frame_number": 0,
    "active_vehicles": [],
    "camera_id": "Gate-01"
}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload construction-site CCTV video footage."""
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.webm', '.mkv')):
        raise HTTPException(status_code=400, detail="Only video files (.mp4, .avi, .webm, etc.) are supported.")

    dest_path = UPLOADS_DIR / file.filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "path": str(dest_path),
        "size_mb": round(os.path.getsize(dest_path) / (1024 * 1024), 2),
        "message": "CCTV video uploaded successfully and ready for analysis."
    }


@router.get("/samples")
def list_sample_videos():
    """List available construction site sample CCTV clips."""
    # Ensure standard sample exists
    sample_path = generate_sample_cctv_video()
    
    samples = [
        {
            "id": "gate-01-main",
            "name": "Gate-01 North Access Gate (Inbound Heavy Traffic)",
            "description": "Dump trucks, tippers, concrete mixers, and site supervisor pickups with license plates",
            "path": sample_path,
            "duration": "14 seconds (looping)",
            "resolution": "960x540 @ 25fps"
        },
        {
            "id": "gate-02-south",
            "name": "Gate-02 South Heavy Materials Gate",
            "description": "Concrete mixers and heavy flatbeds delivery lane",
            "path": sample_path,
            "duration": "14 seconds (looping)",
            "resolution": "960x540 @ 25fps"
        }
    ]
    return samples


@router.post("/control")
def control_processing(req: VideoControlRequest, db: Session = Depends(get_db)):
    """Start, pause, resume, or stop CCTV video processing."""
    global _latest_metadata

    action = req.action.lower()

    if action == "start":
        video_path = req.video_source
        if not video_path or video_path == "sample" or not os.path.exists(video_path):
            video_path = generate_sample_cctv_video()

        session_id = pipeline_service.start_session(video_path)
        _latest_metadata["status"] = "processing"
        _latest_metadata["session_id"] = session_id
        _latest_metadata["camera_id"] = req.camera_id
        return {
            "status": "started",
            "session_id": session_id,
            "video_path": video_path,
            "camera_id": req.camera_id
        }

    elif action == "pause":
        pipeline_service.pause_session()
        _latest_metadata["status"] = "paused"
        return {"status": "paused"}

    elif action == "resume":
        pipeline_service.resume_session()
        _latest_metadata["status"] = "processing"
        return {"status": "resumed"}

    elif action == "stop":
        pipeline_service.stop_session()
        _latest_metadata["status"] = "stopped"
        _latest_metadata["active_vehicles"] = []
        return {"status": "stopped"}

    raise HTTPException(status_code=400, detail="Unknown action. Supported: start, pause, resume, stop.")


@router.get("/status")
def get_video_status():
    """Returns current real-time processing state and active tracked vehicles."""
    return {
        "status": _latest_metadata["status"],
        "session_id": _latest_metadata["session_id"],
        "frame_number": _latest_metadata["frame_number"],
        "camera_id": _latest_metadata["camera_id"],
        "active_vehicles": _latest_metadata["active_vehicles"]
    }


def _video_stream_generator(session_id: str, camera_id: str = "Gate-01"):
    """
    Decodes CCTV video, feeds frames through pipeline_service,
    and yields multipart MJPEG stream to browser.
    """
    global _latest_annotated_frame_bytes, _latest_metadata

    video_path = pipeline_service.current_video_path
    if not video_path or not os.path.exists(video_path):
        video_path = generate_sample_cctv_video()

    cap = cv2.VideoCapture(video_path)
    from backend.database.db import SessionLocal
    db = SessionLocal()

    try:
        while True:
            if not pipeline_service.is_running:
                # If stopped, generate static standby frame
                standby = np.zeros((480, 854, 3), dtype=np.uint8)
                standby[:] = (20, 25, 35)
                cv2.putText(standby, "[ CCTV STREAM READY - PRESS START ]", (200, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 210, 255), 2)
                _, buffer = cv2.imencode('.jpg', standby)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                time.sleep(0.5)
                continue

            if pipeline_service.is_paused:
                time.sleep(0.2)
                continue

            ret, frame = cap.read()
            if not ret:
                # Loop video continuously for real-time monitoring feel
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Process frame through full pipeline
            proc_result = pipeline_service.process_frame(frame, db, camera_id=camera_id)

            # Update live metadata
            _latest_metadata["frame_number"] = proc_result["frame_number"]
            _latest_metadata["active_vehicles"] = proc_result["detections"]
            _latest_metadata["session_id"] = session_id

            # Encode annotated frame as JPEG
            annotated = proc_result["annotated_frame"]
            success, jpg_buf = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not success:
                continue

            frame_bytes = jpg_buf.tobytes()
            _latest_annotated_frame_bytes = frame_bytes

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

            # Real-time frame pacing (approx 22-25 FPS)
            time.sleep(0.04)

    finally:
        cap.release()
        db.close()


@router.get("/stream/{session_id}")
def stream_video(session_id: str, camera_id: str = "Gate-01"):
    """
    Live MJPEG streaming endpoint for HTML5 <img> or video view.
    Displays live CCTV footage with vehicle bounding boxes, license plates,
    OCR confidence scores, and virtual gate crossing lines.
    """
    return StreamingResponse(
        _video_stream_generator(session_id, camera_id=camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
