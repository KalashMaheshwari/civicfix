import React, { useState, useEffect } from 'react';
import { Search, MapPin, List, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const prefix = isOfficial ? '/gov' : '/citizen';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300, alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 0, borderRadius: 'var(--radius-md)' }}>
        {/* Search Input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Jump to report, category, or account view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13.5, outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
          <button 
            onClick={onClose} 
            style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
          >
            ESC
          </button>
        </div>
        
        <div style={{ padding: '6px 8px 10px', maxHeight: 360, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            System Routes
          </div>
          
          {!isOfficial && (
            <button className="rail-link" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: 2 }} onClick={() => handleAction('/citizen/new')}>
              <MapPin size={16} color="var(--status-open-fg)" />
              <span style={{ fontWeight: 500, fontSize: 13.5 }}>Lodge new civic issue report</span>
            </button>
          )}

          <button className="rail-link" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: 2 }} onClick={() => handleAction(`${prefix}/tickets`)}>
            <List size={16} color="var(--status-vote-fg)" />
            <span style={{ fontWeight: 500, fontSize: 13.5 }}>View public reports ledger</span>
          </button>

          <button className="rail-link" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleAction(`${prefix}/profile`)}>
            <User size={16} color="var(--status-verified-fg)" />
            <span style={{ fontWeight: 500, fontSize: 13.5 }}>Citizen registry & preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
