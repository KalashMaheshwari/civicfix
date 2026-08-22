import React, { useState, useEffect } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReportIssueForm } from '../components/ReportIssueForm';
import { IncidentCard } from '../components/IncidentCard';
import { Toast } from '../components/Toast';
import type { ToastMessage } from '../components/Toast';
import type { Incident } from '../types/incident';
import { fetchIncidents, submitCitizenVote } from '../services/api';

export const CitizenDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
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
      addToast('Failed to load community incidents', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVote = async (incidentId: string, isFixed: boolean) => {
    if (!user) return;
    try {
      await submitCitizenVote(incidentId, user.id, isFixed);
      addToast(
        isFixed
          ? 'Confirmed as Fixed. Thank you for verifying!'
          : 'Flagged as Unresolved. Escalated to MCD dashboard.',
        'success'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit vote', 'error');
    }
  };

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
            <div className="brand-icon">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <span>CivicFix Citizen</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="user-badge">{user?.full_name || 'Citizen'} ({user?.civic_points || 10} pts)</span>
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
        <ReportIssueForm
          citizenId={user?.id || 'anonymous'}
          onSuccess={(msg) => {
            addToast(msg, 'success');
            loadData();
          }}
          onError={(err) => addToast(err, 'error')}
        />

        <div className="section-header">
          <div>
            <h2 className="section-title">Community Issues & Verifications</h2>
            <p className="section-subtitle">
              Track public safety hazards in your ward and verify completed repairs with before & after photos.
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-pills">
            <button className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
              All Issues
            </button>
            <button
              className={`filter-pill ${filter === 'RESOLVED_PENDING_VERIFICATION' ? 'active' : ''}`}
              onClick={() => setFilter('RESOLVED_PENDING_VERIFICATION')}
            >
              Needs Citizen Vote
            </button>
            <button className={`filter-pill ${filter === 'OPEN' ? 'active' : ''}`} onClick={() => setFilter('OPEN')}>
              Open
            </button>
            <button
              className={`filter-pill ${filter === 'CLOSED_VERIFIED' ? 'active' : ''}`}
              onClick={() => setFilter('CLOSED_VERIFIED')}
            >
              Verified Fixed
            </button>
            <button
              className={`filter-pill ${filter === 'DISPUTED_REOPENED' ? 'active' : ''}`}
              onClick={() => setFilter('DISPUTED_REOPENED')}
            >
              Disputed
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
            No matching civic issues in this filter.
          </div>
        ) : (
          <div className="incidents-grid">
            {filtered.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                role="citizen"
                onVote={handleVote}
                onOpenResolve={() => {}}
              />
            ))}
          </div>
        )}
      </main>

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
