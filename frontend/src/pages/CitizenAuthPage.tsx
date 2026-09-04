import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
              <label className="form-label">Full Name</label>
              <div className="input-container">
                <User className="input-icon-left" size={16} />
                <input type="text" className="form-input has-icon" placeholder="Priya Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon-left" size={16} />
              <input type="email" className="form-input has-icon" placeholder="citizen@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Mobile Number (SMS Updates)</label>
              <div className="input-container">
                <Phone className="input-icon-left" size={16} />
                <input type="tel" className="form-input has-icon" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon-left" size={16} />
              <input type={showPassword ? 'text' : 'password'} className="form-input has-icon" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
