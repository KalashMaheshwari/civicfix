import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, MapPin, Building, Camera, Check, AlertTriangle, Lock, Columns, Sliders, ShieldCheck } from 'lucide-react';
import type { Incident, UserRole } from '../types/incident';
import { formatImageUrl } from '../services/api';
import { StatusTimelineStepper } from './StatusTimelineStepper';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useAuth } from '../context/AuthContext';
import { PointsIcon } from './StarIcon';

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
  const { user } = useAuth();
  const [photoViewMode, setPhotoViewMode] = useState<'slider' | 'side-by-side'>('slider');

  if (!incident) return null;

  const primarySrc = formatImageUrl(incident.primary_image_url);
  const resolutionSrc = formatImageUrl(incident.resolution_image_url);
  const refId = `CF-${incident.id.substring(0, 6).toUpperCase()}`;
  const isPendingVote = incident.status === 'RESOLVED_PENDING_VERIFICATION';
  const hasBothPhotos = Boolean(primarySrc && resolutionSrc);

  const isMyReport = Boolean(
    user &&
    incident.citizen_ids &&
    (incident.citizen_ids.includes(user.id) || (user.email && incident.citizen_ids.includes(user.email)))
  );

  const formatCategory = (cat: string) =>
    cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Open Ticket', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
      case 'RESOLVED_PENDING_VERIFICATION':
        return { label: 'Verification Needed', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'CLOSED_VERIFIED':
        return { label: 'Verified Fixed', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      case 'DISPUTED_REOPENED':
        return { label: 'Disputed & Reopened', bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' };
      default:
        return { label: status.replace(/_/g, ' '), bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const statusBadge = getStatusBadge(incident.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ 
          maxWidth: 780, 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 16, 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', 
          border: '1px solid var(--border-default, #E2E8F0)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle, #F1F5F9)', background: 'var(--bg-surface, #FFFFFF)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #64748B)', background: '#F8FAFC', padding: '2px 8px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  #{refId}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: statusBadge.text, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, padding: '2px 8px', borderRadius: 9999 }}>
                  {statusBadge.label}
                </span>
                {isMyReport && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={12} /> Filed by You
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary, #0F172A)', margin: 0, lineHeight: 1.3 }}>
                {incident.title || `${formatCategory(incident.category)} Incident Report`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: 'var(--bg-canvas, #F8FAFC)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Lifecycle Stepper */}
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <StatusTimelineStepper
              status={incident.status}
              createdAt={incident.created_at}
              resolvedAt={incident.resolved_at}
              updatedAt={incident.updated_at}
            />
          </div>

          {/* Photo Evidence Section */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={15} color="var(--primary, #0284C7)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  {hasBothPhotos ? 'Visual Repair Verification' : 'Filing Site Evidence'}
                </span>
              </div>
              {hasBothPhotos && (
                <div style={{ display: 'flex', background: '#F1F5F9', padding: 2, borderRadius: 6, gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('slider')}
                    style={{
                      border: 'none',
                      padding: '3px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: photoViewMode === 'slider' ? '#FFFFFF' : 'transparent',
                      color: photoViewMode === 'slider' ? '#0F172A' : '#64748B',
                      boxShadow: photoViewMode === 'slider' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <Sliders size={12} /> Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('side-by-side')}
                    style={{
                      border: 'none',
                      padding: '3px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: photoViewMode === 'side-by-side' ? '#FFFFFF' : 'transparent',
                      color: photoViewMode === 'side-by-side' ? '#0F172A' : '#64748B',
                      boxShadow: photoViewMode === 'side-by-side' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <Columns size={12} /> Side-by-Side
                  </button>
                </div>
              )}
            </div>

            {hasBothPhotos ? (
              photoViewMode === 'slider' ? (
                <div>
                  <BeforeAfterSlider
                    beforeSrc={primarySrc!}
                    afterSrc={resolutionSrc!}
                    height={260}
                    beforeLabel="1. Original Report"
                    afterLabel="2. MCD Resolution Proof"
                  />
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11.5, color: '#64748B' }}>
                    Drag the center slider to inspect before and after repairs
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                      1. Initial Citizen Report
                    </div>
                    <div style={{ height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <img src={primarySrc!} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: 4 }}>
                      2. MCD Resolution Evidence
                    </div>
                    <div style={{ height: 180, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <img src={resolutionSrc!} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div style={{ width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                {primarySrc ? (
                  <img src={primarySrc} alt="Filing Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                    No site photograph recorded
                  </div>
                )}
              </div>
            )}

            {incident.resolution_notes && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #DCFCE7', fontSize: 12.5, color: '#166534', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={15} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Official Resolution Log:</strong> {incident.resolution_notes}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Community Verification Card */}
          {role === 'citizen' && isPendingVote && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                padding: '18px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Resident Verification
                  </span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  <PointsIcon size={12} />
                  <span>+15 Civic Points</span>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                Did the contractor restore this issue?
              </h3>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.45 }}>
                Compare the repair evidence above with the initial issue. Confirming marks the work order resolved and credits your account with civic points.
              </p>

              {isMyReport ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onVote?.(incident.id, true);
                      onClose();
                    }}
                    style={{
                      flex: '1 1 180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                    <span>Confirm Resolved (+15 pts)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDispute?.(incident.id);
                    }}
                    style={{
                      flex: '1 1 140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: '#FFF5F5',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>Dispute Repair</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
                  <Lock size={14} color="#94A3B8" />
                  <span>Audit mode: Verification sign-off is reserved for the resident who reported this issue.</span>
                </div>
              )}
            </div>
          )}

          {/* Ticket Information Metadata Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                <MapPin size={13} color="var(--primary)" /> Location & Ward
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {incident.address || 'Ward-04 Jurisdiction'}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                {incident.latitude}, {incident.longitude}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                <Building size={13} color="var(--primary)" /> Assigned Department
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                {incident.assigned_department || 'Municipal Public Works'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Officer: {incident.assigned_officer_name || 'En Route'}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                <Calendar size={13} color="var(--primary)" /> Lodged Date
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                {new Date(incident.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                {new Date(incident.created_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}
              </div>
            </div>
          </div>

          {/* Description Box */}
          {incident.description && (
            <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                Resident Commentary
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {incident.description}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

