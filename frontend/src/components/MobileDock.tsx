import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationDrawer } from './NotificationDrawer';

export const MobileDock: React.FC = () => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const prefix = isOfficial ? '/gov' : '/citizen';

  return (
    <>
      <nav className="mobile-dock">
        <NavLink to={isOfficial ? "/gov/dashboard" : "/citizen"} end className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <img src="/nav/home.png" alt="Home" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span>Home</span>
        </NavLink>

        <NavLink to={`${prefix}/tickets`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <img src="/nav/report.png" alt="Tickets" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span>Tickets</span>
        </NavLink>

        {!isOfficial ? (
          <NavLink to="/citizen/new" className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
            <img src="/nav/new_ticket.png" alt="Report" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span>Report</span>
          </NavLink>
        ) : (
          <NavLink to={`${prefix}/analytics`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
            <img src="/nav/progress.png" alt="Triage" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span>Triage</span>
          </NavLink>
        )}

        <button
          type="button"
          className={`dock-tab ${notifOpen ? 'active' : ''}`}
          onClick={() => setNotifOpen(!notifOpen)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          aria-label="Alerts and Notifications"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/notif.png" alt="Alerts" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span className="dock-notif-dot" />
          </div>
          <span>Alerts</span>
        </button>

        <NavLink to={`${prefix}/profile`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <img src="/nav/profile.png" alt="Profile" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} isMobileDock={true} />
    </>
  );
};
