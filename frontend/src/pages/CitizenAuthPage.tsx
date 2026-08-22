import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser, registerCitizen } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CitizenAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('priya.singh@gmail.com');
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
        if (res.user.role !== 'citizen') {
          throw new Error('This account belongs to the Government portal. Please sign in via the MCD Portal.');
        }
        login(res.access_token, res.user);
        navigate('/citizen');
      } else {
        const res = await registerCitizen({
          full_name: fullName,
          email,
          password,
          phone: phone || undefined,
        });
        login(res.access_token, res.user);
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
            <div className="brand-icon">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <span>CivicFix</span>
          </div>
          <Link
            to="/gov/login"
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
            MCD Official Portal →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-badge">
              <Shield size={22} strokeWidth={2.2} />
            </div>
            <h1 className="auth-title">
              {isLogin ? 'Citizen Portal' : 'Create Citizen Account'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Sign in to file civic reports, track repairs, and verify municipal fixes.'
                : 'Join your local civic network to report and verify infrastructure issues.'}
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
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {/* Quick Demo Autofill Hint */}
          {isLogin && (
            <div className="demo-badge">
              <span>Demo Citizen: <code>priya.singh@gmail.com</code></span>
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
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-container">
                  <User className="input-icon-left" size={16} />
                  <input
                    type="text"
                    className="form-input-lux"
                    placeholder="Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon-left" size={16} />
                <input
                  type="email"
                  className="form-input-lux"
                  placeholder="citizen@example.com"
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

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <div className="input-container">
                  <Phone className="input-icon-left" size={16} />
                  <input
                    type="tel"
                    className="form-input-lux"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, height: 42 }}
              disabled={loading}
            >
              {loading && <Loader2 className="spin" size={15} />}
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to Citizen Portal' : 'Create Account'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Security Badge */}
          <div className="security-trust">
            <ShieldCheck size={13} color="var(--accent-success)" />
            <span>256-bit Encrypted Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
