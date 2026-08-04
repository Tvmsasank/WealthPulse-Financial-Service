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

  const rememberedEmail = localStorage.getItem('ledgerly_remembered_email') || '';
  const hasMpin = localStorage.getItem('ledgerly_has_mpin') === 'true';
  const hasBiometrics = localStorage.getItem('ledgerly_has_biometrics') === 'true';

  // Zerodha Kite Smart Auth Method Priority:
  // 1. Biometrics (if registered and remembered email exists)
  // 2. MPIN (if MPIN set and remembered email exists)
  // 3. Password (initial/default)
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

  // Sync remembered state & Auto-trigger Biometrics on Modal Open like Zerodha Kite
  useEffect(() => {
    const savedEmail = localStorage.getItem('ledgerly_remembered_email') || '';
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
      // Query server for MPIN / Biometrics status for this email across all domains
      fetch('/api/auth/check-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail })
      })
        .then(res => res.json())
        .then(data => {
          if (data.hasBiometrics && localStorage.getItem('ledgerly_biometric_credential')) {
            localStorage.setItem('ledgerly_has_biometrics', 'true');
            setAuthMethod('biometrics');
            handleBiometricLogin(savedEmail);
          } else if (data.hasMpin) {
            localStorage.setItem('ledgerly_has_mpin', 'true');
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
  }, [isOpen, initialMode]);

  const handleKeyPress = useCallback((numStr) => {
    if (loading || authMethod !== 'mpin') return;
    setError('');

    if (mpin.length < 4) {
      const next = mpin + numStr;
      setMpin(next);
      if (next.length === 4) handleVerifyMpin(next);
    }
  }, [loading, authMethod, mpin]);

  const handleDeleteMpin = useCallback(() => {
    if (loading || authMethod !== 'mpin') return;
    setError('');
    setMpin(prev => prev.slice(0, -1));
  }, [loading, authMethod]);

  // Physical Keyboard Listener for Zerodha MPIN mode
  useEffect(() => {
    if (!isOpen || authMethod !== 'mpin') return;
    const handleKeyDown = (e) => {
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
        throw new Error('API server connection lost. Please check node server.');
      }

      if (!res.ok) throw new Error(json.error || 'Invalid 4-Digit MPIN');

      setSuccess('MPIN Verified! Logging in...');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, true);
        onClose();
      }, 500);
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
      }, 500);
    } catch (err) {
      // Zerodha Fallback: If biometrics is cancelled or failed, fallback to MPIN
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authMethod === 'register') {
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
    const endpoint = authMethod === 'register' ? '/api/auth/register' : '/api/auth/login';
    const trimmedEmail = email.trim();
    const payload = authMethod === 'register'
      ? { name: name.trim(), email: trimmedEmail, password }
      : { email: trimmedEmail, password, rememberMe };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await res.text();
      let json = {};
      try {
        json = JSON.parse(responseText);
      } catch (e) {}

      if (!res.ok) {
        throw new Error(json.error || 'Invalid email or password. If this is a fresh Render deployment, please click "Create Account" first.');
      }

      if (rememberMe) {
        localStorage.setItem('ledgerly_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('ledgerly_remembered_email');
      }

      setSuccess(json.message || 'Authenticated successfully!');
      setTimeout(() => {
        onLoginSuccess(json.user, json.token, rememberMe);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('ledgerly_remembered_email');
    localStorage.removeItem('ledgerly_has_mpin');
    localStorage.removeItem('ledgerly_has_biometrics');
    setEmail('');
    setMpin('');
    setAuthMethod('password');
  };

  const getInitials = (emailStr) => {
    if (!emailStr) return 'U';
    const namePart = emailStr.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>
              {authMethod === 'register' ? 'Create Account' : 'Sign In to Ledgerly'}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Toggle for Register / Sign In */}
        {authMethod !== 'register' && !rememberedEmail && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <button
              type="button"
              className="btn"
              style={{
                background: authMethod !== 'register' ? 'var(--primary)' : 'transparent',
                color: authMethod !== 'register' ? 'white' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600'
              }}
              onClick={() => { setAuthMethod('password'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: authMethod === 'register' ? 'var(--primary)' : 'transparent',
                color: authMethod === 'register' ? 'white' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600'
              }}
              onClick={() => { setAuthMethod('register'); setError(''); }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* User Identity Header Card (Zerodha Kite Style) */}
        {rememberedEmail && authMethod !== 'register' && (
          <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(124, 110, 230, 0.12) 0%, rgba(79, 70, 229, 0.04) 100%)', border: '1px solid var(--primary-light)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
                {getInitials(rememberedEmail)}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{rememberedEmail}</div>
                <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Remembered Account
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', color: 'var(--text-muted)', gap: '4px' }}
              onClick={handleSwitchAccount}
              title="Switch Account"
            >
              <RefreshCw size={13} /> Switch
            </button>
          </div>
        )}

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

        {/* MODE 1: ZERODHA KITE 4-DIGIT MPIN VIEW */}
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

            {/* Bottom Actions Bar (Zerodha Kite Style) */}
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
                <Lock size={15} /> Use Password instead
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: ZERODHA KITE BIOMETRICS VIEW */}
        {authMethod === 'biometrics' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 0 24px var(--primary-glow)',
                animation: 'pulse 2s infinite'
              }}
            >
              <Fingerprint size={42} />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
              Touch Sensor to Unlock
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Verifying Face ID / Touch ID Biometrics for {rememberedEmail}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', marginBottom: '16px' }}
              onClick={() => handleBiometricLogin(rememberedEmail)}
              disabled={loading}
            >
              {loading ? 'Scanning Biometrics...' : 'Touch Sensor to Scan'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px' }}>
              {hasMpin && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                  onClick={() => setAuthMethod('mpin')}
                >
                  Use 4-Digit MPIN
                </button>
              )}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setAuthMethod('password')}
              >
                Use Password instead
              </button>
            </div>
          </div>
        )}

        {/* MODE 3 & 4: TRADITIONAL PASSWORD / REGISTER FORM */}
        {(authMethod === 'password' || authMethod === 'register') && (
          <form onSubmit={handlePasswordSubmit}>
            {authMethod === 'register' && (
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

            {authMethod === 'register' && (
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

            {authMethod === 'password' && (
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

            {/* Quick Switch to MPIN / Biometrics if set */}
            {authMethod === 'password' && (hasMpin || hasBiometrics) && (
              <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                {hasMpin && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '12px', gap: '6px' }}
                    onClick={() => setAuthMethod('mpin')}
                  >
                    <KeyRound size={14} style={{ color: 'var(--success)' }} /> Use 4-Digit MPIN
                  </button>
                )}
                {hasBiometrics && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '12px', gap: '6px' }}
                    onClick={() => handleBiometricLogin(rememberedEmail)}
                  >
                    <Fingerprint size={14} style={{ color: 'var(--primary)' }} /> Touch Face ID
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: authMethod === 'register' ? '12px' : '0' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : (authMethod === 'password' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
