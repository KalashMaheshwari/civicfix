import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'error' | 'success';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      const timer = setTimeout(() => {
        onDismiss(latest.id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  const getIcon = (type?: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--status-verified-fg, #059669)" />;
      case 'error':
        return <AlertCircle size={16} color="var(--status-open-fg, #e11d48)" />;
      default:
        return <Info size={16} color="var(--primary, #0284c7)" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-notification toast-${t.type || 'info'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ flexShrink: 0 }}>{getIcon(t.type)}</span>
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{t.text}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
