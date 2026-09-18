import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Video,
  Layers,
  Database,
  History,
  AlertTriangle,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Shield,
  HardHat,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import GlobalSearchModal from './GlobalSearchModal';
import { api } from '../services/api';

export default function Layout({ currentTab, onTabChange, onLogout, children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [newAlertCount, setNewAlertCount] = useState(2);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const user = api.auth.getUser();

  useEffect(() => {
    // 24h industrial clock
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC+5:30');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll alerts count periodically
  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        const data = await api.alerts.list({ status: 'new' });
        setNewAlertCount(data.length);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 8000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Video, badge: 'LIVE' },
    { id: 'fusion', label: 'OCR Fusion Inspector', icon: Layers, highlight: true },
    { id: 'vehicles', label: 'Vehicle Management', icon: Database },
    { id: 'history', label: 'Vehicle History', icon: History },
    { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle, count: newAlertCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1a253b' }}>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#090d16',
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Shield size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.3, lineHeight: 1.1 }}>
                VisionSite <span style={{ color: '#f59e0b' }}>ANPR</span>
              </h1>
              <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
                Heavy Vehicle Sentinel
              </span>
            </div>
          </div>

          {/* Active Gate Selector */}
          <div
            style={{
              marginTop: 14,
              padding: '8px 10px',
              background: '#090f1d',
              borderRadius: 6,
              border: '1px solid #1e293b',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div className="flex items-center gap-2" style={{ color: '#cbd5e1' }}>
              <Radio size={12} color="#10b981" />
              <span>Gate-01: Main North</span>
            </div>
            <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>ONLINE</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: 1, padding: '0 10px 8px' }}>
            Site Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: active ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: active ? '#f59e0b' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: 3,
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} color={active ? '#f59e0b' : '#64748b'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="live-indicator">
                    <span className="pulse-circle"></span>
                    {item.badge}
                  </span>
                )}

                {item.highlight && !item.badge && (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: 3
                    }}
                  >
                    NOVEL
                  </span>
                )}

                {item.count > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 10
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1a253b', background: '#090f1d' }}>
          <div className="flex items-center justify-between">
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                {user.role} | Site Gate
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout session"
              style={{
                background: '#1b253b',
                border: '1px solid #283750',
                borderRadius: 6,
                padding: '6px 8px',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="header">
          {/* Global Search Bar */}
          <div style={{ maxWidth: 460, width: '100%' }}>
            <div
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#090f1d',
                border: '1px solid #202e47',
                borderRadius: 6,
                padding: '7px 14px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: 13
              }}
            >
              <Search size={16} color="#f59e0b" />
              <span>Search license plate (e.g. TN38AB1234)...</span>
              <span style={{ marginLeft: 'auto', background: '#1b253b', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#94a3b8' }}>
                /
              </span>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4">
            {/* Operational Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: isDemoMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: isDemoMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                color: isDemoMode ? '#38bdf8' : '#10b981',
                cursor: 'pointer'
              }}
              onClick={() => setIsDemoMode(!isDemoMode)}
              title="Toggle between Real AI Model Pipeline and Pre-loaded Demo Mode"
            >
              <Sparkles size={13} />
              <span>{isDemoMode ? 'MODE: DEMO SIMULATION' : 'MODE: REAL AI PIPELINE'}</span>
            </div>

            {/* Industrial Site Clock */}
            <div className="flex items-center gap-2" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              <Clock size={14} color="#f59e0b" />
              <span>{clockTime}</span>
            </div>
          </div>
        </header>

        {/* Global Search Pop-up Modal */}
        <GlobalSearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          initialQuery={searchQuery}
        />

        {/* Content Body Slot */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
