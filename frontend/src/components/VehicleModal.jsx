import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function VehicleModal({ isOpen, onClose, vehicle = null, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    license_plate: '',
    vehicle_type: 'Dump Truck',
    company: '',
    driver_name: '',
    contact_number: '',
    authorization_status: 'authorized',
    permit_start_date: '',
    permit_expiry_date: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_id: vehicle.vehicle_id || '',
        license_plate: vehicle.license_plate || '',
        vehicle_type: vehicle.vehicle_type || 'Dump Truck',
        company: vehicle.company || '',
        driver_name: vehicle.driver_name || '',
        contact_number: vehicle.contact_number || '',
        authorization_status: vehicle.authorization_status || 'authorized',
        permit_start_date: vehicle.permit_start_date ? vehicle.permit_start_date.split('T')[0] : '',
        permit_expiry_date: vehicle.permit_expiry_date ? vehicle.permit_expiry_date.split('T')[0] : '',
        notes: vehicle.notes || ''
      });
    } else {
      // Default new vehicle ID
      const randomId = Math.floor(100 + Math.random() * 900);
      setFormData({
        vehicle_id: `V-SITE-${randomId}`,
        license_plate: '',
        vehicle_type: 'Dump Truck',
        company: '',
        driver_name: '',
        contact_number: '',
        authorization_status: 'authorized',
        permit_start_date: new Date().toISOString().split('T')[0],
        permit_expiry_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        notes: ''
      });
    }
    setError(null);
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate license plate
    const cleanPlate = formData.license_plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleanPlate.length < 4) {
      setError('Please enter a valid license plate (at least 4 alphanumeric characters).');
      return;
    }

    if (!formData.company.trim()) {
      setError('Please specify the contractor or company name.');
      return;
    }

    setSaving(true);
    try {
      if (vehicle?.id) {
        await api.vehicles.update(vehicle.id, { ...formData, license_plate: cleanPlate });
      } else {
        await api.vehicles.create({ ...formData, license_plate: cleanPlate });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save vehicle record.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
            {vehicle ? `Edit Vehicle (${vehicle.license_plate})` : 'Register New Site Vehicle'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 12px', borderRadius: 6, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Site Vehicle ID *
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                License Plate Number *
              </label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}
                placeholder="e.g. TN38AB1234"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Vehicle Category *
              </label>
              <select
                className="form-input"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              >
                <option value="Dump Truck">Dump Truck</option>
                <option value="Concrete Mixer">Concrete Mixer</option>
                <option value="Heavy Flatbed">Heavy Flatbed</option>
                <option value="Tipper Truck">Tipper Truck</option>
                <option value="Site Supervisor Pickup">Site Supervisor Pickup</option>
                <option value="Material Van">Material Van</option>
                <option value="Water Tanker">Water Tanker</option>
                <option value="Excavator Lowboy">Excavator Lowboy</option>
                <option value="Car">Car</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Contractor / Company *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Apex Infrastructure Ltd"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Driver Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Kumar"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Contact Phone
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98450 11223"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Authorization Status
              </label>
              <select
                className="form-input"
                value={formData.authorization_status}
                onChange={(e) => setFormData({ ...formData, authorization_status: e.target.value })}
              >
                <option value="authorized">Authorized</option>
                <option value="unauthorized">Unauthorized</option>
                <option value="expired">Permit Expired</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Permit Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.permit_start_date}
                onChange={(e) => setFormData({ ...formData, permit_start_date: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Permit Expiry Date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.permit_expiry_date}
                onChange={(e) => setFormData({ ...formData, permit_expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Notes / Site Operational Scope
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Cement pouring night shift crew, authorized for Gate 01 & 02"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between" style={{ borderTop: '1px solid #1e293b', paddingTop: 16 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
