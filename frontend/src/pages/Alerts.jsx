import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  HelpCircle,
  CheckCircle,
  Filter,
  RefreshCw,
  UserCheck,
  Eye,
  AlertOctagon
} from 'lucide-react';
import LicensePlateBadge from '../components/LicensePlateBadge';
import AlertActionModal from '../components/AlertActionModal';
import { api } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.alerts.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const getSeverityStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: '#ef4444' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: '#f59e0b' };
      default:
        return { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8', border: '#38bdf8' };
    }
  };

  return (
    <div>
      {/* Action Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#ef4444', color: '#ffffff', padding: 8, borderRadius: 8 }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              Security & ANPR Incidents Feed
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Real-time alerts for unauthorized gate intrusions, expired contractor permits, and low-confidence OCR
            </p>
          </div>
        </div>

        <button className="btn-secondary" onClick={fetchAlerts}>
          <RefreshCw size={14} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="industrial-card" style={{ marginBottom: 20, padding: 16 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Filter Status:</span>
            {['all', 'new', 'reviewed', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: statusFilter === st ? '1px solid #f59e0b' : '1px solid #1e293b',
                  background: statusFilter === st ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                  color: statusFilter === st ? '#f59e0b' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>Severity:</span>
            <select
              className="form-input"
              style={{ width: 120, padding: '5px 10px', fontSize: 12 }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          Loading incident alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="industrial-card" style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            All Clear - No Active Alerts
          </h4>
          <p style={{ fontSize: 13 }}>No security violations or low-confidence OCR incidents matching current filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alt) => {
            const sev = getSeverityStyle(alt.severity);
            return (
              <div
                key={alt.id}
                className="industrial-card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${sev.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ flex: 1, minWidth: 320 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        background: sev.bg,
                        color: sev.text,
                        border: `1px solid ${sev.border}`,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}
                    >
                      {alt.severity} SEVERITY
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1' }}>
                      {alt.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>•</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Node: {alt.camera_id}</span>
                  </div>

                  <p style={{ fontSize: 13, color: '#f8fafc', marginBottom: 8, lineHeight: 1.4 }}>
                    {alt.message}
                  </p>

                  <div className="flex items-center gap-3">
                    <LicensePlateBadge plate={alt.license_plate} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Logged at: {new Date(alt.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: alt.status === 'new' ? '#ef4444' : alt.status === 'reviewed' ? '#f59e0b' : '#10b981',
                      color: '#ffffff'
                    }}
                  >
                    {alt.status}
                  </span>

                  <button
                    className="btn-primary"
                    style={{ padding: '7px 14px', fontSize: 12 }}
                    onClick={() => setSelectedAlert(alt)}
                  >
                    <Eye size={14} />
                    <span>Review & Act</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Action Modal */}
      {selectedAlert && (
        <AlertActionModal
          isOpen={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          alert={selectedAlert}
          onUpdated={fetchAlerts}
        />
      )}
    </div>
  );
}
