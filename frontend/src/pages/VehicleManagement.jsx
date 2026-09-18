import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Truck,
  Building
} from 'lucide-react';
import LicensePlateBadge from '../components/LicensePlateBadge';
import StatusPill from '../components/StatusPill';
import VehicleModal from '../components/VehicleModal';
import { api } from '../services/api';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.vehicles.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vehicle_type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleDelete = async (v) => {
    if (confirm(`Are you sure you want to delete vehicle ${v.license_plate} (${v.company}) from the database?`)) {
      try {
        await api.vehicles.delete(v.id);
        fetchVehicles();
      } catch (err) {
        alert('Failed to delete vehicle: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div>
      {/* Top Action Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ background: '#f59e0b', color: '#090d16', padding: 8, borderRadius: 8 }}>
            <Database size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3 }}>
              Construction Site Vehicle Database
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Authorized contractors, site delivery fleet, driver profiles, and security clearance permits
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingVehicle(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Register New Vehicle</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="industrial-card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="flex items-center gap-2" style={{ maxWidth: 380, width: '100%' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search plate, vehicle ID, contractor, or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              <Search size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
            <div className="flex items-center gap-1">
              <span style={{ color: '#94a3b8' }}>Status:</span>
              <select
                className="form-input"
                style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="authorized">Authorized</option>
                <option value="unauthorized">Unauthorized</option>
                <option value="expired">Permit Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span style={{ color: '#94a3b8' }}>Category:</span>
              <select
                className="form-input"
                style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Dump Truck">Dump Truck</option>
                <option value="Concrete Mixer">Concrete Mixer</option>
                <option value="Heavy Flatbed">Heavy Flatbed</option>
                <option value="Tipper Truck">Tipper Truck</option>
                <option value="Site Supervisor Pickup">Site Supervisor Pickup</option>
                <option value="Material Van">Material Van</option>
                <option value="Water Tanker">Water Tanker</option>
              </select>
            </div>

            <button type="button" className="btn-secondary" onClick={fetchVehicles} title="Refresh Table">
              <RefreshCw size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Vehicles Table */}
      <div className="industrial-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="anpr-table">
            <thead>
              <tr>
                <th>Site Vehicle ID</th>
                <th>License Plate</th>
                <th>Vehicle Type</th>
                <th>Contractor / Company</th>
                <th>Driver & Contact</th>
                <th>Permit Validity</th>
                <th>Authorization Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Loading vehicle database records...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    No vehicles found matching current search or filter criteria.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                        {v.vehicle_id}
                      </span>
                    </td>
                    <td>
                      <LicensePlateBadge plate={v.license_plate} isCommercial={v.vehicle_type.includes('Truck') || v.vehicle_type.includes('Mixer')} />
                    </td>
                    <td>{v.vehicle_type}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{v.company}</span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.driver_name || '---'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{v.contact_number || 'No contact'}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        Expires: {v.permit_expiry_date ? new Date(v.permit_expiry_date).toLocaleDateString() : 'Continuous'}
                      </div>
                    </td>
                    <td>
                      <StatusPill status={v.authorization_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: 11 }}
                          onClick={() => {
                            setEditingVehicle(v);
                            setModalOpen(true);
                          }}
                          title="Edit vehicle"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: 11, color: '#ef4444' }}
                          onClick={() => handleDelete(v)}
                          title="Delete vehicle"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={editingVehicle}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}
