import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { loginUser, registerCitizen } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatErrorMessage } from '../utils/errors';
import { validatePassword } from '../utils/validation';

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

  const pwdValidation = useMemo(() => validatePassword(password), [password]);

  const handleFillDemo = () => {
    setEmail('priya.singh@gmail.com');
    setPassword('password123');
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isLogin) {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
    } else {
      if (!fullName || fullName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (!pwdValidation.isValid) {
        setError(pwdValidation.errorMessage || 'Please create a stronger password according to security requirements.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser(cleanEmail, password);
        if (res.user.role !== 'citizen') {
          throw new Error('This account belongs to the Government portal. Please sign in via the MCD Portal.');
        }
        login(res.access_token, res.user);
        navigate('/citizen');
      } else {
        const res = await registerCitizen({
          full_name: fullName.trim(),
          email: cleanEmail,
          password: password,
          phone: phone.trim() || undefined,
        });
        login(res.access_token, res.user);
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Authentication failed. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <Link to="/gov/login" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          <span>MCD Engineering Console</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div style={{ marginBottom: 12 }}>
            <img src="/citizen.png" alt="Citizen" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          </div>
          <h1 className="auth-title">
            {isLogin ? 'Citizen Portal Sign In' : 'Register Citizen Profile'}
          </h1>
          <p className="auth-subtitle">
            {isLogin
              ? 'Sign in to file reports, track municipal repairs, and verify fixes in Ward-04.'
              : 'Join your verified neighborhood network for transparent municipal governance.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(null); }}>
            Sign In
          </button>
          <button type="button" className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(null); }}>
            Register
          </button>
        </div>

        {isLogin && (
          <div className="demo-badge">
            <span>Demo: <strong>priya.singh@gmail.com</strong></span>
            <button type="button" className="demo-fill-btn" onClick={handleFillDemo}>Quick Fill</button>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--status-open-bg)', color: 'var(--status-open-fg)', padding: '9px 12px', borderRadius: 'var(--radius-xs)', fontSize: 12.5, marginBottom: 16, border: '1px solid var(--status-open-border)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Full Name</label>
                <span style={{ fontSize: 11, color: fullName.length >= 2 ? '#10b981' : 'var(--text-muted)' }}>
                  Min 2 characters
                </span>
              </div>
              <div className="input-container">
                <User className="input-icon-left" size={16} />
                <input
                  type="text"
                  className="form-input has-icon"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Email Address</label>
              {!isLogin && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Standard email format
                </span>
              )}
            </div>
            <div className="input-container">
              <Mail className="input-icon-left" size={16} />
              <input
                type="email"
                className="form-input has-icon"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Mobile Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  For SMS ticket alerts
                </span>
              </div>
              <div className="input-container">
                <Phone className="input-icon-left" size={16} />
                <input
                  type="tel"
                  className="form-input has-icon"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: !isLogin ? 12 : 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              {!isLogin && (
                <span style={{ fontSize: 11, fontWeight: 700, color: password ? pwdValidation.strengthColor : 'var(--text-muted)' }}>
                  {password ? `${pwdValidation.strengthLabel} Security` : '8+ chars required'}
                </span>
              )}
            </div>
            <div className="input-container">
              <Lock className="input-icon-left" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input has-icon"
                placeholder={isLogin ? '••••••••' : 'Enter a strong password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isLogin ? undefined : 8}
                maxLength={128}
                required
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live Security Strength Bar & Requirements Checklist on Registration */}
            {!isLogin && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg-subtle, rgba(15, 23, 42, 0.03))', borderRadius: 'var(--radius-xs, 6px)', border: '1px solid var(--border-default, #e2e8f0)' }}>
                {/* Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password Requirements:
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: password ? pwdValidation.strengthColor : 'var(--text-muted)' }}>
                    {password ? `${pwdValidation.score}/5 Rules Met` : 'Required Rules'}
                  </span>
                </div>
                <div style={{ height: 4, width: '100%', background: 'var(--border-subtle, #e2e8f0)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${password ? (pwdValidation.score / 5) * 100 : 0}%`,
                      background: pwdValidation.strengthColor,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                </div>

                {/* Rule checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px', fontSize: 11.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: pwdValidation.checks.minLength ? '#10b981' : 'var(--text-muted, #94a3b8)', transition: 'color 0.2s ease' }}>
                    <Check size={12} strokeWidth={pwdValidation.checks.minLength ? 3 : 1.5} color={pwdValidation.checks.minLength ? '#10b981' : '#94a3b8'} />
                    <span>8+ characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: (pwdValidation.checks.hasUppercase && pwdValidation.checks.hasLowercase) ? '#10b981' : 'var(--text-muted, #94a3b8)', transition: 'color 0.2s ease' }}>
                    <Check size={12} strokeWidth={(pwdValidation.checks.hasUppercase && pwdValidation.checks.hasLowercase) ? 3 : 1.5} color={(pwdValidation.checks.hasUppercase && pwdValidation.checks.hasLowercase) ? '#10b981' : '#94a3b8'} />
                    <span>Upper & Lowercase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: pwdValidation.checks.hasNumber ? '#10b981' : 'var(--text-muted, #94a3b8)', transition: 'color 0.2s ease' }}>
                    <Check size={12} strokeWidth={pwdValidation.checks.hasNumber ? 3 : 1.5} color={pwdValidation.checks.hasNumber ? '#10b981' : '#94a3b8'} />
                    <span>At least 1 number (0-9)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: pwdValidation.checks.hasSpecial ? '#10b981' : 'var(--text-muted, #94a3b8)', transition: 'color 0.2s ease' }}>
                    <Check size={12} strokeWidth={pwdValidation.checks.hasSpecial ? 3 : 1.5} color={pwdValidation.checks.hasSpecial ? '#10b981' : '#94a3b8'} />
                    <span>Special symbol (!@#$)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
            {loading && <Loader2 className="spin" size={16} />}
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In to Ward Registry' : 'Create Resident Account')}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="security-trust">
          <ShieldCheck size={13} color="var(--status-verified-fg)" />
          <span>Municipal Corporation of Delhi &bull; Secure Auth</span>
        </div>
      </div>
    </div>
  );
};
