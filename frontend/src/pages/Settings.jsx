import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Camera,
  Shield,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    ocr_confidence_threshold: 0.75,
    quality_score_threshold: 45.0,
    entry_line_y_ratio: 0.55,
    exit_line_y_ratio: 0.85
  });
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.system.getSettings();
        if (res.settings) setSettings(res.settings);
        if (res.cameras) setCameras(res.cameras);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.system.updateSettings(settings);
      setMessage({ type: 'success', text: 'Pipeline and threshold settings saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update system settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to reset the database to the initial construction demonstration seed data?')) {
      setResetting(true);
      try {
        await api.system.resetDemo();
        setMessage({ type: 'success', text: 'Database reset to initial demo state with fresh test vehicles, alerts, and visit logs.' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to reset demo database.' });
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              System Configuration & Camera Setup
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Adjust OCR confidence triggers, image quality thresholds, virtual gate lines, and demo database state
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
            color: message.type === 'success' ? '#10b981' : '#f87171'
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Section 1: AI & Quality Thresholds */}
        <div className="industrial-card" style={{ marginBottom: 24, padding: 24 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Sliders size={18} color="#f59e0b" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
              Computer Vision & OCR Sensitivity Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                OCR Confidence Threshold ({Math.round(settings.ocr_confidence_threshold * 100)}%)
              </label>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                style={{ width: '100%', accentColor: '#f59e0b' }}
                value={settings.ocr_confidence_threshold}
                onChange={(e) => setSettings({ ...settings, ocr_confidence_threshold: parseFloat(e.target.value) })}
              />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Readings below this confidence are marked as Low-Confidence and routed through Multi-Frame Fusion.
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Plate Image Quality Score Minimum ({Math.round(settings.quality_score_threshold)}%)
              </label>
              <input
                type="range"
                min="20"
                max="75"
                step="5"
                style={{ width: '100%', accentColor: '#38bdf8' }}
                value={settings.quality_score_threshold}
                onChange={(e) => setSettings({ ...settings, quality_score_threshold: parseFloat(e.target.value) })}
              />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Below this score (blur, low light, mud), Bilateral and CLAHE preprocessing filters are triggered.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Virtual Gate Lines Positioning */}
        <div className="industrial-card" style={{ marginBottom: 24, padding: 24 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Cpu size={18} color="#38bdf8" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
              Virtual Gate Entry & Exit Boundary Lines
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Virtual Entry Line Position ({Math.round(settings.entry_line_y_ratio * 100)}% from Top)
              </label>
              <input
                type="range"
                min="0.30"
                max="0.75"
                step="0.05"
                style={{ width: '100%', accentColor: '#f59e0b' }}
                value={settings.entry_line_y_ratio}
                onChange={(e) => setSettings({ ...settings, entry_line_y_ratio: parseFloat(e.target.value) })}
              />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Inbound crossing line where entry timestamp and vehicle ID are first recorded.
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Virtual Exit Line Position ({Math.round(settings.exit_line_y_ratio * 100)}% from Top)
              </label>
              <input
                type="range"
                min="0.65"
                max="0.95"
                step="0.05"
                style={{ width: '100%', accentColor: '#10b981' }}
                value={settings.exit_line_y_ratio}
                onChange={(e) => setSettings({ ...settings, exit_line_y_ratio: parseFloat(e.target.value) })}
              />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Outbound crossing line where exit timestamp is registered and stay duration calculated.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Camera Node Network */}
        <div className="industrial-card" style={{ marginBottom: 24, padding: 24 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Camera size={18} color="#10b981" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
              Connected Site CCTV Camera Nodes
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                style={{
                  background: '#090f1e',
                  border: '1px solid #1c2a44',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    {cam.name} ({cam.id})
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{cam.location} • 30 FPS Optical Feed</div>
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between" style={{ marginBottom: 30 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving System Parameters...' : 'Apply & Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Demo State Maintenance */}
      <div className="industrial-card" style={{ borderLeft: '4px solid #ef4444', padding: 24 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
              Demonstration Mode & Database Reset
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 640 }}>
              Quickly restore the SQLite database to the default construction site demonstration state with registered contractors (Apex Infrastructure, Titan Concrete, BuildCorp), simulated alerts, and sample visits.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
            onClick={handleResetDemo}
            disabled={resetting}
          >
            <RotateCcw size={16} />
            <span>{resetting ? 'Resetting Database...' : 'Reset Demo Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
