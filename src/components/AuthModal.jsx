import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login', // 'login' | 'register'
  onLoginSuccess,
  onOpenForgotPassword
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('ledgerly_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    const savedEmail = localStorage.getItem('ledgerly_remembered_email');
    return savedEmail ? true : true;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync remembered email on modal open
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('ledgerly_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const trimmedEmail = email.trim();
    const payload = mode === 'register'
      ? { name: name.trim(), email: trimmedEmail, password }
      : { email: trimmedEmail, password, rememberMe };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Authentication failed');
      }

      // Save or remove remembered email based on Remember Me checkbox
      if (rememberMe) {
        localStorage.setItem('ledgerly_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('ledgerly_remembered_email');
      }

      setSuccess(json.message || 'Authenticated successfully!');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, rememberMe);
        onClose();
      }, 600);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>{mode === 'login' ? 'Sign In to Ledgerly' : 'Create Account'}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <button
            type="button"
            className="btn"
            style={{
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600'
            }}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? 'white' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600'
            }}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@example.com"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => {
                  onClose();
                  onOpenForgotPassword();
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: mode === 'register' ? '12px' : '0' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
