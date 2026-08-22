import React, { useState, useEffect } from 'react';
import { Building2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MetricCards } from '../components/MetricCards';
import { IncidentCard } from '../components/IncidentCard';
import { ResolveModal } from '../components/ResolveModal';
import { Toast } from '../components/Toast';
import type { ToastMessage } from '../components/Toast';
import type { Incident } from '../types/incident';
import { fetchIncidents } from '../services/api';

export const GovDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [resolveIncidentId, setResolveIncidentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch {
      addToast('Failed to load incident records', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = incidents.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="brand-icon" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              <Building2 size={16} strokeWidth={2.5} />
            </div>
            <span>MCD Incident Dispatch & Triage</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="user-badge" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}>
              {user?.full_name} ({user?.department || 'MCD'}) [{user?.official_badge_id || 'ID'}]
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Sign Out"
              style={{ padding: '5px 10px' }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        <MetricCards incidents={incidents} />

        <div className="section-header">
          <div>
            <h2 className="section-title">Priority Triage & Dispatch Queue</h2>
            <p className="section-subtitle">
              Incidents prioritized by AI severity weight, duplicate volume, and municipal urgency score.
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-pills">
            <button className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
              All Records
            </button>
            <button className={`filter-pill ${filter === 'OPEN' ? 'active' : ''}`} onClick={() => setFilter('OPEN')}>
              Action Required (Open)
            </button>
            <button
              className={`filter-pill ${filter === 'DISPUTED_REOPENED' ? 'active' : ''}`}
              onClick={() => setFilter('DISPUTED_REOPENED')}
            >
              Disputed / Reopened
            </button>
            <button
              className={`filter-pill ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setFilter('IN_PROGRESS')}
            >
              In Progress
            </button>
            <button
              className={`filter-pill ${filter === 'RESOLVED_PENDING_VERIFICATION' ? 'active' : ''}`}
              onClick={() => setFilter('RESOLVED_PENDING_VERIFICATION')}
            >
              Pending Citizen Vote
            </button>
            <button
              className={`filter-pill ${filter === 'CLOSED_VERIFIED' ? 'active' : ''}`}
              onClick={() => setFilter('CLOSED_VERIFIED')}
            >
              Verified Closed
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
            No incidents in this triage filter.
          </div>
        ) : (
          <div className="incidents-grid">
            {filtered.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                role="official"
                onVote={() => {}}
                onOpenResolve={(id) => setResolveIncidentId(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Official Resolution Modal */}
      <ResolveModal
        incidentId={resolveIncidentId}
        onClose={() => setResolveIncidentId(null)}
        onSuccess={(msg) => {
          addToast(msg, 'success');
          loadData();
        }}
        onError={(err) => addToast(err, 'error')}
      />

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
