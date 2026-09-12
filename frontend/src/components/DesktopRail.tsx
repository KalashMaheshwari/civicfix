import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus } from 'lucide-react';
import { StarIcon } from './StarIcon';

export const DesktopRail: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const prefix = isOfficial ? '/gov' : '/citizen';

  return (
    <aside className="app-rail">
      <div className="rail-header">
        <div className="rail-brand-title">
          <img src="/logo.jpg" alt="CivicFix" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span>{t('brand_title')}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {isOfficial ? t('official_operations') : t('citizen_registry')}
        </div>
      </div>
      
      <nav className="rail-nav">
        <NavLink to={isOfficial ? "/gov/dashboard" : "/citizen"} end className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
          <img src="/nav/home.png" alt="Overview" />
          <span>{t('overview')}</span>
        </NavLink>

        <NavLink to={`${prefix}/tickets`} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
          <img src="/nav/report.png" alt="Reports" />
          <span>{isOfficial ? t('issue_queue') : t('reports_ledger')}</span>
        </NavLink>
        
        <NavLink to={`${prefix}/analytics`} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
          <img src="/nav/progress.png" alt="Analytics" />
          <span>{isOfficial ? t('zonal_metrics') : t('ward_progress')}</span>
        </NavLink>

        <NavLink to={`${prefix}/profile`} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
          <img src="/nav/profile.png" alt="Profile" />
          <span>{t('account_preferences')}</span>
        </NavLink>
      </nav>

      {/* Mini Citizen Level & Points status card */}
      {!isOfficial && user && (
        <div style={{ margin: '0 12px 12px', padding: '10px 12px', background: 'var(--bg-subtle, #f0f6fb)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Level {user.level || 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarIcon size={12} />
              <span>{user.civic_points || 140} Pts</span>
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{user.level_title || 'Alert Resident'}</div>
        </div>
      )}

      {/* Prominently Highlighted Action Section at bottom of side nav */}
      {!isOfficial && (
        <div className="rail-cta-section">
          <NavLink to="/citizen/new" className="rail-lodge-btn">
            <img src="/nav/new_ticket.png" alt="Lodge Report" />
            <div className="rail-lodge-content">
              <span className="rail-lodge-title">{t('lodge_report')}</span>
              <span className="rail-lodge-subtitle">{t('lodge_subtitle')}</span>
            </div>
            {/* Top-right Plus badge */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              <Plus size={11} strokeWidth={3} />
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
};
