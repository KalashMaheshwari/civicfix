import { X, CheckCircle2, Calendar, MapPin, Building, Camera, Users, Check, AlertTriangle } from 'lucide-react';
import type { Incident, UserRole } from '../types/incident';
import { formatImageUrl } from '../services/api';
import { StatusTimelineStepper } from './StatusTimelineStepper';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface TicketDetailModalProps {
  incident: Incident | null;
  role?: UserRole;
  onClose: () => void;
  onVote?: (incidentId: string, isFixed: boolean) => void;
  onOpenDispute?: (incidentId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  incident,
  role = 'citizen',
  onClose,
  onVote,
  onOpenDispute,
}) => {
  if (!incident) return null;

  const primarySrc = formatImageUrl(incident.primary_image_url);
  const resolutionSrc = formatImageUrl(incident.resolution_image_url);
  const refId = `#CF-${incident.id.substring(0, 6).toUpperCase()}`;
  const isPendingVote = incident.status === 'RESOLVED_PENDING_VERIFICATION';

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ').toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
              {refId} &bull; PUBLIC INFRASTRUCTURE AUDIT LEDGER
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {incident.title || `${formatCategory(incident.category)} Inspection Record`}
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Left Column: Details */}
          <div>
            <div style={{ marginBottom: 18 }}>
              <StatusTimelineStepper status={incident.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <MapPin size={18} color="var(--status-ward-fg)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location & Ward</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{incident.address || 'Ward-04 Landmark Zone'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{incident.latitude}, {incident.longitude}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Building size={18} color="var(--status-vote-fg)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Department</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{incident.assigned_department || 'Municipal Public Works Dept'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Officer: {incident.assigned_officer_name || 'Assigned on Queue'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Calendar size={18} color="var(--status-progress-fg)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audit Timestamps</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Lodged: {new Date(incident.created_at).toLocaleString()}</div>
                  {incident.resolved_at && (
                    <div style={{ fontSize: 12.5, color: 'var(--status-verified-fg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <CheckCircle2 size={13} /> Restored: {new Date(incident.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Report Description</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {incident.description || 'No additional commentary provided with initial filing.'}
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Comparison & Community Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {primarySrc && resolutionSrc ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="var(--status-verified-fg)" /> Interactive Before & After Audit Slider
                </div>
                <BeforeAfterSlider
                  beforeSrc={primarySrc}
                  afterSrc={resolutionSrc}
                  height={220}
                  beforeLabel="Resident Report"
                  afterLabel="MCD Repair Proof"
                />
                {incident.resolution_notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--status-verified-bg)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--status-verified-border)' }}>
                    <strong>Engineer Notes:</strong> {incident.resolution_notes}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={13} color="var(--status-open-fg)" /> Initial Resident Site Photograph
                </div>
                <div style={{ width: '100%', height: 220, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                  {primarySrc ? (
                    <img src={primarySrc} alt="Issue" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No Photo Recorded</div>
                  )}
                </div>
              </div>
            )}

            {/* Citizen Community Verification Prompt */}
            {role === 'citizen' && isPendingVote && (
              <div style={{ background: 'var(--status-vote-bg)', border: '1px solid var(--status-vote-border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-vote-fg)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} /> Community Verification: Has this been restored?
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                  Compare the resident filing photo with MCD official evidence above. If work is done, confirm fix; otherwise dispute and escalate with photo evidence.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    className="btn btn-sage"
                    onClick={() => {
                      onVote?.(incident.id, true);
                      onClose();
                    }}
                    style={{ justifyContent: 'center', fontSize: 12.5 }}
                  >
                    <Check size={14} /> Confirm Fix
                  </button>
                  <button
                    className="btn btn-peach"
                    onClick={() => {
                      onClose();
                      onOpenDispute?.(incident.id);
                    }}
                    style={{ justifyContent: 'center', fontSize: 12.5 }}
                  >
                    <AlertTriangle size={14} /> Reject & Escalate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
