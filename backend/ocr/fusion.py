"""
Multi-Frame OCR Fusion Engine
AI-Powered Construction Site Vehicle & License Plate Monitoring System

Novel Feature:
Instead of relying on a single noisy CCTV video frame, this engine aggregates
OCR observations across multiple sequential frames for the same tracked vehicle (V001, V002, etc.).
It applies position-wise character alignment, quality-weighted voting, and Bayesian confidence
fusion to produce a highly accurate, noise-resistant final license plate.
"""

import re
from typing import List, Dict, Any, Optional
from collections import defaultdict


class OCRFrameObservation:
    def __init__(
        self,
        frame_number: int,
        raw_text: str,
        confidence: float,
        quality_score: float,
        char_confidences: Optional[Dict[str, float]] = None
    ):
        self.frame_number = frame_number
        self.raw_text = self._clean_plate(raw_text)
        self.confidence = max(0.01, min(1.0, float(confidence)))
        self.quality_score = max(1.0, min(100.0, float(quality_score)))
        self.char_confidences = char_confidences or {}

    @staticmethod
    def _clean_plate(text: str) -> str:
        if not text:
            return ""
        # Uppercase and remove spaces/dashes
        cleaned = re.sub(r'[^A-Z0-9?]', '', text.upper())
        return cleaned


class MultiFrameOCRFusion:
    def __init__(self, min_frames_for_lock: int = 3, max_history_per_track: int = 15):
        self.min_frames_for_lock = min_frames_for_lock
        self.max_history_per_track = max_history_per_track
        # Buffer indexed by tracking_id -> List[OCRFrameObservation]
        self._tracks_buffer: Dict[str, List[OCRFrameObservation]] = defaultdict(list)

    def add_observation(
        self,
        tracking_id: str,
        frame_number: int,
        raw_text: str,
        confidence: float,
        quality_score: float,
        char_confidences: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Record a new frame observation and return the updated fusion result.
        """
        obs = OCRFrameObservation(
            frame_number=frame_number,
            raw_text=raw_text,
            confidence=confidence,
            quality_score=quality_score,
            char_confidences=char_confidences
        )

        buffer = self._tracks_buffer[tracking_id]
        buffer.append(obs)
        if len(buffer) > self.max_history_per_track:
            buffer.pop(0)

        return self.fuse_track(tracking_id)

    def fuse_track(self, tracking_id: str) -> Dict[str, Any]:
        """
        Performs multi-frame positional voting and confidence fusion for the specified track.
        """
        buffer = self._tracks_buffer.get(tracking_id, [])
        if not buffer:
            return {
                "tracking_id": tracking_id,
                "fused_plate": "",
                "fused_confidence": 0.0,
                "is_locked": False,
                "frames_count": 0,
                "frame_observations": [],
                "character_matrix": [],
                "status": "No frames recorded"
            }

        # Format individual frame observations for UI
        frame_observations = []
        for b in buffer:
            frame_observations.append({
                "frame_number": b.frame_number,
                "raw_text": b.raw_text,
                "confidence": round(b.confidence, 3),
                "quality_score": round(b.quality_score, 1)
            })

        # Filter out empty or extremely short invalid readings (< 4 chars)
        valid_obs = [b for b in buffer if len(b.raw_text) >= 4]
        if not valid_obs:
            latest = buffer[-1]
            return {
                "tracking_id": tracking_id,
                "fused_plate": latest.raw_text,
                "fused_confidence": round(latest.confidence, 3),
                "is_locked": False,
                "frames_count": len(buffer),
                "frame_observations": frame_observations,
                "character_matrix": [],
                "status": "Insufficient valid characters"
            }

        # 1. Determine the target plate length by weighted length histogram
        length_weights = defaultdict(float)
        for b in valid_obs:
            w = b.confidence * (b.quality_score / 100.0)
            length_weights[len(b.raw_text)] += w

        target_length = max(length_weights.items(), key=lambda x: x[1])[0]

        # 2. Positional character alignment & quality-weighted voting
        fused_chars = []
        fused_char_confs = []
        character_matrix = []

        for pos in range(target_length):
            votes = defaultdict(float)
            char_occurrences = defaultdict(int)

            for b in valid_obs:
                if pos < len(b.raw_text):
                    ch = b.raw_text[pos]
                    if ch == '?':
                        continue  # Skip ambiguous character placeholder
                    
                    # Individual character confidence weight
                    base_char_conf = b.char_confidences.get(ch, b.confidence)
                    # Weight combines model confidence and frame image quality
                    weight = base_char_conf * (b.quality_score / 100.0)
                    votes[ch] += weight
                    char_occurrences[ch] += 1

            if not votes:
                # If all frames had '?' at this position
                fused_chars.append("?")
                fused_char_confs.append(0.30)
                character_matrix.append({
                    "position": pos + 1,
                    "winner": "?",
                    "confidence": 0.30,
                    "votes": {"?": 1.0}
                })
                continue

            # Pick winning character for this position
            winner_char, winner_weight = max(votes.items(), key=lambda x: x[1])
            total_pos_weight = sum(votes.values())
            # Slot confidence ratio
            pos_conf = winner_weight / total_pos_weight if total_pos_weight > 0 else 0.5
            
            # Boost confidence if the same character was seen across multiple frames
            agreeing_frames = char_occurrences[winner_char]
            frame_boost = min(0.15, (agreeing_frames - 1) * 0.04)
            final_pos_conf = min(0.99, pos_conf + frame_boost)

            fused_chars.append(winner_char)
            fused_char_confs.append(final_pos_conf)

            character_matrix.append({
                "position": pos + 1,
                "winner": winner_char,
                "confidence": round(final_pos_conf, 3),
                "votes": {c: round(w, 2) for c, w in votes.items()}
            })

        fused_plate = "".join(fused_chars)

        # 3. Overall fused confidence calculation
        # Mean character confidence across all positions
        mean_char_conf = sum(fused_char_confs) / len(fused_char_confs) if fused_char_confs else 0.5

        # Frame consistency bonus: If multiple sequential frames yield identical winner, confidence increases
        matching_full_reads = sum(1 for b in valid_obs if b.raw_text == fused_plate)
        consistency_bonus = min(0.12, matching_full_reads * 0.03)
        overall_confidence = min(0.99, mean_char_conf + consistency_bonus)

        # Is locked when >= min_frames_for_lock and confidence >= 0.85
        is_locked = len(valid_obs) >= self.min_frames_for_lock and overall_confidence >= 0.80

        return {
            "tracking_id": tracking_id,
            "fused_plate": fused_plate,
            "fused_confidence": round(overall_confidence, 3),
            "is_locked": is_locked,
            "frames_count": len(buffer),
            "valid_frames_count": len(valid_obs),
            "frame_observations": frame_observations,
            "character_matrix": character_matrix,
            "status": "Fused successfully" if is_locked else "Accumulating frame observations"
        }

    def clear_track(self, tracking_id: str):
        """Clear memory buffer for tracked vehicle."""
        if tracking_id in self._tracks_buffer:
            del self._tracks_buffer[tracking_id]
