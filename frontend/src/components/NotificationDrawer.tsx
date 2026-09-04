import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, X, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'urgent' | 'verified' | 'action' | 'info';
  link?: string;
  unread: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const prefix = isOfficial ? '/gov' : '/citizen';

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: isOfficial ? 'High Severity Hazard Alert' : 'Community Verification Needed',
      message: isOfficial
        ? 'Ward-04 Ring Road asphalt crater escalated to Priority 88. Assigned to your zone queue.'
        : 'MCD has filed repair evidence for Pothole #CF-632246. Please review and sign off.',
      time: '12m ago',
      type: 'urgent',
      link: `${prefix}/tickets`,
      unread: true,
    },
    {
      id: 'notif-2',
      title: isOfficial ? 'Resident Verification Sign-Off' : 'Repair Confirmed & Closed',
      message: isOfficial
        ? 'Ward-04 citizens confirmed and closed Streetlamp #CF-A91B22 with 100% agreement.'
        : 'Your report #CF-94182B has been verified fixed and archived to municipal ledger.',
      time: '1h ago',
      type: 'verified',
      link: `${prefix}/tickets`,
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Zonal SLA Performance',
      message: 'Average municipal turnaround time improved to 4.2 hours today across Central Zone.',
      time: '3h ago',
      type: 'info',
      link: `${prefix}/analytics`,
      unread: false,
    },
  ]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicked on the bell button itself (to allow toggle)
      if (target.closest('.header-notif-btn')) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClickItem = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 18,
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 18,
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow:
          '0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6) inset, 0 8px 16px -6px rgba(0, 0, 0, 0.05)',
        zIndex: 99999,
        overflow: 'hidden',
        animation: 'appleDropdownScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'top right',
      }}
    >
      {/* Premium Apple-style Glass Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(248, 250, 252, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={14} color="var(--primary, #0284c7)" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                background: '#0284c7',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: 10,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(15, 23, 42, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)')}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Notification Items List */}
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px' }}>
        {notifications.map((item) => {
          const getBadge = () => {
            if (item.type === 'urgent') {
              return (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={16} color="#ef4444" />
                </div>
              );
            }
            if (item.type === 'verified') {
              return (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={16} color="#10b981" />
                </div>
              );
            }
            return (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={16} color="#0284c7" />
              </div>
            );
          };

          return (
            <div
              key={item.id}
              onClick={() => handleClickItem(item)}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
                background: item.unread ? 'rgba(240, 249, 255, 0.75)' : 'transparent',
                marginBottom: 3,
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                border: item.unread ? '1px solid rgba(186, 230, 253, 0.5)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!item.unread) e.currentTarget.style.background = 'rgba(248, 250, 252, 0.9)';
              }}
              onMouseLeave={(e) => {
                if (!item.unread) e.currentTarget.style.background = 'transparent';
              }}
            >
              {getBadge()}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: item.unread ? 700 : 600,
                      color: '#0f172a',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.title}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{item.time}</span>
                </div>

                <p
                  style={{
                    fontSize: 11.5,
                    color: item.unread ? '#334155' : '#64748b',
                    lineHeight: 1.38,
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.message}
                </p>
              </div>

              {item.link && (
                <ArrowUpRight
                  size={13}
                  color="#94a3b8"
                  style={{ alignSelf: 'center', flexShrink: 0, opacity: 0.6 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
