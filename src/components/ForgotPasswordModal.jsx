import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, CheckCircle2, AlertCircle, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onOpenLogin, initialToken = '' }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(initialToken ? 2 : 1); // 1: Enter Email, 2: Sent Email Link / Set Password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(initialToken);
  const [resetUrl, setResetUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (initialToken) {
      setResetToken(initialToken);
      setStep(2);
    }
  }, [initialToken]);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');

      setResetToken(json.resetToken);
      setResetUrl(json.resetUrl || `http://localhost:3000/?resetToken=${json.resetToken}`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send password reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reset failed');

      setSuccessMessage('Password reset successfully! Redirecting to Sign In...');
      setTimeout(() => {
        onClose();
        onOpenLogin();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>{step === 1 ? 'Forgot Password' : 'Set New Password'}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '10px 14px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMessage}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestLink}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Enter your registered email address. Ledgerly will generate an authenticated password reset link for your account.
            </p>

            <div className="form-group">
              <label className="form-label">Account Email Address</label>
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Sending Reset Email...' : 'Send Password Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            {/* Email Link Notification Card */}
            <div style={{ padding: '14px', background: 'var(--bg-app)', border: '1px solid var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Reset Link Sent to Inbox</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target: <strong>{email || 'Your Registered Email'}</strong></div>
                </div>
              </div>

              {resetUrl && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Click link from email inbox to trigger reset modal:</span>
                  <a
                    href={resetUrl}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', wordBreak: 'break-all', color: 'var(--primary)' }}
                  >
                    Open Password Reset Link <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Saving Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
