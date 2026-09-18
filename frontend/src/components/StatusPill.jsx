import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';

export default function StatusPill({ status }) {
  const norm = (status || 'detecting').toLowerCase();

  if (norm === 'authorized') {
    return (
      <span className="status-pill authorized">
        <CheckCircle2 size={12} />
        Authorized
      </span>
    );
  }

  if (norm === 'unauthorized') {
    return (
      <span className="status-pill unauthorized">
        <AlertTriangle size={12} />
        Unauthorized
      </span>
    );
  }

  if (norm === 'expired') {
    return (
      <span className="status-pill expired">
        <Clock size={12} />
        Permit Expired
      </span>
    );
  }

  if (norm === 'low_confidence') {
    return (
      <span className="status-pill low_confidence">
        <HelpCircle size={12} />
        Low Confidence
      </span>
    );
  }

  return (
    <span className="status-pill" style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
      Detecting...
    </span>
  );
}
