import React, { useState, useEffect, useCallback } from 'react';
import { X, Lock, Mail, User, CheckCircle2, AlertCircle, Fingerprint, KeyRound, Shield, Delete, RefreshCw } from 'lucide-react';
import { authenticateWithBiometrics, isBiometricsAvailable } from '../utils/biometrics';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login', // 'login' | 'register'
  onLoginSuccess,
  onOpenForgotPassword,
  onOpenMpinModal
}) {
  if (!isOpen) return null;

  const rememberedEmail = localStorage.getItem('wealthpulse_remembered_email') || localStorage.getItem('ledgerly_remembered_email') || '';
  const hasMpin = localStorage.getItem('wealthpulse_has_mpin') === 'true' || localStorage.getItem('ledgerly_has_mpin') === 'true';
  const hasBiometrics = localStorage.getItem('wealthpulse_has_biometrics') === 'true' || localStorage.getItem('ledgerly_has_biometrics') === 'true';

  const getInitialAuthMethod = () => {
    if (initialMode === 'register') return 'register';
    if (hasBiometrics && rememberedEmail) return 'biometrics';
    if (hasMpin && rememberedEmail) return 'mpin';
    return 'password';
  };

  const [authMethod, setAuthMethod] = useState(getInitialAuthMethod);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [mpin, setMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [emailHasMpin, setEmailHasMpin] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('wealthpulse_remembered_email') || localStorage.getItem('ledgerly_remembered_email') || '';
    setEmail(savedEmail);
    setMpin('');
    setError('');
    setSuccess('');

    isBiometricsAvailable().then(setBiometricSupported);

    if (initialMode === 'register') {
      setAuthMethod('register');
      return;
    }

    if (savedEmail) {
      fetch('/api/auth/check-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail })
      })
        .then(res => res.json())
        .then(data => {
          if (data.hasMpin) {
            localStorage.setItem('wealthpulse_has_mpin', 'true');
            setEmailHasMpin(true);
            setAuthMethod('mpin');
          } else {
            setAuthMethod('password');
          }
        })
        .catch(() => {
          if (hasMpin) setAuthMethod('mpin');
          else setAuthMethod('password');
        });
    } else {
      setAuthMethod('password');
    }
  }, [initialMode, isOpen]);

  // Dynamically check if typed email has MPIN set
  const handleEmailChange = (val) => {
    setEmail(val);
    setEmailHasMpin(false);
    if (val && val.includes('@')) {
      fetch('/api/auth/check-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val.trim() })
      })
        .then(res => res.json())
        .then(data => {
          if (data.hasMpin) {
            setEmailHasMpin(true);
          }
        })
        .catch(() => {});
    }
  };

  const handleKeyPress = useCallback((digit) => {
    if (loading || authMethod !== 'mpin') return;
    if (mpin.length < 4) {
      const nextMpin = mpin + digit;
      setMpin(nextMpin);
      if (nextMpin.length === 4) {
        handleVerifyMpin(nextMpin);
      }
    }
  }, [mpin, loading, authMethod]);

  const handleDeleteMpin = useCallback(() => {
    if (loading || authMethod !== 'mpin') return;
    setMpin(prev => prev.slice(0, -1));
  }, [loading, authMethod]);

  useEffect(() => {
    if (!isOpen || authMethod !== 'mpin') return;
    const handleKeyDown = (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteMpin();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, authMethod, handleKeyPress, handleDeleteMpin, onClose]);

  const handleVerifyMpin = async (completedMpin) => {
    setLoading(true);
    setError('');
    try {
      const targetEmail = email || rememberedEmail;
      const res = await fetch('/api/auth/mpin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, mpin: completedMpin })
      });

      const responseText = await res.text();
      let json = {};
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        throw new Error('API server connection lost.');
      }

      if (!res.ok) throw new Error(json.error || 'Invalid 4-Digit MPIN');

      localStorage.setItem('wealthpulse_remembered_email', targetEmail);
      localStorage.setItem('wealthpulse_has_mpin', 'true');
      setSuccess('MPIN Verified! Logging in...');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, true);
        onClose();
      }, 400);
    } catch (err) {
      setError(err.message || 'MPIN verification failed');
      setMpin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (emailToUse) => {
    setError('');
    setLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      setSuccess('Face ID / Biometric Verified! Unlocking...');
      setTimeout(() => {
        onLoginSuccess(result.user, result.token, true);
        onClose();
      }, 400);
    } catch (err) {
      if (hasMpin) {
        setAuthMethod('mpin');
        setError('Biometric scan cancelled. Enter your 4-Digit MPIN.');
      } else {
        setAuthMethod('password');
        setError(err.message || 'Biometric scan failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sign in failed');

      if (rememberMe) {
        localStorage.setItem('wealthpulse_remembered_email', email.trim());
      }

      setSuccess('Sign in successful!');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, rememberMe);
        onClose();
      }, 400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');

      localStorage.setItem('wealthpulse_remembered_email', email.trim());
      setSuccess('Account created successfully!');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, true);
        onClose();
      }, 400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('wealthpulse_remembered_email');
    localStorage.removeItem('ledgerly_remembered_email');
    setEmail('');
    setMpin('');
    setEmailHasMpin(false);
    setAuthMethod('password');
  };

  const getInitials = (emailStr) => {
    if (!emailStr) return 'U';
    const namePart = emailStr.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {authMethod === 'register' ? 'Create WealthPulse Account' : 'Sign In to WealthPulse'}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {authMethod === 'mpin' ? 'Enter 4-Digit MPIN to unlock' : 'Secure financial dashboard access'}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Toggle for Register / Sign In */}
        {authMethod !== 'register' && !rememberedEmail && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-app)', padding: '5px', borderRadius: '14px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn"
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: authMethod !== 'register' ? 'var(--primary)' : 'transparent',
                color: authMethod !== 'register' ? '#000000' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '700'
              }}
              onClick={() => { setAuthMethod('password'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn"
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: authMethod === 'register' ? 'var(--primary)' : 'transparent',
                color: authMethod === 'register' ? '#000000' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '700'
              }}
              onClick={() => { setAuthMethod('register'); setError(''); }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Remembered User Card */}
        {rememberedEmail && authMethod !== 'register' && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 25, 47, 0.8) 100%)',
              border: '1px solid var(--border-glass)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '15px',
                  flexShrink: 0
                }}
              >
                {getInitials(rememberedEmail)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rememberedEmail}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Remembered Account
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0, gap: '6px', borderRadius: '10px' }}
              onClick={handleSwitchAccount}
              title="Switch Account"
            >
              <RefreshCw size={13} /> Switch
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid #EF4444', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* MODE 1: 4-DIGIT MPIN VIEW */}
        {authMethod === 'mpin' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Type or tap your 4-digit Security MPIN
            </p>

            {/* Tactile 4-Dot Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              {[0, 1, 2, 3].map(index => {
                const isFilled = mpin.length > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isFilled ? 'var(--primary)' : 'transparent',
                      border: isFilled ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                      boxShadow: isFilled ? '0 0 12px var(--primary-glow)' : 'none',
                      transition: 'all 0.25s var(--ease-spring)',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                );
              })}
            </div>

            {/* Number Pad Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '280px', margin: '0 auto 20px auto' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    height: '52px',
                    fontSize: '20px',
                    fontWeight: '700',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleKeyPress(num)}
                  disabled={loading}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  height: '52px',
                  fontSize: '20px',
                  fontWeight: '700',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => handleKeyPress('0')}
                disabled={loading}
              >
                0
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  height: '52px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
                onClick={handleDeleteMpin}
                disabled={loading}
                title="Backspace"
              >
                <Delete size={22} />
              </button>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px' }}>
              {hasBiometrics && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--primary)', gap: '6px' }}
                  onClick={() => handleBiometricLogin(rememberedEmail)}
                >
                  <Fingerprint size={16} /> Touch Face ID
                </button>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-muted)', gap: '6px', marginLeft: 'auto' }}
                onClick={() => setAuthMethod('password')}
              >
                <Lock size={14} /> Use Password instead
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: STANDARD EMAIL + PASSWORD LOGIN */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  required
                />
              </div>

              {emailHasMpin && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '12px', padding: '8px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    onClick={() => setAuthMethod('mpin')}
                  >
                    <KeyRound size={14} /> Sign In with 4-Digit MPIN
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: 0, color: 'var(--primary)' }}
                onClick={() => {
                  onClose();
                  onOpenForgotPassword();
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* MODE 3: CREATE ACCOUNT */}
        {authMethod === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
