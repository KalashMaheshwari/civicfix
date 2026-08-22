import React, { useState } from 'react';
import { Check, X, ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import type { Incident, UserRole } from '../types/incident';
import { formatImageUrl } from '../services/api';

interface IncidentCardProps {
  incident: Incident;
  role: UserRole;
  onVote: (incidentId: string, isFixed: boolean) => void;
  onOpenResolve: (incidentId: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  role,
  onVote,
  onOpenResolve,
}) => {
  const [imgError, setImgError] = useState(false);
  const isPendingVote = incident.status === 'RESOLVED_PENDING_VERIFICATION';
  const canGovtResolve =
    incident.status === 'OPEN' ||
    incident.status === 'IN_PROGRESS' ||
    incident.status === 'DISPUTED_REOPENED';

  const getStatusClass = (status: string) => {
    return `status-${status.toLowerCase()}`;
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'RESOLVED_PENDING_VERIFICATION':
        return 'Pending Citizen Vote';
      case 'CLOSED_VERIFIED':
        return 'Verified Fixed';
      case 'DISPUTED_REOPENED':
        return 'Disputed & Reopened';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  const primarySrc = formatImageUrl(incident.primary_image_url);
  const resolutionSrc = formatImageUrl(incident.resolution_image_url);

  return (
    <div className="incident-card">
      <div className="card-media">
        {!imgError && primarySrc ? (
          <img
            src={primarySrc}
            className="card-img"
            alt={incident.category}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              gap: 6,
            }}
          >
            <ImageIcon size={28} strokeWidth={1.5} />
            <span style={{ fontSize: 11 }}>Photo Attachment</span>
          </div>
        )}

        <span className={`card-status-tag ${getStatusClass(incident.status)}`}>
          {formatStatus(incident.status)}
        </span>
        <span
          className="card-priority-tag"
          style={{
            color: incident.priority_score >= 70 ? 'var(--accent-danger)' : 'var(--text-primary)',
          }}
        >
          Priority {incident.priority_score}/100
        </span>
      </div>

      <div className="card-body">
        <div className="card-category">
          {incident.category.replace(/_/g, ' ')} • Severity {incident.base_severity}/5
        </div>
        <div className="card-title">
          {incident.title || incident.category.replace(/_/g, ' ')}
        </div>
        <div className="card-desc">
          {incident.description || 'No additional description provided.'}
        </div>

        {incident.address && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            {incident.address}
          </div>
        )}

        {/* Closed-Loop Resolution Review for Citizens */}
        {role === 'citizen' && isPendingVote && (
          <div className="verification-banner">
            <div className="verification-header">
              <span>MCD Uploaded Repair Proof</span>
              <span>Review & Vote</span>
            </div>
            <div className="comparison-grid">
              <div className="comparison-pane">
                <img src={primarySrc} alt="Before Repair" />
                <span className="comparison-tag">Before</span>
              </div>
              <div className="comparison-pane">
                <img
                  src={resolutionSrc || primarySrc}
                  alt="After Repair"
                />
                <span className="comparison-tag">After Repair</span>
              </div>
            </div>
            {incident.resolution_notes && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Notes: {incident.resolution_notes}
              </div>
            )}
            <div className="vote-buttons">
              <button
                className="btn btn-success btn-sm"
                onClick={() => onVote(incident.id, true)}
              >
                <Check size={14} /> YES, Fixed
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onVote(incident.id, false)}
              >
                <X size={14} /> NO, Still Broken
              </button>
            </div>
          </div>
        )}

        {/* Govt Action Button */}
        {role === 'official' && canGovtResolve && (
          <div style={{ marginTop: 14 }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => onOpenResolve(incident.id)}
            >
              Upload Repair Proof & Resolve <ArrowUpRight size={14} />
            </button>
          </div>
        )}

        <div className="card-meta">
          <span>
            {incident.total_reports} report{incident.total_reports > 1 ? 's' : ''} (
            {incident.duplicate_count} dupes)
          </span>
          <span>
            {incident.citizen_feedback_yes} Yes / {incident.citizen_feedback_no} No
          </span>
        </div>
      </div>
    </div>
  );
};
