import React from 'react';

export default function LicensePlateBadge({ plate, isCommercial = false, className = '' }) {
  if (!plate || plate === 'DETECTING...' || plate === 'READING...') {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-400">
        {plate || '---'}
      </span>
    );
  }

  // Format with space if standard 10 chars (e.g. TN 38 AB 1234)
  let formatted = plate.toUpperCase().trim();
  if (formatted.length === 10) {
    formatted = `${formatted.slice(0, 2)} ${formatted.slice(2, 4)} ${formatted.slice(4, 6)} ${formatted.slice(6)}`;
  }

  return (
    <div className={`license-plate-badge ${isCommercial ? 'commercial-yellow' : ''} ${className}`}>
      <span className="plate-flag">IND</span>
      <span>{formatted}</span>
    </div>
  );
}
