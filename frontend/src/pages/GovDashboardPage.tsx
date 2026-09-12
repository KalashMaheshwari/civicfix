import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AdaptiveHeader } from '../components/AdaptiveHeader';
import { DesktopRail } from '../components/DesktopRail';
import { MobileDock } from '../components/MobileDock';
import { CommandPalette } from '../components/CommandPalette';
import { MetricCards } from '../components/MetricCards';
import { IncidentLedgerTable } from '../components/IncidentLedgerTable';
import { ResolveModal } from '../components/ResolveModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { Toast } from '../components/Toast';
import type { ToastMessage } from '../components/Toast';
import type { Incident } from '../types/incident';
import { fetchIncidents } from '../services/api';
import { Filter, HardHat, TrendingUp, CheckCircle, Clock, List } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatErrorMessage } from '../utils/errors';

export const GovDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [resolveIncident, setResolveIncident] = useState<Incident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);

  const currentPath = location.pathname;
  const isTicketsTab = currentPath === '/gov/tickets';
  const isAnalyticsTab = currentPath === '/gov/analytics';
  const isOverviewTab = currentPath === '/gov/dashboard' || currentPath === '/gov';

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
      addToast(formatErrorMessage(err, 'Failed to load incident records from municipal database'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const filtered = incidents.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const renderQueueList = () => (
    <>
      <div style={{ marginTop: 24, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title" style={{ fontSize: 16 }}>{t('work_order_queue')}</h2>
          <p className="section-subtitle">{t('work_order_subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '5px 10px', borderRadius: 'var(--radius-sm)' }}>
            <Filter size={13} color="var(--text-muted)" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, outline: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="ALL">{t('all')}</option>
              <option value="OPEN">{t('status_open')}</option>
              <option value="IN_PROGRESS">{t('status_in_progress')}</option>
              <option value="RESOLVED_PENDING_VERIFICATION">{t('status_verification_needed')}</option>
              <option value="CLOSED_VERIFIED">{t('status_verified_fixed')}</option>
            </select>
          </div>
        </div>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>No work orders in this triage state.</p>
        </div>
      ) : (
        <IncidentLedgerTable
          incidents={filtered}
          isLoading={isLoading}
          onActionClick={(inc) => {
            const canResolve = inc.status === 'OPEN' || inc.status === 'IN_PROGRESS' || inc.status === 'DISPUTED_REOPENED';
            if (canResolve) {
              setResolveIncident(inc);
            } else {
              setSelectedIncident(inc);
            }
          }}
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
          {isOverviewTab && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <HardHat size={16} color="var(--primary)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    MCD Engineering Command & Triage
                  </span>
                </div>
                <h1 className="section-title" style={{ fontSize: 22 }}>Ward-04 Infrastructure Operations</h1>
                <p className="section-subtitle">Real-time dispatch queue: inspect citizen reports, assign work crews, and file post-repair verification evidence.</p>
              </div>

              <MetricCards incidents={incidents} />
              {renderQueueList()}
            </>
          )}

          {isTicketsTab && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <List size={16} color="var(--primary)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Work Orders
                  </span>
                </div>
                <h1 className="section-title" style={{ fontSize: 22 }}>Municipal Issue Queue</h1>
                <p className="section-subtitle">Full priority work order queue under active municipal jurisdiction.</p>
              </div>
              {renderQueueList()}
            </>
          )}

          {isAnalyticsTab && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <TrendingUp size={16} color="var(--primary)" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Zonal Performance & Analytics
                  </span>
                </div>
                <h1 className="section-title" style={{ fontSize: 22 }}>Ward-04 Performance & SLA Compliance</h1>
                <p className="section-subtitle">Response time metrics, crew resolution throughput, and citizen sign-off acceptance rates.</p>
              </div>

              <MetricCards incidents={incidents} />

              <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Clock size={18} color="var(--status-progress-fg)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Average Resolution SLA</h3>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>4.8 hrs</div>
                  <p style={{ fontSize: 12, color: 'var(--status-verified-fg)', marginTop: 4, fontWeight: 600 }}>↑ 18% faster than zonal target</p>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle size={18} color="var(--status-verified-fg)" />
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Community Sign-Off Rate</h3>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>94.2%</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>First-time citizen approval without dispute</p>
                </div>
              </div>

              {renderQueueList()}
            </>
          )}
        </div>
      </main>

      <MobileDock />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {resolveIncident && (
        <ResolveModal
          incident={resolveIncident}
          onClose={() => setResolveIncident(null)}
          onSuccess={(msg) => {
            addToast(msg, 'success');
            loadData();
          }}
          onError={(err) => addToast(err, 'error')}
        />
      )}

      {selectedIncident && (
        <TicketDetailModal
          incident={selectedIncident}
          role="official"
          onClose={() => setSelectedIncident(null)}
        />
      )}

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
