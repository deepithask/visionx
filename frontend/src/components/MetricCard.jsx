import React from 'react';

export default function MetricCard({ title, value, icon: Icon, color = 'amber', subtext, trend }) {
  const colorMap = {
    amber: { border: '#f59e0b', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    green: { border: '#10b981', text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    red: { border: '#ef4444', text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    blue: { border: '#38bdf8', text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
    purple: { border: '#a855f7', text: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' }
  };

  const c = colorMap[color] || colorMap.amber;

  return (
    <div className="industrial-card" style={{ borderLeft: `4px solid ${c.border}` }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#94a3b8' }}>
          {title}
        </span>
        <div style={{ padding: 8, borderRadius: 8, background: c.bg, color: c.text }}>
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.5, marginBottom: 4 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend && (
            <span style={{ color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
