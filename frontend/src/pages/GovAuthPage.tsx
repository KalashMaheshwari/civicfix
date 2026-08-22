import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, Loader2, ShieldCheck, Mail, Lock, User, Eye, EyeOff, Award } from 'lucide-react';
import { loginUser, registerOfficial } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const GovAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Roads & Works');
  const [badgeId, setBadgeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('verma.mcd@delhi.gov.in');
    setPassword('password123');
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser(email, password);
        if (res.user.role !== 'official' && res.user.role !== 'admin') {
          throw new Error('Access denied. This account does not possess Government Official credentials.');
        }
        login(res.access_token, res.user);
        navigate('/gov/dashboard');
      } else {
        const res = await registerOfficial({
          full_name: fullName,
          email,
          password,
          department,
          official_badge_id: badgeId,
        });
        login(res.access_token, res.user);
        navigate('/gov/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Government authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-ambient-bg">
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="brand-icon" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              <Building2 size={16} strokeWidth={2.5} />
            </div>
            <span>MCD Official Portal</span>
          </div>
          <Link
            to="/"
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              transition: 'var(--transition-fast)',
            }}
          >
            ← Citizen Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="auth-card" style={{ borderColor: 'rgba(0, 113, 227, 0.25)' }}>
          <div className="auth-header">
            <div className="auth-icon-badge" style={{ background: 'rgba(0, 113, 227, 0.12)', color: 'var(--accent-primary)', borderColor: 'rgba(0, 113, 227, 0.3)' }}>
              <Building2 size={22} strokeWidth={2.2} />
            </div>
            <h1 className="auth-title">
              {isLogin ? 'Government Staff Sign In' : 'Register Official Account'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Restricted municipal triage, team dispatch, and repair proof submission.'
                : 'Create official credentials for verified government and field crew access.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
            >
              Official Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
            >
              Register Official
            </button>
          </div>

          {/* Quick Demo Autofill Hint */}
          {isLogin && (
            <div className="demo-badge">
              <span>Demo MCD: <code>verma.mcd@delhi.gov.in</code></span>
              <button type="button" className="demo-fill-btn" onClick={handleFillDemo}>
                Auto-fill
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name & Rank</label>
                  <div className="input-container">
                    <User className="input-icon-left" size={16} />
                    <input
                      type="text"
                      className="form-input-lux"
                      placeholder="e.g. Officer Rajesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Municipal Department</label>
                  <select
                    className="form-select-lux"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="Roads & Works">Roads & Works</option>
                    <option value="Sanitation & Waste">Sanitation & Waste</option>
                    <option value="Electricity Board">Electricity Board</option>
                    <option value="Water & Drainage">Water & Drainage</option>
                    <option value="Public Infrastructure">Public Infrastructure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Badge / Employee ID</label>
                  <div className="input-container">
                    <Award className="input-icon-left" size={16} />
                    <input
                      type="text"
                      className="form-input-lux"
                      placeholder="e.g. MCD-7721"
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Government Email</label>
              <div className="input-container">
                <Mail className="input-icon-left" size={16} />
                <input
                  type="email"
                  className="form-input-lux"
                  placeholder="officer@mcd.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <Lock className="input-icon-left" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-lux"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Show Password Button */}
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, height: 42 }}
              disabled={loading}
            >
              {loading && <Loader2 className="spin" size={15} />}
              {loading ? 'Verifying Credentials...' : isLogin ? 'Access MCD Dashboard' : 'Create Official Profile'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Security Badge */}
          <div className="security-trust">
            <ShieldCheck size={13} color="var(--accent-primary)" />
            <span>Government-Grade Identity Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
