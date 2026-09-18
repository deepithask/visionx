import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Truck,
  ShieldCheck,
  Clock,
  ScanLine,
  RefreshCw,
  Award,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import LicensePlateBadge from '../components/LicensePlateBadge';
import { api } from '../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.get();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const TYPE_COLORS = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#ec4899', '#f97316'];

  const ocrPerf = data?.ocr_performance || {
    successful_pct: 88.0,
    low_conf_pct: 9.0,
    unreadable_pct: 3.0,
    avg_quality_score: 83.4,
    multi_frame_accuracy_boost: '+14.2%'
  };

  return (
    <div>
      {/* Top Action Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              Construction Site Operational Analytics
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Traffic patterns, gate dwell duration, top contractor utilization, and OCR model performance
            </p>
          </div>
        </div>

        <button className="btn-secondary" onClick={fetchAnalytics}>
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Row 1: OCR Recognition Quality & Performance Overview Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        <div className="industrial-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
            Successful OCR Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>
            {ocrPerf.successful_pct}%
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>High-confidence character lock</p>
        </div>

        <div className="industrial-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
            Low-Confidence OCR
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>
            {ocrPerf.low_conf_pct}%
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Recovered via Multi-Frame Fusion</p>
        </div>

        <div className="industrial-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
            Unreadable / Obstructed
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444' }}>
            {ocrPerf.unreadable_pct}%
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Severe mud/dust obstruction</p>
        </div>

        <div className="industrial-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
            Multi-Frame Fusion Gain
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>
            {ocrPerf.multi_frame_accuracy_boost}
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Accuracy over single-frame OCR</p>
        </div>
      </div>

      {/* Row 2 Charts: Hourly Inbound Curve & Weekly Access Ratio */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        <div className="industrial-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            Inbound Traffic Frequency (Vehicles per Hour)
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Daily gate distribution for material dispatch optimization
          </p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourly_traffic || []}>
                <defs>
                  <linearGradient id="areaTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="vehicles" stroke="#38bdf8" strokeWidth={2.5} fill="url(#areaTraffic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="industrial-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            Site Duration Histogram (Average Minutes)
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Average turn-around time on site by vehicle category
          </p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stay_duration_by_type || []}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={10} tickLine={false} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="avg_minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Frequently Seen Vehicles Table & Vehicle Category Pie */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Frequently Seen Vehicles */}
        <div style={{ gridColumn: 'span 2' }} className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Frequently Seen Vehicles (Top Site Visitors)
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Contractor fleet vehicles with highest recorded gate visits</p>
            </div>
            <Award size={18} color="#f59e0b" />
          </div>

          <table className="anpr-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>License Plate</th>
                <th>Vehicle Type</th>
                <th>Contractor Company</th>
                <th>Recorded Visits</th>
              </tr>
            </thead>
            <tbody>
              {(data?.frequent_vehicles || []).map((fv, idx) => (
                <tr key={fv.license_plate}>
                  <td style={{ fontWeight: 800, color: idx === 0 ? '#f59e0b' : '#94a3b8' }}>
                    #{idx + 1}
                  </td>
                  <td>
                    <LicensePlateBadge plate={fv.license_plate} isCommercial={fv.vehicle_type.includes('Truck') || fv.vehicle_type.includes('Mixer')} />
                  </td>
                  <td>{fv.vehicle_type}</td>
                  <td style={{ color: '#cbd5e1' }}>{fv.company}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {fv.visits} trips
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right 1 Col: Vehicle Type Share */}
        <div className="industrial-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            Vehicle Fleet Share
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Distribution by equipment type</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.type_distribution || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                >
                  {(data?.type_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(data?.type_distribution || []).slice(0, 4).map((t, idx) => (
              <div key={t.type} className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[idx % TYPE_COLORS.length] }}></span>
                  {t.type}
                </span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
