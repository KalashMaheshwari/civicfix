import React, { useState } from 'react';
import { Check, X, Image as ImageIcon, MapPin, Users, UserCheck, Lock, Clock } from 'lucide-react';
import type { Incident, UserRole } from '../types/incident';
import { formatImageUrl } from '../services/api';
import { StatusTimelineStepper } from './StatusTimelineStepper';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface IncidentCardProps {
  incident: Incident;
  role: UserRole;
  onVote: (incidentId: string, isFixed: boolean) => void;
  onOpenResolve: (incidentId: string) => void;
  onOpenDispute?: (incidentId: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  role,
  onVote,
  onOpenResolve,
  onOpenDispute,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const isPendingVote = incident.status === 'RESOLVED_PENDING_VERIFICATION';
  const canGovtResolve =
    incident.status === 'OPEN' ||
    incident.status === 'IN_PROGRESS' ||
    incident.status === 'DISPUTED_REOPENED';

  const isMyReport = Boolean(
    user &&
    incident.citizen_ids &&
    (incident.citizen_ids.includes(user.id) || (user.email && incident.citizen_ids.includes(user.email)))
  );

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

  const formatLodgedTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const primarySrc = formatImageUrl(incident.primary_image_url);
  const resolutionSrc = formatImageUrl(incident.resolution_image_url);

  return (
    <div className="tactile-card">
      <div className="card-image-wrapper">
        {!imgError && primarySrc ? (
          <img src={primarySrc} alt={incident.category} loading="lazy" decoding="async" onError={() => setImgError(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 6 }}>
            <ImageIcon size={26} strokeWidth={1.5} />
            <span style={{ fontSize: 12 }}>Visual inspection record registered</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`status-chip status-${incident.status}`}>
            {formatStatus(incident.status)}
          </span>
          {isMyReport && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(2, 132, 199, 0.9)', color: '#FFFFFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-xs)', backdropFilter: 'blur(4px)' }}>
              <UserCheck size={11} /> My Ticket
            </span>
          )}
        </div>
      </div>

      <div className="card-content">
        <div className="card-header-row">
          <span className="card-ref">#CF-{incident.id.substring(0,6).toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} /> {formatLodgedTime(incident.created_at)}
          </span>
        </div>
        
        <div className="card-title">{incident.title || incident.category.replace(/_/g, ' ')}</div>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
          <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: 'var(--status-ward-fg)' }} />
          <span>{incident.address || 'Ward-04 Landmark Zone'}</span>
        </div>

        <StatusTimelineStepper
          status={incident.status}
          createdAt={incident.created_at}
          resolvedAt={incident.resolved_at}
          updatedAt={incident.updated_at}
        />

        {/* Citizen Verification Panel */}
        {role === 'citizen' && isPendingVote && (
          <div style={{ background: 'var(--status-vote-bg)', border: '1px solid var(--status-vote-border)', borderRadius: 'var(--radius-sm)', padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-vote-fg)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} /> {t('community_verification')}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div style={{ position: 'relative', height: 80, borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                <img src={primarySrc} alt="Before" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(15,23,42,0.85)', color: '#FFFFFF', padding: '1px 5px', fontSize: 9.5, fontWeight: 700, borderRadius: 2 }}>Before</span>
              </div>
              <div style={{ position: 'relative', height: 80, borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: '1px solid var(--status-verified-border)' }}>
                <img src={resolutionSrc || primarySrc} alt="After" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'var(--status-verified-fg)', color: '#FFFFFF', padding: '1px 5px', fontSize: 9.5, fontWeight: 700, borderRadius: 2 }}>Official Repair Proof</span>
              </div>
            </div>
            
            {isMyReport ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn btn-sage btn-sm" onClick={() => onVote(incident.id, true)}>
                  <Check size={13} /> {t('confirm_fix')}
                </button>
                <button className="btn btn-peach btn-sm" onClick={() => onOpenDispute?.(incident.id)}>
                  <X size={13} /> {t('reject_escalate')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748B', background: '#FFFFFF', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
                <Lock size={13} color="#94A3B8" />
                <span>Verification sign-off is reserved for the resident who raised this ticket.</span>
              </div>
            )}
          </div>
        )}

        {/* MCD Official Action */}
        {role === 'official' && canGovtResolve && (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => onOpenResolve(incident.id)}>
              Upload Repair Evidence & Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
