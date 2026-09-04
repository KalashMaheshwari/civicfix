import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdaptiveHeader } from '../components/AdaptiveHeader';
import { DesktopRail } from '../components/DesktopRail';
import { MobileDock } from '../components/MobileDock';
import { ShieldCheck, LogOut, Check } from 'lucide-react';

export const CitizenProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Interactive Preference State
  const [preferences, setPreferences] = useState({
    crewDispatch: true,
    verificationVote: true,
    monthlyDigest: false,
    soundAlerts: true,
    anonymousReporting: false,
    autoGeotag: true,
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
                <ShieldCheck size={16} color="var(--status-verified-fg)" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--status-verified-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Verified Civic Identity
                </span>
              </div>
              <h1 className="section-title">Citizen Account & System Preferences</h1>
              <p className="section-subtitle">Manage verified credentials, notification triggers, privacy settings, and municipal jurisdiction.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* 1. Identification Ledger */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/citizen.png" alt="Citizen" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Citizen Identity Ledger</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>MCD Municipal Account Record</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Legal Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{user?.full_name || 'Resident'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Citizen Verification Status</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--status-verified-fg)', fontWeight: 700, background: 'var(--status-verified-bg)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', marginTop: 3, border: '1px solid var(--status-verified-border)' }}>
                    <ShieldCheck size={13} /> Aadhaar & Geotag Verified
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Email</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SMS Dispatch Phone</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', marginTop: 2 }}>{user?.phone || '+91 98765 43210 (Default)'}</div>
                </div>
              </div>
            </div>

            {/* 2. Jurisdiction & Wards */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/location.png" alt="Location" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Jurisdiction & Wards</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Designated Response Zone</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 12, border: '1px solid var(--status-ward-border)', borderRadius: 'var(--radius-xs)', background: 'var(--status-ward-bg)' }}>
                  <div style={{ fontSize: 11, color: 'var(--status-ward-fg)', fontWeight: 700, textTransform: 'uppercase' }}>Primary Residential Ward</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>Ward-04 (Sector B, South Delhi)</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>Assigned Zonal Office: South MCD Zone 4</div>
                </div>
                
                <div style={{ padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Watched Secondary Wards</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>Ward-12 (Central Commercial), Ward-02 (East)</div>
                </div>
              </div>
            </div>

            {/* 3. Interactive Preferences & Toggles */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/notif.png" alt="Notifications" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Dispatch & App Preferences</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Toggle alerts and reporting behaviors</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'crewDispatch' as const, label: 'Work Crew Dispatch SMS', desc: 'Alert when repair team is assigned' },
                  { key: 'verificationVote' as const, label: 'Sign-Off Community Vote', desc: 'Instant prompt when engineer files repair photo' },
                  { key: 'monthlyDigest' as const, label: 'Monthly Restoration Digest', desc: 'Summary report of all fixed ward issues' },
                  { key: 'autoGeotag' as const, label: 'Auto High-Precision Geotag', desc: 'Attach verified GPS coordinates to photos' },
                  { key: 'anonymousReporting' as const, label: 'Mask Identity in Public Feed', desc: 'Show as Anonymous Resident on public ledger' },
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

            {/* 4. Municipal Control & Account Actions Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <img src="/phone.png" alt="Helpline" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Municipal Helpline & Session</h3>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Emergency dispatch & account security</div>
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
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Toll-Free 24x7 Helpline: <strong>155304</strong></div>
                      </div>
                    </div>
                    <span className="mcd-call-tag">Call Now</span>
                  </a>

                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    <span>For life-threatening civic emergencies (live fallen high-voltage cables, open drainage collapse), contact zonal emergency services immediately.</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  onClick={handleLogout}
                  className="profile-signout-btn"
                >
                  <LogOut size={16} />
                  <span>Sign Out of Citizen Session</span>
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
