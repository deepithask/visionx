import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, HardHat, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please use admin / admin123.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #152238 0%, #070b14 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: '#0f172a',
          border: '1px solid #202e47',
          borderRadius: 14,
          padding: 36,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Hazard Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)'
          }}
        />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090d16',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              marginBottom: 14
            }}
          >
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.5 }}>
            VisionSite <span style={{ color: '#f59e0b' }}>ANPR</span>
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Construction Site Vehicle & License Plate Monitoring System
          </p>
        </div>

        {/* Demo Credentials Quick Badge */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 12,
            color: '#f8fafc'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 11, textTransform: 'uppercase' }}>
              Prototype Credentials
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Auto-filled</span>
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
            User: <strong style={{ color: '#f59e0b' }}>admin</strong> | Pass: <strong style={{ color: '#f59e0b' }}>admin123</strong>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Security Officer / Admin Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Access Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: 14 }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating Site Session...' : 'Authorize & Enter Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Note */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
          Authorized Personnel Only. All Gate Access Events are Logged.
        </div>
      </div>
    </div>
  );
}
