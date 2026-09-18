import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import LicensePlateBadge from '../components/LicensePlateBadge';
import StatusPill from '../components/StatusPill';
import GlobalSearchModal from '../components/GlobalSearchModal';
import { api } from '../services/api';

export default function VehicleHistory() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authFilter, setAuthFilter] = useState('all');
  const [selectedPlate, setSelectedPlate] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.history.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        auth_status: authFilter !== 'all' ? authFilter : undefined,
      });
      setHistoryLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, authFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div>
      {/* Top Action Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <History size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              Vehicle Entry & Exit Audit History
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Historical virtual gate crossing timestamps, turnaround duration, and security clearance logs
            </p>
          </div>
        </div>

        <button className="btn-secondary" onClick={fetchHistory}>
          <RefreshCw size={14} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="industrial-card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="flex items-center gap-2" style={{ maxWidth: 360, width: '100%' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search plate number, vehicle ID, or contractor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              <Search size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
            <div className="flex items-center gap-1">
              <span style={{ color: '#94a3b8' }}>Gate Status:</span>
              <select
                className="form-input"
                style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Logs</option>
                <option value="inside">Currently Inside</option>
                <option value="exited">Exited Site</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span style={{ color: '#94a3b8' }}>Clearance:</span>
              <select
                className="form-input"
                style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
                value={authFilter}
                onChange={(e) => setAuthFilter(e.target.value)}
              >
                <option value="all">All Clearances</option>
                <option value="authorized">Authorized</option>
                <option value="unauthorized">Unauthorized</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* History Log Table */}
      <div className="industrial-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="anpr-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>License Plate</th>
                <th>Vehicle Type</th>
                <th>Contractor</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Stay Duration</th>
                <th>Gate Clearance</th>
                <th>Gate Node</th>
                <th style={{ textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Loading vehicle entry/exit history...
                  </td>
                </tr>
              ) : historyLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    No audit records found matching query.
                  </td>
                </tr>
              ) : (
                historyLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.entry_time).toLocaleDateString()}
                    </td>
                    <td>
                      <LicensePlateBadge plate={log.license_plate} isCommercial={log.vehicle_type.includes('Truck') || log.vehicle_type.includes('Mixer')} />
                    </td>
                    <td>{log.vehicle_type}</td>
                    <td style={{ color: '#cbd5e1' }}>{log.company || 'Unknown'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
                      {new Date(log.entry_time).toLocaleTimeString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: log.exit_time ? '#f8fafc' : '#f59e0b' }}>
                      {log.exit_time ? new Date(log.exit_time).toLocaleTimeString() : '---'}
                    </td>
                    <td>
                      {log.duration_minutes ? (
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: log.duration_minutes > 90 ? '#f59e0b' : '#38bdf8'
                          }}
                        >
                          {log.duration_minutes} min
                        </span>
                      ) : (
                        <span className="live-indicator">
                          <span className="pulse-circle"></span>
                          INSIDE SITE
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusPill status={log.authorization_status} />
                    </td>
                    <td>{log.camera_id}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => setSelectedPlate(log.license_plate)}
                        title="View Full Profile & Visits"
                      >
                        <ExternalLink size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Plate Profile Drawer Modal */}
      {selectedPlate && (
        <GlobalSearchModal
          isOpen={Boolean(selectedPlate)}
          onClose={() => setSelectedPlate(null)}
          initialQuery={selectedPlate}
        />
      )}
    </div>
  );
}
