import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Layers, PlusCircle, Bell, User, BarChart2 } from 'lucide-react';
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
          <Home size={20} strokeWidth={2.1} />
          <span>Home</span>
        </NavLink>

        <NavLink to={`${prefix}/tickets`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <Layers size={20} strokeWidth={2.1} />
          <span>Tickets</span>
        </NavLink>

        {!isOfficial ? (
          <NavLink to="/citizen/new" className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
            <PlusCircle size={20} strokeWidth={2.1} />
            <span>Report</span>
          </NavLink>
        ) : (
          <NavLink to={`${prefix}/analytics`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
            <BarChart2 size={20} strokeWidth={2.1} />
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
            <Bell size={20} strokeWidth={2.1} />
            <span className="dock-notif-dot" />
          </div>
          <span>Alerts</span>
        </button>

        <NavLink to={`${prefix}/profile`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <User size={20} strokeWidth={2.1} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} isMobileDock={true} />
    </>
  );
};
