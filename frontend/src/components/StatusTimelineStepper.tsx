import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StatusTimelineStepperProps {
  status: string;
  createdAt?: string;
  resolvedAt?: string | null;
  updatedAt?: string;
}

function formatStepTime(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export const StatusTimelineStepper: React.FC<StatusTimelineStepperProps> = ({
  status,
  createdAt,
  resolvedAt,
  updatedAt,
}) => {
  const { t } = useLanguage();

  const formattedCreated = formatStepTime(createdAt);
  const formattedResolved = formatStepTime(resolvedAt);
  const formattedVerified = formatStepTime(status === 'CLOSED_VERIFIED' ? updatedAt : null);

  const steps = [
    { id: 'OPEN', label: t('step_reported'), timestamp: formattedCreated },
    { id: 'IN_PROGRESS', label: t('step_assigned'), timestamp: null },
    { id: 'RESOLVED_PENDING_VERIFICATION', label: t('step_proof_filed'), timestamp: formattedResolved },
    { id: 'CLOSED_VERIFIED', label: t('step_verified'), timestamp: formattedVerified },
  ];

  let currentIndex = 0;
  if (status === 'IN_PROGRESS' || status === 'DISPUTED_REOPENED') currentIndex = 1;
  else if (status === 'RESOLVED_PENDING_VERIFICATION') currentIndex = 2;
  else if (status === 'CLOSED_VERIFIED') currentIndex = 3;

  return (
    <div style={{ margin: '12px 0 14px', width: '100%' }}>
      <div className="timeline-stepper">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          let className = 'timeline-step';
          if (isCompleted) className += ' completed';
          if (isActive) className += ' active';
          
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                textAlign: 'center',
                zIndex: 2,
                position: 'relative',
              }}
            >
              <div className={className} title={step.label}>
                {(isCompleted || isActive) && <Check size={11} strokeWidth={3} />}
              </div>
              <span
                style={{
                  marginTop: 6,
                  fontSize: 10.5,
                  lineHeight: 1.2,
                  color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  maxWidth: 68,
                  wordBreak: 'break-word',
                  textAlign: 'center',
                }}
              >
                {step.label}
              </span>
              {step.timestamp && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#64748B',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 2,
                    lineHeight: 1.1,
                  }}
                >
                  {step.timestamp}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

