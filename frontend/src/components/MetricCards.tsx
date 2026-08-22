import React from 'react';
import type { Incident } from '../types/incident';

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
        <div className="stat-label">Active Incidents</div>
        <div className="stat-value">{activeCount}</div>
        <div className="stat-meta">Pending field resolution</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">High Priority</div>
        <div className="stat-value">{highPriorityCount}</div>
        <div className="stat-meta">Urgency score &gt;= 70</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Pending Citizen Vote</div>
        <div className="stat-value">{pendingReviewCount}</div>
        <div className="stat-meta">Repair proof uploaded</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Verified Resolved</div>
        <div className="stat-value">{verifiedCount}</div>
        <div className="stat-meta">Confirmed fixed by citizens</div>
      </div>
    </section>
  );
};
