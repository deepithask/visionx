import React, { useState, useEffect } from 'react';
import { Search, X, ShieldCheck, AlertOctagon, Clock, Truck, User, Phone, Building, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';
import LicensePlateBadge from './LicensePlateBadge';
import StatusPill from './StatusPill';

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialQuery && isOpen) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSearch = async (queryText) => {
    const q = (queryText || searchQuery).trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.search.query(q);
      setResult(data);
    } catch (err) {
      setError('No matching vehicle or license plate record found.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between" style={{ padding: '18px 24px', borderBottom: '1px solid #1e293b' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: '#f59e0b', color: '#090d16', padding: 6, borderRadius: 6 }}>
              <Search size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Global License Plate Audit & Search</h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Search any plate number to inspect authorization, visit logs, and detection crops</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Input */}
        <div style={{ padding: '16px 24px', background: '#0e172a', borderBottom: '1px solid #1e293b' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              className="form-input"
              style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase' }}
              placeholder="e.g. TN38AB1234, MH12DE4567, TN40XX9999..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Results Body */}
        <div style={{ padding: 24 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              Querying database and computer vision detection index...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#ef4444' }}>
              {error}
            </div>
          )}

          {result && (
            <div>
              {/* Profile Card */}
              <div
                className="industrial-card"
                style={{
                  background: '#0e1628',
                  border: '1px solid #233454',
                  padding: 20,
                  marginBottom: 20
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <div className="flex items-center gap-3">
                    <LicensePlateBadge plate={result.matched_plate} isCommercial={result.vehicle?.vehicle_type?.includes('Truck') || result.vehicle?.vehicle_type?.includes('Mixer')} />
                    <StatusPill status={result.vehicle?.authorization_status} />
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    ID: {result.vehicle?.vehicle_id || 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4" style={{ fontSize: 13 }}>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <Truck size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Type:</strong> {result.vehicle?.vehicle_type || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <Building size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Company:</strong> {result.vehicle?.company || 'Unregistered'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <User size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Driver:</strong> {result.vehicle?.driver_name || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <Phone size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Contact:</strong> {result.vehicle?.contact_number || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <Calendar size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Permit Valid:</strong> {result.vehicle?.permit_expiry_date ? new Date(result.vehicle.permit_expiry_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                    <strong style={{ color: '#94a3b8' }}>Total Visits:</strong> {result.stats?.total_visits} visits recorded
                  </div>
                </div>

                {result.vehicle?.notes && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1e293b', fontSize: 12, color: '#94a3b8' }}>
                    <strong>Contractor Notes:</strong> {result.vehicle.notes}
                  </div>
                )}
              </div>

              {/* Visit History Table */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
                Recent Site Visits & Duration Log
              </h4>
              {result.visits && result.visits.length > 0 ? (
                <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                  <table className="anpr-table">
                    <thead>
                      <tr>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Duration</th>
                        <th>Gate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.visits.map((v) => (
                        <tr key={v.id}>
                          <td>{new Date(v.entry_time).toLocaleString()}</td>
                          <td>{v.exit_time ? new Date(v.exit_time).toLocaleTimeString() : '---'}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: v.duration_minutes > 90 ? '#f59e0b' : '#38bdf8' }}>
                              {v.duration_minutes ? `${v.duration_minutes} min` : 'Currently Inside'}
                            </span>
                          </td>
                          <td>{v.camera_id}</td>
                          <td>
                            <span style={{ fontSize: 11, textTransform: 'uppercase', color: v.status === 'inside' ? '#10b981' : '#94a3b8' }}>
                              ● {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>No previous entry/exit logs recorded for this plate.</p>
              )}

              {/* Alerts associated with this plate */}
              {result.alerts && result.alerts.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertOctagon size={16} /> Security Incident Alerts ({result.alerts.length})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {result.alerts.map((alt) => (
                      <div
                        key={alt.id}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 6,
                          padding: '10px 14px',
                          fontSize: 12
                        }}
                      >
                        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
                            {alt.alert_type.replace(/_/g, ' ')}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>
                            {new Date(alt.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ color: '#e2e8f0' }}>{alt.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
