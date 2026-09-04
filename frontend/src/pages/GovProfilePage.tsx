import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdaptiveHeader } from '../components/AdaptiveHeader';
import { DesktopRail } from '../components/DesktopRail';
import { MobileDock } from '../components/MobileDock';
import { ShieldCheck, HardHat, LogOut, Check } from 'lucide-react';

export const GovProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Interactive Official Preferences
  const [preferences, setPreferences] = useState({
    hazardAlerts: true,
    disputeFlags: true,
    dailySummary: true,
    smsDispatch: true,
    autoAssignCrews: false,
  });

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="app-layout">
      <DesktopRail />
      <main className="app-stage">
        <AdaptiveHeader />
        
        <div className="stage-container">
          <div className="section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <HardHat size={16} color="var(--primary)" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Official MCD Engineering Credentials
                </span>
              </div>
              <h1 className="section-title">MCD Engineer Profile & Operations Console</h1>
              <p className="section-subtitle">Official municipal corporation credentials, dispatch alert preferences, and zonal triage settings.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* 1. Official Identity */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/mcd.png" alt="MCD Official" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Official Identity Ledger</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>MCD Government Account</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supervising Officer</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{user?.full_name || 'Er. Rajesh Kumar'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Official Email</div>
                  <div style={{ fontSize: 13.5, marginTop: 2 }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authorization Level</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--status-verified-fg)', fontWeight: 700, background: 'var(--status-verified-bg)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', marginTop: 3, border: '1px solid var(--status-verified-border)' }}>
                    <ShieldCheck size={13} /> MCD Zonal Triage Lead (Level 3)
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Jurisdiction */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/location.png" alt="Location" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Assigned Ward Jurisdiction</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Operations Area</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 12, border: '1px solid var(--status-ward-border)', borderRadius: 'var(--radius-xs)', background: 'var(--status-ward-bg)' }}>
                  <div style={{ fontSize: 11, color: 'var(--status-ward-fg)', fontWeight: 700, textTransform: 'uppercase' }}>Primary Response Ward</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>Ward-04 (Sector B, South Delhi)</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>Office: South MCD Zone 4 Division</div>
                </div>
                <div style={{ padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Operational Department</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>Public Works, Drainage & Roads Division</div>
                </div>
              </div>
            </div>

            {/* 3. Triage & Dispatch Preferences */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/notif.png" alt="Notifications" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Triage Alert Preferences</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Configure automated dispatch triggers</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'hazardAlerts' as const, label: 'High-Hazard Escalations (Score >= 70)', desc: 'Instant dispatch push for dangerous hazards' },
                  { key: 'disputeFlags' as const, label: 'Citizen Rejection & Dispute Flags', desc: 'When community rejects a resolution photo' },
                  { key: 'dailySummary' as const, label: 'Morning Zonal Triage Summary', desc: 'Digest of all open tickets in Ward-04' },
                  { key: 'smsDispatch' as const, label: 'Crew SMS Auto-Dispatch', desc: 'Notify crew leads via SMS on ticket assignment' },
                  { key: 'autoAssignCrews' as const, label: 'AI Auto-Routing for Priority >= 80', desc: 'Immediately queue nearest available crew' },
                ].map((item) => {
                  const isOn = preferences[item.key];
                  return (
                    <div 
                      key={item.key} 
                      onClick={() => togglePref(item.key)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '9px 12px', 
                        background: isOn ? 'var(--bg-surface)' : 'var(--bg-subtle)', 
                        borderRadius: 'var(--radius-sm)', 
                        border: `1px solid ${isOn ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ paddingRight: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>

                      {/* iOS-Style Toggle Switch */}
                      <div 
                        className={`pref-switch ${isOn ? 'active' : ''}`}
                        role="switch"
                        aria-checked={isOn}
                      >
                        <div className="pref-switch-thumb">
                          {isOn && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Municipal Control & Session Actions */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <img src="/phone.png" alt="Helpline" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Municipal Control & Session</h3>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Operations control room & security</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <a 
                    href="tel:155304" 
                    className="mcd-helpline-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src="/phone.png" alt="Call" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>MCD Central Control Room</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Internal Engineering Line: <strong>155304</strong></div>
                      </div>
                    </div>
                    <span className="mcd-call-tag">Connect</span>
                  </a>

                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    <span>Logged into <strong>Municipal Corporation of Delhi Zonal Engineering Network</strong>. Ensure session sign-out after duty shift.</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  onClick={handleLogout}
                  className="profile-signout-btn"
                >
                  <LogOut size={16} />
                  <span>Sign Out of Engineering Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileDock />
    </div>
  );
};
