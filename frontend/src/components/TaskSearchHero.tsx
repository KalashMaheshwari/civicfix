import React from 'react';
import { Search, ShieldCheck, MapPin, Building2, Clock } from 'lucide-react';

interface TaskSearchHeroProps {
  onSearchFocus?: () => void;
  onTagSelect?: (tag: string) => void;
}

export const TaskSearchHero: React.FC<TaskSearchHeroProps> = ({ onSearchFocus, onTagSelect }) => {
  const tags = [
    'Pothole Repair',
    'Water Line Leak',
    'Sanitation & Garbage',
    'Streetlight Failure',
    'Open Manhole',
    'Drainage Blockage'
  ];

  const handleOpen = () => {
    if (onSearchFocus) onSearchFocus();
    else document.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <div style={{ padding: '24px 0 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-xs)', fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 14 }}>
        <Building2 size={14} />
        <span>MUNICIPAL CORPORATION OF DELHI — PUBLIC WORKS DISPATCH</span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.25, color: 'var(--text-primary)' }}>
        Ward Infrastructure Registry & Issue Dispatch
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, marginBottom: 24, maxWidth: 640 }}>
        Directly lodge civic hazards, track work crew dispatches, and verify completed infrastructure repairs in your sector.
      </p>

      {/* Main Search Input */}
      <div style={{ maxWidth: 640, position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
        <input 
          type="text" 
          placeholder="Search by street name, ticket reference (#CF-...), or hazard type..." 
          style={{
            width: '100%',
            padding: '11px 110px 11px 40px',
            fontSize: 13.5,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--elevation-1)',
            outline: 'none',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            transition: 'var(--transition-fast)'
          }}
          onFocus={handleOpen}
        />
        <button 
          className="btn btn-primary btn-sm" 
          style={{ position: 'absolute', right: 4, top: 4, bottom: 4, borderRadius: 'var(--radius-xs)' }}
          onClick={handleOpen}
        >
          Search Ledger
        </button>
      </div>

      {/* Structured Category Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Quick Filters:</span>
        {tags.map((tag) => (
          <button 
            key={tag} 
            className="chip"
            onClick={() => onTagSelect ? onTagSelect(tag) : handleOpen()}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Trust & Dispatch Service Levels */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span>SLA Target: <strong>24–48 Hours</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <ShieldCheck size={14} color="var(--status-verified-fg)" />
          <span>Closed-Loop Citizen Verification</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <MapPin size={14} color="var(--status-ward-fg)" />
          <span>Jurisdiction: <strong>Ward-04 (Sector B)</strong></span>
        </div>
      </div>
    </div>
  );
};
