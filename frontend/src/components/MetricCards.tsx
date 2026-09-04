import React from 'react';
import type { Incident } from '../types/incident';
import { Activity, AlertTriangle, Vote, CheckCircle2 } from 'lucide-react';

interface MetricCardsProps {
  incidents: Incident[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ incidents }) => {
  const activeCount = incidents.filter(
    (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS' || i.status === 'DISPUTED_REOPENED'
  ).length;
  const highPriorityCount = incidents.filter((i) => i.priority_score >= 70).length;
  const pendingReviewCount = incidents.filter((i) => i.status === 'RESOLVED_PENDING_VERIFICATION').length;
  const verifiedCount = incidents.filter((i) => i.status === 'CLOSED_VERIFIED').length;

  return (
    <section className="stats-grid">
      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stat-label">Active Work Orders</span>
          <Activity size={18} color="var(--status-progress-fg)" />
        </div>
        <div className="stat-value">{activeCount}</div>
        <div className="stat-meta">In queue or assigned to crews</div>
      </div>

      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stat-label">Critical Hazards</span>
          <AlertTriangle size={18} color="var(--status-open-fg)" />
        </div>
        <div className="stat-value">{highPriorityCount}</div>
        <div className="stat-meta">High hazard / public danger score</div>
      </div>

      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stat-label">Citizen Verification</span>
          <Vote size={18} color="var(--status-vote-fg)" />
        </div>
        <div className="stat-value">{pendingReviewCount}</div>
        <div className="stat-meta">Proof uploaded &bull; community vote open</div>
      </div>

      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stat-label">Verified Resolved</span>
          <CheckCircle2 size={18} color="var(--status-verified-fg)" />
        </div>
        <div className="stat-value">{verifiedCount}</div>
        <div className="stat-meta">Confirmed restored by local residents</div>
      </div>
    </section>
  );
};
