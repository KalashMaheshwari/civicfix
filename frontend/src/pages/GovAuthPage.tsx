import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const GovAuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('official1@mcd.gov.in');
    setPassword('admin123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      if (res.user.role === 'citizen') {
        throw new Error('This account belongs to a citizen. Please sign in via the Citizen Portal.');
      }
      login(res.access_token, res.user);
      navigate('/gov/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <Link to="/" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={13} />
          <span>Back to Citizen Portal</span>
        </Link>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div style={{ marginBottom: 12 }}>
            <img src="/mcd.png" alt="MCD Official" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          </div>
          <h1 className="auth-title">MCD Engineering Console</h1>
          <p className="auth-subtitle">Authorized Municipal Corporation of Delhi Zonal Operations.</p>
        </div>

        <div className="demo-badge">
          <span>Official: <strong>official1@mcd.gov.in</strong></span>
          <button type="button" className="demo-fill-btn" onClick={handleFillDemo}>Quick Fill</button>
        </div>

        {error && (
          <div style={{ background: 'var(--status-open-bg)', color: 'var(--status-open-fg)', padding: '9px 12px', borderRadius: 'var(--radius-xs)', fontSize: 12.5, marginBottom: 16, border: '1px solid var(--status-open-border)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Government Email Address</label>
            <div className="input-container">
              <Mail className="input-icon-left" size={16} />
              <input type="email" className="form-input has-icon" placeholder="name@mcd.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Secure Access Key / Password</label>
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
            {loading ? 'Verifying Authorization...' : 'Sign In to Engineering Console'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="security-trust">
          <Building2 size={13} color="var(--text-muted)" />
          <span>MCD Central Command Network &bull; Zonal Triage Unit</span>
        </div>
      </div>
    </div>
  );
};
