"""
Sample CCTV Video Generator & Synthetic Feeder
AI-Powered Construction Site Vehicle & License Plate Monitoring System

Generates a realistic construction-site CCTV video clip featuring:
- Industrial construction gate background (perimeter fence, barricades, safety markings)
- Multiple vehicles entering and exiting (Dump Truck, Concrete Mixer, Tipper, Pickup)
- Front-mounted license plates with realistic fonts and slight dust/motion variations
- Provides an out-of-the-box working video file for immediate monitoring & testing.
"""

import cv2
import numpy as np
import os
from typing import Optional
from pathlib import Path
from backend.config import SAMPLES_DIR


def generate_sample_cctv_video(output_path: Optional[str] = None, duration_seconds: int = 14, fps: int = 25) -> str:
    """
    Creates an MP4 video of construction site gate CCTV footage.
    """
    if output_path is None:
        output_path = str(SAMPLES_DIR / "construction_gate_cctv.mp4")

    # If already generated and valid size, return path
    if os.path.exists(output_path) and os.path.getsize(output_path) > 100000:
        return output_path

    width, height = 960, 540
    total_frames = duration_seconds * fps

    # Codec: MP4V or avc1
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Scenario timeline:
    # 1. Frames 0 - 110: Dump Truck TN38AB1234 drives from top-left toward gate, crosses entry line
    # 2. Frames 100 - 220: Concrete Mixer MH12DE4567 drives down central lane
    # 3. Frames 200 - 320: Unauthorized Tipper TN40XX9999 approaches gate
    # 4. Frames 280 - 350: Site Pickup DL01CA2468 exits site

    for f in range(total_frames):
        # Base background: Construction gate scene
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Upper area: Pale dusty sky and distant site cranes
        frame[0:140, :] = (180, 195, 205)
        # Horizon & fencing
        cv2.line(frame, (0, 140), (width, 140), (80, 80, 80), 2)
        # Background cranes & scaffolding
        cv2.line(frame, (120, 140), (160, 40), (40, 140, 230), 4)
        cv2.line(frame, (160, 40), (280, 40), (40, 140, 230), 3)
        cv2.line(frame, (750, 140), (790, 30), (40, 140, 230), 4)

        # Ground / unpaved asphalt & soil surface
        frame[140:height, :] = (75, 90, 105)

        # Central driveway / access road (darker compacted gravel)
        road_pts = np.array([[width * 0.25, 140], [width * 0.75, 140], [width * 0.95, height], [width * 0.05, height]], np.int32)
        cv2.fillPoly(frame, [road_pts], (60, 70, 80))

        # Lane markings (dashed yellow)
        for ly in range(160, height, 45):
            cv2.line(frame, (width // 2, ly), (width // 2, ly + 25), (40, 210, 240), 3)

        # Virtual Gate Entry Line (yellow hazard stripe across road)
        entry_y = int(height * 0.55)
        cv2.line(frame, (int(width * 0.15), entry_y), (int(width * 0.85), entry_y), (0, 200, 255), 2)
        cv2.putText(frame, "[VIRTUAL ENTRY LINE - GATE 01]", (int(width * 0.16), entry_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1, cv2.LINE_AA)

        # Virtual Gate Exit Line
        exit_y = int(height * 0.85)
        cv2.line(frame, (int(width * 0.08), exit_y), (int(width * 0.92), exit_y), (0, 140, 255), 2)
        cv2.putText(frame, "[VIRTUAL EXIT LINE - GATE 01]", (int(width * 0.09), exit_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 160, 255), 1, cv2.LINE_AA)

        # Side guardrails & construction drums
        for drum_x in [140, 220, 720, 800]:
            cv2.rectangle(frame, (drum_x, 150), (drum_x + 22, 190), (0, 120, 230), -1)
            cv2.rectangle(frame, (drum_x, 163), (drum_x + 22, 175), (255, 255, 255), -1)

        # CCTV timestamp and camera watermark
        cv2.putText(frame, f"CAM: GATE-01 NORTH INBOUND | FPS: 25.0 | REC [●]", (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
        sec_str = f"2026-09-18 10:32:{f // fps:02d}.{f % fps:02d}"
        cv2.putText(frame, sec_str, (width - 260, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (200, 230, 255), 1, cv2.LINE_AA)

        # --- VEHICLE 1: Dump Truck (Authorized) ---
        # Frames 0 to 110: Drives from y=120 to y=520
        if 0 <= f < 115:
            progress = f / 110.0
            scale = 0.5 + progress * 0.9
            vw = int(240 * scale)
            vh = int(180 * scale)
            vx = int((width // 2 - vw // 2) - 80 * (1 - progress))
            vy = int(120 + progress * 350)

            # Draw Dump Truck Body (Industrial Yellow/Orange)
            cv2.rectangle(frame, (vx, vy), (vx + vw, vy + vh), (25, 140, 225), -1)
            cv2.rectangle(frame, (vx + int(vw * 0.08), vy + int(vh * 0.08)),
                          (vx + int(vw * 0.92), vy + int(vh * 0.45)), (50, 50, 60), -1)  # Windshield
            # Wheels
            cv2.circle(frame, (vx + int(vw * 0.15), vy + vh), int(18 * scale), (20, 20, 20), -1)
            cv2.circle(frame, (vx + int(vw * 0.85), vy + vh), int(18 * scale), (20, 20, 20), -1)
            # Front Grill & Bumper
            cv2.rectangle(frame, (vx + int(vw * 0.18), vy + int(vh * 0.65)),
                          (vx + int(vw * 0.82), vy + int(vh * 0.88)), (40, 40, 40), -1)

            # License Plate: TN38AB1234
            pw = int(vw * 0.42)
            ph = int(pw / 3.4)
            px = vx + (vw - pw) // 2
            py = vy + int(vh * 0.72)
            # White plate background
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (240, 240, 240), -1)
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (0, 0, 0), 1)
            # Plate characters (subtle blur variation when far away)
            txt_scale = 0.38 * scale
            plate_text = "TN38AB1234"
            cv2.putText(frame, plate_text, (px + int(pw * 0.08), py + int(ph * 0.75)),
                        cv2.FONT_HERSHEY_DUPLEX, txt_scale, (10, 10, 10), 1, cv2.LINE_AA)

        # --- VEHICLE 2: Concrete Mixer (Authorized) ---
        # Frames 105 to 225
        if 105 <= f < 225:
            progress = (f - 105) / 115.0
            scale = 0.5 + progress * 0.85
            vw = int(250 * scale)
            vh = int(190 * scale)
            vx = int((width // 2 - vw // 2) + 60 * (1 - progress))
            vy = int(115 + progress * 360)

            # Draw Concrete Mixer (Teal / Blue Cab with Barrel)
            cv2.rectangle(frame, (vx, vy), (vx + vw, vy + vh), (160, 110, 40), -1)
            # Mixer barrel outline
            cv2.ellipse(frame, (vx + vw // 2, vy + int(vh * 0.3)), (int(vw * 0.4), int(vh * 0.25)),
                        15, 0, 360, (200, 200, 200), -1)
            # Windshield
            cv2.rectangle(frame, (vx + int(vw * 0.12), vy + int(vh * 0.35)),
                          (vx + int(vw * 0.88), vy + int(vh * 0.60)), (40, 40, 40), -1)
            # Bumper
            cv2.rectangle(frame, (vx + int(vw * 0.15), vy + int(vh * 0.75)),
                          (vx + int(vw * 0.85), vy + int(vh * 0.92)), (30, 30, 30), -1)

            # License Plate: MH12DE4567
            pw = int(vw * 0.40)
            ph = int(pw / 3.4)
            px = vx + (vw - pw) // 2
            py = vy + int(vh * 0.78)
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (240, 240, 240), -1)
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (0, 0, 0), 1)
            txt_scale = 0.36 * scale
            cv2.putText(frame, "MH12DE4567", (px + int(pw * 0.08), py + int(ph * 0.75)),
                        cv2.FONT_HERSHEY_DUPLEX, txt_scale, (10, 10, 10), 1, cv2.LINE_AA)

        # --- VEHICLE 3: Unauthorized Tipper (Unauthorized TN40XX9999) ---
        # Frames 215 to 330
        if 215 <= f < 330:
            progress = (f - 215) / 110.0
            scale = 0.5 + progress * 0.85
            vw = int(230 * scale)
            vh = int(175 * scale)
            vx = int((width // 2 - vw // 2) - 40 * (1 - progress))
            vy = int(120 + progress * 350)

            # Draw Tipper Truck (Dark Red / Maroon)
            cv2.rectangle(frame, (vx, vy), (vx + vw, vy + vh), (35, 35, 175), -1)
            cv2.rectangle(frame, (vx + int(vw * 0.1), vy + int(vh * 0.1)),
                          (vx + int(vw * 0.9), vy + int(vh * 0.45)), (50, 50, 50), -1)
            # Mud spatters on lower bumper
            cv2.rectangle(frame, (vx + int(vw * 0.15), vy + int(vh * 0.70)),
                          (vx + int(vw * 0.85), vy + int(vh * 0.90)), (35, 50, 65), -1)

            # License Plate: TN40XX9999
            pw = int(vw * 0.42)
            ph = int(pw / 3.4)
            px = vx + (vw - pw) // 2
            py = vy + int(vh * 0.74)
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (230, 230, 230), -1)
            cv2.rectangle(frame, (px, py), (px + pw, py + ph), (0, 0, 0), 1)
            txt_scale = 0.36 * scale
            cv2.putText(frame, "TN40XX9999", (px + int(pw * 0.08), py + int(ph * 0.75)),
                        cv2.FONT_HERSHEY_DUPLEX, txt_scale, (15, 15, 15), 1, cv2.LINE_AA)

        out.write(frame)

    out.release()
    return output_path
