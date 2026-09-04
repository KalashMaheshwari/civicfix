import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { BentoCategoryGrid } from '../components/BentoCategoryGrid';
import { IncidentCard } from '../components/IncidentCard';
import { IncidentLedgerTable } from '../components/IncidentLedgerTable';
import { MetricCards } from '../components/MetricCards';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { CitizenFeedbackModal } from '../components/CitizenFeedbackModal';
import { Toast } from '../components/Toast';
import type { ToastMessage } from '../components/Toast';
import type { Incident } from '../types/incident';
import { fetchIncidents, submitCitizenVote } from '../services/api';
import { AdaptiveHeader } from '../components/AdaptiveHeader';
import { DesktopRail } from '../components/DesktopRail';
import { MobileDock } from '../components/MobileDock';
import { CommandPalette } from '../components/CommandPalette';
import { LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>(window.innerWidth >= 1024 ? 'TABLE' : 'GRID');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [disputeIncidentId, setDisputeIncidentId] = useState<string | null>(null);

  const currentPath = location.pathname;
  const isTicketsPage = currentPath === '/citizen/tickets';
  const isAnalyticsPage = currentPath === '/citizen/analytics';
  const isHomePage = currentPath === '/citizen';

  useEffect(() => {
    const handler = () => setCmdOpen(true);
    document.addEventListener('open-command-palette', handler);
    return () => document.removeEventListener('open-command-palette', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setViewMode('GRID');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async (showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true);
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch {
      addToast('Unable to load reports from municipal ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleVote = async (incidentId: string, isFixed: boolean) => {
    if (!user) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      await submitCitizenVote(incidentId, user.id, isFixed);
      addToast('Sign-off recorded! Thank you for verifying municipal repairs.', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit verification', 'error');
    }
  };

  const handleVoteWithProof = async (incidentId: string, isFixed: boolean, comment: string, file: File | undefined) => {
    if (!user) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
      await submitCitizenVote(incidentId, user.id, isFixed, comment, file);
      addToast('Dispute logged with evidence. The ticket has been escalated to MCD Chief Engineer.', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit dispute', 'error');
      throw err;
    }
  };

  const filtered = incidents.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const renderReportsList = () => (
    <>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="filter-strip" style={{ margin: 0, padding: 0 }}>
          <button className={`chip ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
          <button className={`chip ${filter === 'OPEN' ? 'active' : ''}`} onClick={() => setFilter('OPEN')}>Open</button>
          <button className={`chip ${filter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setFilter('IN_PROGRESS')}>In Progress</button>
          <button className={`chip ${filter === 'RESOLVED_PENDING_VERIFICATION' ? 'active' : ''}`} onClick={() => setFilter('RESOLVED_PENDING_VERIFICATION')}>Verification Needed</button>
          <button className={`chip ${filter === 'CLOSED_VERIFIED' ? 'active' : ''}`} onClick={() => setFilter('CLOSED_VERIFIED')}>Verified Fixed</button>
        </div>

        {window.innerWidth >= 1024 && (
          <div style={{ display: 'flex', gap: 2, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', padding: 2, background: 'var(--bg-surface)' }}>
            <button onClick={() => setViewMode('TABLE')} style={{ background: viewMode === 'TABLE' ? 'var(--bg-subtle)' : 'transparent', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-xs)', cursor: 'pointer', color: viewMode === 'TABLE' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('GRID')} style={{ background: viewMode === 'GRID' ? 'var(--bg-subtle)' : 'transparent', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-xs)', cursor: 'pointer', color: viewMode === 'GRID' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <LayoutGrid size={14} />
            </button>
          </div>
        )}
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>No issues found matching the selected status.</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Check back shortly or lodge a new civic report.</p>
        </div>
      ) : viewMode === 'TABLE' ? (
        <IncidentLedgerTable incidents={filtered} isLoading={isLoading} onActionClick={(inc) => setSelectedIncident(inc)} />
      ) : (
        <div className="incidents-grid">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`skel-card-${idx}`} className="card" style={{ height: 260, display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
                <div className="skeleton" style={{ width: '100%', height: 130, borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton" style={{ width: '60%', height: 18, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '90%', height: 14, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4, marginTop: 'auto' }} />
              </div>
            ))
          ) : (
            filtered.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                role="citizen"
                onVote={handleVote}
                onOpenResolve={() => {}}
                onOpenDispute={(id) => setDisputeIncidentId(id)}
              />
            ))
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="app-layout">
      <DesktopRail />

      <main className="app-stage">
        <AdaptiveHeader 
          onSelectIncident={(inc) => setSelectedIncident(inc)} 
        />

        <div className="stage-container">
          {isHomePage && (
            <>
              <BentoCategoryGrid />
              <div style={{ marginTop: 8, marginBottom: 14 }}>
                <h2 className="section-title">{t('public_ledger_title')}</h2>
                <p className="section-subtitle">{t('public_ledger_subtitle')}</p>
              </div>
              {renderReportsList()}
            </>
          )}

          {isTicketsPage && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 className="section-title">{t('reports_tab_title')}</h1>
                <p className="section-subtitle">{t('reports_tab_subtitle')}</p>
              </div>
              {renderReportsList()}
            </>
          )}

          {isAnalyticsPage && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 className="section-title">{t('metrics_tab_title')}</h1>
                <p className="section-subtitle">{t('metrics_tab_subtitle')}</p>
              </div>
              <MetricCards incidents={incidents} />
              <div style={{ marginTop: 28 }}>
                <h2 className="section-title">{t('public_ledger_title')}</h2>
                <p className="section-subtitle">{t('public_ledger_subtitle')}</p>
                <div style={{ marginTop: 14 }}>
                  {renderReportsList()}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <MobileDock />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      
      {selectedIncident && (
        <TicketDetailModal
          incident={selectedIncident}
          role="citizen"
          onClose={() => setSelectedIncident(null)}
          onVote={handleVote}
          onOpenDispute={(id) => setDisputeIncidentId(id)}
        />
      )}

      {disputeIncidentId && (
        <CitizenFeedbackModal
          incidentId={disputeIncidentId}
          onClose={() => setDisputeIncidentId(null)}
          onSubmitFeedback={handleVoteWithProof}
        />
      )}

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
