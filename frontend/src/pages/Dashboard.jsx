import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ScanLine,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Radio
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
import MetricCard from '../components/MetricCard';
import LicensePlateBadge from '../components/LicensePlateBadge';
import StatusPill from '../components/StatusPill';
import { api } from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDetections, setRecentDetections] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, detectionsRes] = await Promise.all([
        api.analytics.get(),
        api.detections.list({ limit: 6 })
      ]);
      setData(analyticsRes);
      setRecentDetections(detectionsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px', color: '#f59e0b' }} />
        <p>Loading construction site vehicle analytics & telemetry...</p>
      </div>
    );
  }

  const kpi = data?.kpi || {
    total_vehicles_today: 127,
    unique_vehicles: 42,
    authorized_vehicles: 119,
    unauthorized_vehicles: 8,
    currently_inside: 32,
    avg_stay_duration_minutes: 68,
    total_plate_detections: 842,
    low_confidence_detections: 14,
    new_alerts_count: 2
  };

  const TYPE_COLORS = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#ec4899', '#f97316'];

  return (
    <div>
      {/* Top Banner with Quick Actions */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.4 }}>
            Construction Site Monitoring Dashboard
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            Real-time telemetry, vehicle classification, license plate verification, and gate access audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={fetchDashboardData}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button className="btn-primary" onClick={() => onNavigate('monitoring')}>
            <Radio size={14} />
            <span>Open Live CCTV Stream</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        <MetricCard
          title="Total Vehicles Today"
          value={kpi.total_vehicles_today}
          icon={Truck}
          color="amber"
          subtext="across all site gates"
          trend={+8.4}
        />
        <MetricCard
          title="Unique Vehicles"
          value={kpi.unique_vehicles}
          icon={ScanLine}
          color="blue"
          subtext="distinct plate registrations"
        />
        <MetricCard
          title="Authorized Vehicles"
          value={kpi.authorized_vehicles}
          icon={ShieldCheck}
          color="green"
          subtext="verified valid site permits"
        />
        <MetricCard
          title="Unauthorized Vehicles"
          value={kpi.unauthorized_vehicles}
          icon={AlertTriangle}
          color="red"
          subtext="unregistered or flagged"
        />
        <MetricCard
          title="Vehicles Currently Inside"
          value={kpi.currently_inside}
          icon={Radio}
          color="amber"
          subtext="active on site premises"
        />
        <MetricCard
          title="Avg Stay Duration"
          value={`${kpi.avg_stay_duration_minutes}m`}
          icon={Clock}
          color="blue"
          subtext="time from entry to exit line"
        />
        <MetricCard
          title="Total Plate Detections"
          value={kpi.total_plate_detections}
          icon={ScanLine}
          color="purple"
          subtext="video frame inferences"
        />
        <MetricCard
          title="Low-Confidence OCR"
          value={kpi.low_confidence_detections}
          icon={HelpCircle}
          color="amber"
          subtext="flagged for fusion review"
        />
      </div>

      {/* Charts Section Row 1: Hourly Traffic & Authorized vs Unauthorized */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        {/* Chart 1: Vehicles Per Hour */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Vehicles Per Hour (Today's Traffic Trend)
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Gate-01 North Access Gate hourly entry volume</p>
            </div>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Shift Peak: 09:00</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourly_traffic || []}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="vehicles" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#trafficGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Vehicle Traffic (Authorized vs Unauthorized) */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Daily Vehicle Traffic (Authorized vs Unauthorized)
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Weekly security access clearance ratio</p>
            </div>
            <div className="flex items-center gap-3" style={{ fontSize: 11 }}>
              <span className="flex items-center gap-1" style={{ color: '#10b981' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}></span> Authorized
              </span>
              <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }}></span> Unauthorized
              </span>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily_traffic || []}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="authorized" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unauthorized" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section Row 2: Vehicle Type Distribution & Average Stay Duration */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        {/* Chart 3: Vehicle Type Distribution */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Vehicle Type Classification Breakdown
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Detected heavy equipment, haulers, and commercial vehicles</p>
            </div>
          </div>
          <div style={{ height: 260 }} className="flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={data?.type_distribution || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(data?.type_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', fontSize: 12 }}>
              {(data?.type_distribution || []).slice(0, 5).map((item, idx) => (
                <div key={item.type} className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: TYPE_COLORS[idx % TYPE_COLORS.length] }}></span>
                    {item.type}
                  </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Average Stay Duration by Type */}
        <div className="industrial-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                Average Vehicle Stay Duration (Minutes)
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Turnaround time from entry line to exit line crossing</p>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stay_duration_by_type || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="type" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="avg_minutes" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Detections & OCR Multi-Frame Fusion Live Ticker */}
      <div className="industrial-card">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
              Recent Tracked Detections & OCR Accuracy
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Live automated plate recognition feeds from site cameras</p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onNavigate('fusion')}>
            Open Multi-Frame Fusion Inspector
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="anpr-table">
            <thead>
              <tr>
                <th>Vehicle Track ID</th>
                <th>Category</th>
                <th>Recognized Plate</th>
                <th>OCR Confidence</th>
                <th>Quality Score</th>
                <th>Permit Decision</th>
                <th>Gate Node</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentDetections.map((det) => (
                <tr key={det.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                      {det.tracking_id}
                    </span>
                  </td>
                  <td>{det.vehicle_type}</td>
                  <td>
                    <LicensePlateBadge plate={det.license_plate} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: det.ocr_confidence >= 0.85 ? '#10b981' : '#f59e0b' }}>
                      {Math.round(det.ocr_confidence * 100)}%
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="meter-bar" style={{ width: 60 }}>
                        <div
                          className="meter-fill"
                          style={{
                            width: `${det.quality_score}%`,
                            background: det.quality_score >= 70 ? '#10b981' : det.quality_score >= 45 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round(det.quality_score)}%</span>
                    </div>
                  </td>
                  <td>
                    <StatusPill status={det.authorization_status} />
                  </td>
                  <td>{det.camera_id}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>
                    {det.timestamp ? new Date(det.timestamp).toLocaleTimeString() : 'Just now'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
