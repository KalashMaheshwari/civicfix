import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { BentoCategoryGrid } from '../components/BentoCategoryGrid';
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
import { Globe, UserCheck, PlusCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatErrorMessage } from '../utils/errors';
import { useNavigate } from 'react-router-dom';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'MY_TICKETS'>('ALL');
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
    } catch (err: any) {
      addToast(formatErrorMessage(err, 'Unable to load reports from municipal ledger'), 'error');
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
      addToast(formatErrorMessage(err, 'Failed to submit verification'), 'error');
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
      addToast(formatErrorMessage(err, 'Failed to submit dispute'), 'error');
      throw err;
    }
  };

  const myTicketsCount = incidents.filter((item) => {
    return Boolean(
      user &&
      item.citizen_ids &&
      (item.citizen_ids.includes(user.id) || (user.email && item.citizen_ids.includes(user.email)))
    );
  }).length;

  const filtered = incidents.filter((item) => {
    if (scopeFilter === 'MY_TICKETS') {
      const isMine = Boolean(
        user &&
        item.citizen_ids &&
        (item.citizen_ids.includes(user.id) || (user.email && item.citizen_ids.includes(user.email)))
      );
      if (!isMine) return false;
    }
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const renderReportsList = () => (
    <>
      {/* Scope Segmented Switch: All Ward vs My Registered Tickets */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-subtle, #f1f5f9)', padding: 3, borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--border-default, #e2e8f0)' }}>
          <button
            type="button"
            onClick={() => setScopeFilter('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: 'none',
              background: scopeFilter === 'ALL' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: scopeFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: scopeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={14} color={scopeFilter === 'ALL' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>All Ward Issues</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: scopeFilter === 'ALL' ? 'var(--primary-bg, #eff6ff)' : 'transparent', color: scopeFilter === 'ALL' ? 'var(--primary)' : 'var(--text-muted)' }}>
              {incidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('MY_TICKETS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 'var(--radius-xs, 6px)',
              border: 'none',
              background: scopeFilter === 'MY_TICKETS' ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: scopeFilter === 'MY_TICKETS' ? 'var(--primary, #0284c7)' : 'var(--text-muted)',
              boxShadow: scopeFilter === 'MY_TICKETS' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={14} color={scopeFilter === 'MY_TICKETS' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>My Registered Tickets</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: scopeFilter === 'MY_TICKETS' ? 'var(--primary)' : 'var(--border-default)', color: scopeFilter === 'MY_TICKETS' ? '#ffffff' : 'var(--text-muted)' }}>
              {myTicketsCount}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="filter-strip" style={{ margin: 0, padding: 0 }}>
          <button className={`chip ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
          <button className={`chip ${filter === 'OPEN' ? 'active' : ''}`} onClick={() => setFilter('OPEN')}>Open</button>
          <button className={`chip ${filter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setFilter('IN_PROGRESS')}>In Progress</button>
          <button className={`chip ${filter === 'RESOLVED_PENDING_VERIFICATION' ? 'active' : ''}`} onClick={() => setFilter('RESOLVED_PENDING_VERIFICATION')}>Verification Needed</button>
          <button className={`chip ${filter === 'CLOSED_VERIFIED' ? 'active' : ''}`} onClick={() => setFilter('CLOSED_VERIFIED')}>Verified Fixed</button>
        </div>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {scopeFilter === 'MY_TICKETS'
              ? 'No tickets filed by you in this view.'
              : 'No issues found matching the selected status.'}
          </p>
          <p style={{ fontSize: 13, marginTop: 6, maxWidth: 420, margin: '6px auto 16px' }}>
            {scopeFilter === 'MY_TICKETS'
              ? 'When you lodge a civic report, your ticket will appear here with live repair updates and verification sign-offs.'
              : 'Check back shortly or lodge a new civic report for Ward-04.'}
          </p>
          {scopeFilter === 'MY_TICKETS' && (
            <button
              onClick={() => navigate('/citizen/new')}
              className="btn btn-primary"
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <PlusCircle size={15} />
              <span>Lodge a Civic Report</span>
            </button>
          )}
        </div>
      ) : (
        <IncidentLedgerTable 
          incidents={filtered} 
          isLoading={isLoading} 
          onActionClick={(inc) => setSelectedIncident(inc)} 
        />
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
