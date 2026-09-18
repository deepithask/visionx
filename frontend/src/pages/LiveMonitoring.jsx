import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Upload,
  Radio,
  Camera,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
  Clock,
  Scan,
  Activity,
  Maximize2
} from 'lucide-react';
import LicensePlateBadge from '../components/LicensePlateBadge';
import StatusPill from '../components/StatusPill';
import { api } from '../services/api';

export default function LiveMonitoring({ onNavigateToFusion }) {
  const [sessionState, setSessionState] = useState('stopped'); // stopped, processing, paused
  const [sessionId, setSessionId] = useState('live-gate-01');
  const [cameraId, setCameraId] = useState('Gate-01');
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [frameNumber, setFrameNumber] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoSource, setVideoSource] = useState('sample');
  const [fps, setFps] = useState(25.0);

  // Poll live video status and active vehicles while running
  useEffect(() => {
    let interval = null;
    if (sessionState === 'processing') {
      interval = setInterval(async () => {
        try {
          const status = await api.video.getStatus();
          setFrameNumber(status.frame_number);
          if (status.active_vehicles && status.active_vehicles.length > 0) {
            setActiveVehicles(status.active_vehicles);
            // Default select first active vehicle
            if (!selectedTrack || !status.active_vehicles.some(v => v.tracking_id === selectedTrack.tracking_id)) {
              setSelectedTrack(status.active_vehicles[0]);
            }
          }
        } catch (err) {
          // ignore stream poll jitter
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState, selectedTrack]);

  const handleStart = async () => {
    try {
      const res = await api.video.control('start', videoSource, cameraId);
      setSessionId(res.session_id);
      setSessionState('processing');
    } catch (err) {
      alert('Failed to start CCTV stream: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handlePause = async () => {
    try {
      await api.video.control('pause');
      setSessionState('paused');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      await api.video.control('resume');
      setSessionState('processing');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      await api.video.control('stop');
      setSessionState('stopped');
      setActiveVehicles([]);
      setSelectedTrack(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.video.upload(file);
      setVideoSource(res.path);
      setUploadModalOpen(false);
      alert(`Video '${res.filename}' uploaded successfully! Press START to process.`);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <Camera size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              Live CCTV Video Feed & ANPR Analysis
            </h2>
            <div className="flex items-center gap-2" style={{ fontSize: 12, color: '#94a3b8' }}>
              <span className="live-indicator">
                <span className="pulse-circle"></span>
                {sessionState === 'processing' ? 'STREAMING 25 FPS' : 'STANDBY READY'}
              </span>
              <span>•</span>
              <span>Node: {cameraId} North Inbound Gate</span>
            </div>
          </div>
        </div>

        {/* Video Control Buttons */}
        <div className="flex items-center gap-3">
          {sessionState === 'stopped' ? (
            <button className="btn-primary" onClick={handleStart} style={{ padding: '9px 18px' }}>
              <Play size={16} />
              <span>Start Processing</span>
            </button>
          ) : sessionState === 'processing' ? (
            <>
              <button className="btn-secondary" onClick={handlePause}>
                <Pause size={16} />
                <span>Pause</span>
              </button>
              <button className="btn-secondary" style={{ color: '#ef4444' }} onClick={handleStop}>
                <Square size={16} />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={handleResume}>
                <Play size={16} />
                <span>Resume</span>
              </button>
              <button className="btn-secondary" style={{ color: '#ef4444' }} onClick={handleStop}>
                <Square size={16} />
                <span>Stop</span>
              </button>
            </>
          )}

          {/* Upload CCTV Button */}
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload CCTV Video'}</span>
            <input type="file" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Main Monitoring Split View */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Video Player & Canvas Overlays */}
        <div style={{ gridColumn: 'span 2' }}>
          <div
            className="industrial-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              background: '#040711',
              position: 'relative',
              borderRadius: 12,
              border: '1px solid #1a273f'
            }}
          >
            {/* Stream HUD Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '10px 16px',
                background: 'linear-gradient(180deg, rgba(4,7,17,0.85) 0%, rgba(4,7,17,0) 100%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#cbd5e1'
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>CAM 01</span>
                <span>•</span>
                <span>GATE-01 MAIN ROAD INBOUND</span>
              </div>
              <div className="flex items-center gap-3 font-mono" style={{ fontSize: 11 }}>
                <span>FRAME: {frameNumber}</span>
                <span style={{ color: '#10b981' }}>CODEC: H.264 / MJPEG</span>
                <span style={{ color: '#38bdf8' }}>AI ENGINE: ACTIVE</span>
              </div>
            </div>

            {/* Live Video Image Element */}
            <div style={{ position: 'relative', minHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16' }}>
              {sessionState !== 'stopped' ? (
                <img
                  src={api.video.getStreamUrl(sessionId, cameraId)}
                  alt="Live CCTV Feed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 560,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Retrying quietly on frame drops
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
                  <Radio size={48} style={{ margin: '0 auto 16px', color: '#334155' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
                    CCTV Stream Ready (Node: Gate-01)
                  </h4>
                  <p style={{ fontSize: 13, maxWidth: 440, margin: '0 auto 20px' }}>
                    Click <strong>Start Processing</strong> above to monitor moving construction vehicles, locate license plates, and execute Multi-Frame OCR Fusion.
                  </p>
                  <button className="btn-primary" onClick={handleStart}>
                    <Play size={16} />
                    <span>Launch Live Video Stream</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Stream Status Footer */}
            <div
              style={{
                padding: '10px 16px',
                background: '#090e1c',
                borderTop: '1px solid #1a273f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#94a3b8'
              }}
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}></span>
                  <strong style={{ color: '#e2e8f0' }}>Green:</strong> Authorized
                </span>
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }}></span>
                  <strong style={{ color: '#e2e8f0' }}>Red:</strong> Unauthorized
                </span>
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }}></span>
                  <strong style={{ color: '#e2e8f0' }}>Yellow:</strong> Low Confidence / Expired
                </span>
              </div>
              <div>
                <span>Source: {videoSource === 'sample' ? 'Sample CCTV Loop (Gate 01)' : 'Uploaded CCTV'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Active Vehicles & Crop Quality Inspector */}
        <div className="flex flex-col gap-4">
          {/* Active Vehicles Rail */}
          <div className="industrial-card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2">
                <Activity size={16} color="#f59e0b" />
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#f8fafc' }}>
                  Tracked Vehicles ({activeVehicles.length})
                </h3>
              </div>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>REAL-TIME</span>
            </div>

            {activeVehicles.length > 0 ? (
              <div className="flex flex-col gap-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {activeVehicles.map((v) => {
                  const isSelected = selectedTrack?.tracking_id === v.tracking_id;
                  return (
                    <div
                      key={v.tracking_id}
                      onClick={() => setSelectedTrack(v)}
                      style={{
                        padding: '10px 12px',
                        background: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#0d1527',
                        border: isSelected ? '1px solid #f59e0b' : '1px solid #1c2a44',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8', fontSize: 13 }}>
                          {v.tracking_id}
                        </span>
                        <StatusPill status={v.authorization_status} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>{v.vehicle_type}</span>
                        <LicensePlateBadge plate={v.license_plate} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 12 }}>
                {sessionState === 'processing'
                  ? 'Detecting approaching vehicles in CCTV frame...'
                  : 'Start stream to view live vehicle tracks.'}
              </div>
            )}
          </div>

          {/* Detailed Selected Vehicle & Plate Quality Inspector */}
          {selectedTrack ? (
            <div className="industrial-card" style={{ padding: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
                  Crop & Quality Telemetry: {selectedTrack.tracking_id}
                </h4>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => onNavigateToFusion?.(selectedTrack.tracking_id)}
                  title="Inspect Multi-Frame OCR Fusion matrix"
                >
                  <Layers size={12} />
                  <span>Inspect Fusion</span>
                </button>
              </div>

              {/* Plate Crop Thumbnail */}
              <div
                style={{
                  background: '#090d16',
                  borderRadius: 6,
                  padding: 8,
                  textAlign: 'center',
                  border: '1px solid #1e293b',
                  marginBottom: 14
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                  Isolated License Plate Crop
                </div>
                {selectedTrack.plate_crop_path ? (
                  <img
                    src={selectedTrack.plate_crop_path}
                    alt="Plate Crop"
                    style={{
                      maxHeight: 60,
                      maxWidth: '100%',
                      margin: '0 auto',
                      borderRadius: 4,
                      border: '1px solid #334155'
                    }}
                  />
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    <LicensePlateBadge plate={selectedTrack.license_plate} />
                  </div>
                )}
              </div>

              {/* Quality Meters */}
              <div className="flex flex-col gap-3" style={{ fontSize: 12 }}>
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>Overall Plate Quality:</span>
                    <strong style={{ color: selectedTrack.quality_score >= 70 ? '#10b981' : '#f59e0b' }}>
                      {selectedTrack.quality_score}% ({selectedTrack.quality_status})
                    </strong>
                  </div>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${selectedTrack.quality_score}%`,
                        background: selectedTrack.quality_score >= 70 ? '#10b981' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>OCR Fusion Confidence:</span>
                    <strong style={{ color: selectedTrack.ocr_confidence >= 0.85 ? '#10b981' : '#f59e0b' }}>
                      {Math.round(selectedTrack.ocr_confidence * 100)}%
                    </strong>
                  </div>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${selectedTrack.ocr_confidence * 100}%`,
                        background: selectedTrack.ocr_confidence >= 0.85 ? '#10b981' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: '#090f1d',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #1a253c',
                    marginTop: 4
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Plate Status:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>Plate detected: YES</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#64748b' }}>Fusion Lock:</span>
                    <span style={{ fontWeight: 700, color: selectedTrack.is_locked ? '#10b981' : '#f59e0b' }}>
                      {selectedTrack.is_locked ? 'Multi-Frame Locked ✓' : 'Accumulating Frames...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="industrial-card" style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
              Select an active vehicle to view its crop quality score and OCR fusion state.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
