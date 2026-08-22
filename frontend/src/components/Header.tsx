import React from 'react';
import { Shield, User, Building2 } from 'lucide-react';
import type { UserRole } from '../types/incident';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, userName }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand">
          <div className="brand-icon">
            <Shield size={16} strokeWidth={2.5} />
          </div>
          <span>CivicFix</span>
        </div>

        {/* Apple Segmented Control: Citizen vs MCD Authority */}
        <div className="segmented-control">
          <button
            className={`segmented-button ${currentRole === 'citizen' ? 'active' : ''}`}
            onClick={() => onRoleChange('citizen')}
          >
            <User size={14} />
            Citizen Portal
          </button>
          <button
            className={`segmented-button ${currentRole === 'official' ? 'active' : ''}`}
            onClick={() => onRoleChange('official')}
          >
            <Building2 size={14} />
            MCD Authority
          </button>
        </div>

        <div className="user-badge">
          {currentRole === 'citizen' ? `Citizen: ${userName}` : `Official: ${userName}`}
        </div>
      </div>
    </header>
  );
};
