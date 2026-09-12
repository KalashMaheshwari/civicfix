import React from 'react';
import { ExternalLink, Image as ImageIcon, MapPin, UserCheck } from 'lucide-react';
import type { Incident } from '../types/incident';
import { formatImageUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface IncidentLedgerTableProps {
  incidents: Incident[];
  isLoading?: boolean;
  onActionClick?: (incident: Incident) => void;
}

export const IncidentLedgerTable: React.FC<IncidentLedgerTableProps> = ({ incidents, isLoading = false, onActionClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const formatStatus = (status: string) => {
    switch (status) {
      case 'OPEN': return t('status_open');
      case 'IN_PROGRESS': return t('status_in_progress');
      case 'RESOLVED_PENDING_VERIFICATION': return t('status_verification_needed');
      case 'CLOSED_VERIFIED': return t('status_verified_fixed');
      case 'DISPUTED_REOPENED': return t('status_disputed');
      default: return status.replace(/_/g, ' ');
    }
  };

  const getUrgencyClass = (score: number) => {
    if (score >= 75) return 'urgency-high';
    if (score >= 40) return 'urgency-medium';
    return 'urgency-low';
  };

  return (
    <div className="ledger-container">
      {/* Desktop View: Authoritative Government Ledger Table */}
      <div className="ledger-desktop-view">
        <table className="ledger-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>{t('th_photo')}</th>
              <th>{t('th_ticket_ref')}</th>
              <th>{t('th_category')}</th>
              <th>{t('th_ward')}</th>
              <th>{t('th_priority')}</th>
              <th>{t('th_status')}</th>
              <th style={{ textAlign: 'right' }}>{t('th_audit')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td>
                    <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 'var(--radius-xs)' }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: 75, height: 16, borderRadius: 4 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: 140, height: 16, borderRadius: 4 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: 160, height: 16, borderRadius: 4 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 4 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 12 }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="skeleton" style={{ width: 65, height: 26, borderRadius: 6, marginLeft: 'auto' }} />
                  </td>
                </tr>
              ))
            ) : (
              incidents.map((inc) => {
                const imgSrc = formatImageUrl(inc.primary_image_url);
                const isMyReport = Boolean(
                  user &&
                  inc.citizen_ids &&
                  (inc.citizen_ids.includes(user.id) || (user.email && inc.citizen_ids.includes(user.email)))
                );
                return (
                  <tr 
                    key={inc.id}
                    onClick={() => onActionClick && onActionClick(inc)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActionClick && onActionClick(inc);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ticket CF-${inc.id.substring(0,6).toUpperCase()}`}
                    className="ledger-row-clickable"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-xs)', background: 'var(--bg-subtle)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)' }}>
                        {imgSrc ? (
                          <img src={imgSrc} alt="Issue" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon size={15} color="var(--text-muted)" />
                        )}
                      </div>
                    </td>
                    <td className="ref-id">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>#CF-{inc.id.substring(0,6).toUpperCase()}</span>
                        {isMyReport && (
                          <span title="Reported by you" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'var(--primary-bg, #eff6ff)', color: 'var(--primary, #0284c7)', border: '1px solid var(--primary-border, #bae6fd)', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            <UserCheck size={10} /> Mine
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inc.category.replace(/_/g, ' ')}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} color="var(--status-ward-fg)" />
                        <span>{inc.address || 'Ward-04 Landmark'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="urgency-bar">
                          <div className={`urgency-fill ${getUrgencyClass(inc.priority_score)}`} style={{ width: `${inc.priority_score}%` }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{inc.priority_score}/100</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip status-${inc.status}`}>
                        {formatStatus(inc.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionClick && onActionClick(inc);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        <span>{t('inspect')}</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View: 100% Width Touch Friendly Cards (Zero Horizontal Scroll) */}
      <div className="ledger-mobile-cards">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={`m-skeleton-${idx}`} className="mobile-ticket-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 50, height: 50, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 8, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          incidents.map((inc) => {
            const imgSrc = formatImageUrl(inc.primary_image_url);
            const isMyReport = Boolean(
              user &&
              inc.citizen_ids &&
              (inc.citizen_ids.includes(user.id) || (user.email && inc.citizen_ids.includes(user.email)))
            );
            return (
              <div
                key={`m-${inc.id}`}
                className="mobile-ticket-card"
                onClick={() => onActionClick && onActionClick(inc)}
                role="button"
                tabIndex={0}
              >
                <div className="mobile-ticket-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="mobile-ticket-ref">#CF-{inc.id.substring(0,6).toUpperCase()}</span>
                    {isMyReport && (
                      <span className="mobile-ticket-mine">
                        <UserCheck size={10} /> Mine
                      </span>
                    )}
                  </div>
                  <span className={`status-chip status-${inc.status}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                    {formatStatus(inc.status)}
                  </span>
                </div>

                <div className="mobile-ticket-body">
                  <div className="mobile-ticket-thumb">
                    {imgSrc ? (
                      <img src={imgSrc} alt="Issue" loading="lazy" decoding="async" />
                    ) : (
                      <ImageIcon size={20} color="var(--text-muted)" />
                    )}
                  </div>
                  <div className="mobile-ticket-details">
                    <div className="mobile-ticket-category">{inc.category.replace(/_/g, ' ')}</div>
                    <div className="mobile-ticket-address">
                      <MapPin size={12} color="var(--status-ward-fg)" />
                      <span>{inc.address || 'Ward-04 Landmark'}</span>
                    </div>
                  </div>
                </div>

                <div className="mobile-ticket-footer">
                  <div className="mobile-ticket-priority">
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Priority</span>
                    <div className="urgency-bar" style={{ width: 60 }}>
                      <div className={`urgency-fill ${getUrgencyClass(inc.priority_score)}`} style={{ width: `${inc.priority_score}%` }}></div>
                    </div>
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{inc.priority_score}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: 11.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick && onActionClick(inc);
                    }}
                  >
                    <span>{t('inspect')}</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
