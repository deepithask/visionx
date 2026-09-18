import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Shield, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import LicensePlateBadge from './LicensePlateBadge';

export default function AlertActionModal({ isOpen, onClose, alert = null, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authData, setAuthData] = useState({
    company: '',
    vehicle_type: 'Tipper Truck',
    driver_name: '',
    contact_number: '',
    notes: 'Granted authorization from security incident panel'
  });

  if (!isOpen || !alert) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.alerts.updateStatus(alert.id, newStatus);
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.alerts.quickAuthorize(alert.id, authData);
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              Incident Alert #{alert.id}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <div style={{ background: '#0e1628', padding: 16, borderRadius: 8, border: '1px solid #202e47', marginBottom: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#f87171' }}>
                {alert.alert_type.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date(alert.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <LicensePlateBadge plate={alert.license_plate} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Camera: {alert.camera_id}</span>
            </div>

            <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
              {alert.message}
            </p>
          </div>

          {!showAuthForm ? (
            <div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                Review this incident and choose an administrative action:
              </p>
              <div className="flex flex-col gap-2">
                {alert.status === 'new' && (
                  <button
                    className="btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: 12 }}
                    onClick={() => handleStatusChange('reviewed')}
                    disabled={loading}
                  >
                    <CheckCircle size={16} color="#38bdf8" />
                    Mark as Reviewed (Acknowledge Incident)
                  </button>
                )}

                {alert.status !== 'resolved' && (
                  <button
                    className="btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: 12 }}
                    onClick={() => handleStatusChange('resolved')}
                    disabled={loading}
                  >
                    <CheckCircle size={16} color="#10b981" />
                    Mark as Resolved (No Action Required)
                  </button>
                )}

                {alert.alert_type === 'unauthorized_vehicle' && (
                  <button
                    className="btn-primary"
                    style={{ justifyContent: 'flex-start', padding: 12, marginTop: 6 }}
                    onClick={() => setShowAuthForm(true)}
                  >
                    <UserCheck size={16} />
                    Whitelist & Authorize This Vehicle Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuthorize}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>
                Quick Contractor Whitelisting
              </h4>
              <div className="flex flex-col gap-3" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>Contractor / Company Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. BuildCorp Heavy Logistics"
                    value={authData.company}
                    onChange={(e) => setAuthData({ ...authData, company: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8' }}>Vehicle Category</label>
                  <select
                    className="form-input"
                    value={authData.vehicle_type}
                    onChange={(e) => setAuthData({ ...authData, vehicle_type: e.target.value })}
                  >
                    <option value="Dump Truck">Dump Truck</option>
                    <option value="Concrete Mixer">Concrete Mixer</option>
                    <option value="Tipper Truck">Tipper Truck</option>
                    <option value="Heavy Flatbed">Heavy Flatbed</option>
                    <option value="Site Supervisor Pickup">Site Supervisor Pickup</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setShowAuthForm(false)}>
                  Back
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Authorizing...' : 'Confirm Authorization'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
