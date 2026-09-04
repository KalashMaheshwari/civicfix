import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const MobileDock: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOfficial = user?.role === 'official' || user?.role === 'admin';
  const prefix = isOfficial ? '/gov' : '/citizen';

  return (
    <nav className="mobile-dock">
      <NavLink to={isOfficial ? "/gov/dashboard" : "/citizen"} end className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
        <img src="/nav/home.png" alt="Home" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        <span>Home</span>
      </NavLink>

      <NavLink to={`${prefix}/tickets`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
        <img src="/nav/report.png" alt="Tickets" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        <span>Tickets</span>
      </NavLink>

      {!isOfficial && (
        <button className="dock-fab" onClick={() => navigate('/citizen/new')} title="New Ticket" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/nav/new_ticket.png" alt="New" style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </button>
      )}

      {isOfficial && (
        <NavLink to={`${prefix}/analytics`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
          <img src="/nav/progress.png" alt="Triage" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span>Triage</span>
        </NavLink>
      )}

      <NavLink to={`${prefix}/profile`} className={({ isActive }) => `dock-tab ${isActive ? 'active' : ''}`}>
        <img src="/nav/profile.png" alt="Profile" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
