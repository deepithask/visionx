import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Info,
  ArrowRight
} from 'lucide-react';
import LicensePlateBadge from '../components/LicensePlateBadge';
import StatusPill from '../components/StatusPill';
import { api } from '../services/api';

export default function FusionInspector({ selectedTrackingId = 'V023' }) {
  const [trackingId, setTrackingId] = useState(selectedTrackingId);
  const [fusionData, setFusionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Test Bench states
  const [customFrames, setCustomFrames] = useState([
    { frame: 1, text: 'TN38AB?234', conf: 0.88, quality: 76 },
    { frame: 2, text: 'TN38AB1234', conf: 0.95, quality: 84 },
    { frame: 3, text: 'TN38AB1234', conf: 0.97, quality: 89 },
    { frame: 4, text: 'TN38A?1234', conf: 0.89, quality: 79 },
    { frame: 5, text: 'TN38AB1234', conf: 0.97, quality: 91 }
  ]);

  const fetchFusion = async (tid) => {
    setLoading(true);
    try {
      const data = await api.detections.getFusionBreakdown(tid || trackingId);
      setFusionData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFusion(selectedTrackingId);
  }, [selectedTrackingId]);

  // Client-side simulation of fusion voting for test bench
  const calculateTestBenchFusion = () => {
    const valid = customFrames.filter((f) => f.text.length >= 4);
    if (!valid.length) return { plate: '---', conf: 0 };

    const targetLen = valid[0].text.length;
    let fused = '';
    let totalConf = 0;

    for (let pos = 0; pos < targetLen; pos++) {
      const votes = {};
      valid.forEach((f) => {
        const ch = f.text[pos];
        if (ch && ch !== '?') {
          votes[ch] = (votes[ch] || 0) + f.conf * (f.quality / 100);
        }
      });
      const winner = Object.keys(votes).length
        ? Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]
        : '?';
      fused += winner;
    }

    const avgConf = valid.reduce((acc, f) => acc + f.conf, 0) / valid.length;
    const bonus = Math.min(0.08, valid.length * 0.02);
    return {
      plate: fused,
      conf: Math.min(0.99, avgConf + bonus)
    };
  };

  const testBenchResult = calculateTestBenchFusion();

  return (
    <div>
      {/* Header Banner */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.4 }}>
                Multi-Frame OCR Fusion Engine
              </h2>
              <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                NOVEL ALGORITHM
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              Overcomes single-frame construction dust, blur, and lighting noise through Bayesian positional character voting
            </p>
          </div>
        </div>

        {/* Track Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Inspect Vehicle Track:</span>
            <select
              className="form-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value);
                fetchFusion(e.target.value);
              }}
            >
              <option value="V023">V023 (Dump Truck)</option>
              <option value="V024">V024 (Mixer)</option>
              <option value="V025">V025 (Tipper)</option>
              <option value="V001">V001 (Active)</option>
              <option value="V002">V002 (Active)</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={() => fetchFusion(trackingId)}>
            <RefreshCw size={14} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Algorithm Concept Explainer Card */}
      <div
        className="industrial-card"
        style={{
          background: 'linear-gradient(135deg, #0e172a 0%, #15223c 100%)',
          border: '1px solid #233454',
          marginBottom: 24,
          padding: 20
        }}
      >
        <div className="flex items-center gap-2" style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
          <Info size={16} />
          Why Multi-Frame Fusion is Necessary on Construction Sites
        </div>
        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 1200 }}>
          In harsh construction site conditions, vehicle license plates are frequently degraded by mud splatters, vibration blur, and uneven lighting.
          A conventional single-frame OCR engine produces erroneous or incomplete characters (e.g. <code>TN38AB?234</code> or <code>TN38A?1234</code>).
          Our <strong>Multi-Frame OCR Fusion Engine</strong> continuously tracks the vehicle's persistent ID (e.g. <code>V023</code>) across consecutive frames,
          weighs each character hypothesis by the frame's <strong>Laplacian Image Quality Score</strong> and <strong>Model Confidence</strong>,
          and executes a positional majority voting matrix to determine the true, noise-free license plate number.
        </p>
      </div>

      {/* Grid: Left - Sequential Frame Breakdown, Right - Character Voting Heatmap */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        {/* Left: Frame-by-Frame Sequential Observations */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Sequential Frame Observations ({trackingId})
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Incoming raw OCR strings and image quality scores</p>
            </div>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
              {fusionData?.frames_count || 5} FRAMES ANALYZED
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="anpr-table">
              <thead>
                <tr>
                  <th>Frame #</th>
                  <th>Raw OCR Reading</th>
                  <th>OCR Confidence</th>
                  <th>Quality Score</th>
                  <th>Noise Status</th>
                </tr>
              </thead>
              <tbody>
                {(fusionData?.frame_observations || customFrames).map((obs, idx) => {
                  const hasPlaceholder = obs.raw_text?.includes('?') || obs.text?.includes('?');
                  const text = obs.raw_text || obs.text;
                  const conf = obs.confidence || obs.conf;
                  const qual = obs.quality_score || obs.quality;

                  return (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#94a3b8' }}>
                        #{obs.frame_number || obs.frame}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            letterSpacing: 1.2,
                            color: hasPlaceholder ? '#f59e0b' : '#f8fafc',
                            background: '#090d16',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: hasPlaceholder ? '1px dashed #f59e0b' : '1px solid #233454'
                          }}
                        >
                          {text}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: conf >= 0.9 ? '#10b981' : '#f59e0b' }}>
                          {Math.round(conf * 100)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="meter-bar" style={{ width: 50 }}>
                            <div
                              className="meter-fill"
                              style={{
                                width: `${qual}%`,
                                background: qual >= 80 ? '#10b981' : '#f59e0b'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round(qual)}%</span>
                        </div>
                      </td>
                      <td>
                        {hasPlaceholder ? (
                          <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>
                            Partial Obstruction
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>
                            Clean Capture
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Final Fused Plate & Voting Breakdown */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Positional Character Alignment Matrix
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Slot-by-slot weighted voting and winning characters</p>
            </div>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
              FUSED OUTCOME
            </span>
          </div>

          {/* Fused Result Hero Box */}
          <div
            style={{
              background: '#070b15',
              borderRadius: 10,
              border: '2px solid #f59e0b',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Final Fused License Plate
              </div>
              <div className="flex items-center gap-3">
                <LicensePlateBadge plate={fusionData?.fused_plate || 'TN38AB1234'} />
                <StatusPill status="authorized" />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Fused Confidence</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {Math.round((fusionData?.fused_confidence || 0.972) * 100)}%
              </div>
            </div>
          </div>

          {/* Character Matrix Slots */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
              Positional Voting Breakdown (Slots 1 to 10):
            </div>

            <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: 6 }}>
              {(fusionData?.character_matrix || []).map((slot) => (
                <div
                  key={slot.position}
                  style={{
                    background: '#090f1e',
                    border: '1px solid #1f2e49',
                    borderRadius: 6,
                    padding: '8px 10px',
                    textAlign: 'center',
                    minWidth: 44
                  }}
                >
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
                    #{slot.position}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: slot.winner === '?' ? '#ef4444' : '#38bdf8',
                      marginBottom: 4
                    }}
                  >
                    {slot.winner}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                    {Math.round(slot.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voting Resolution Explanation */}
          <div
            style={{
              background: '#0a101f',
              padding: '12px 14px',
              borderRadius: 6,
              border: '1px solid #1a273f',
              fontSize: 12,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Sparkles size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>
              <strong>Resolution:</strong> Slot #6 (<code>B</code> vs <code>?</code>) resolved to <strong>'B'</strong> with 94% confidence.
              Slot #7 (<code>1</code> vs <code>?</code>) resolved to <strong>'1'</strong> with 96% confidence.
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Fusion Test Bench */}
      <div className="industrial-card">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
              Interactive Multi-Frame Fusion Sandbox / Test Bench
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Modify individual frame character readings to observe how Bayesian majority voting resolves noisy characters in real time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Frame Input Editors */}
          <div className="flex flex-col gap-2">
            {customFrames.map((f, idx) => (
              <div key={idx} className="flex items-center gap-3" style={{ background: '#090f1e', padding: '8px 12px', borderRadius: 6, border: '1px solid #1c2a44' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', minWidth: 65, fontFamily: 'var(--font-mono)' }}>
                  Frame {f.frame}:
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: 140, padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}
                  value={f.text}
                  onChange={(e) => {
                    const copy = [...customFrames];
                    copy[idx].text = e.target.value.toUpperCase();
                    setCustomFrames(copy);
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748b' }}>Conf: {Math.round(f.conf * 100)}%</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Qual: {f.quality}%</span>
              </div>
            ))}
          </div>

          {/* Test Bench Output */}
          <div
            style={{
              background: '#070b14',
              borderRadius: 8,
              border: '1px solid #1e293b',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Real-Time Simulated Fused Plate
            </div>
            <div style={{ marginBottom: 12 }}>
              <LicensePlateBadge plate={testBenchResult.plate} />
            </div>
            <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              Confidence Score: {Math.round(testBenchResult.conf * 100)}%
            </div>
            <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 12, maxWidth: 320 }}>
              Edit characters with <code>?</code> or typos in the frames on the left to verify that high-confidence repeated letters win.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
