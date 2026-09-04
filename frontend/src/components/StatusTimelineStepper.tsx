import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StatusTimelineStepperProps {
  status: string;
}

export const StatusTimelineStepper: React.FC<StatusTimelineStepperProps> = ({ status }) => {
  const { t } = useLanguage();

  const steps = [
    { id: 'OPEN', label: t('step_reported') },
    { id: 'IN_PROGRESS', label: t('step_assigned') },
    { id: 'RESOLVED_PENDING_VERIFICATION', label: t('step_proof_filed') },
    { id: 'CLOSED_VERIFIED', label: t('step_verified') },
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
                  maxWidth: 65,
                  wordBreak: 'break-word',
                  textAlign: 'center',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

