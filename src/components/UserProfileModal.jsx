import React, { useState } from 'react';
import { X, User, Mail, ShieldCheck, Lock, Calendar, Wallet, LogOut, KeyRound, CheckCircle2, Fingerprint, ShieldAlert, Sparkles } from 'lucide-react';
import { registerBiometricPasskey } from '../utils/biometrics';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  token,
  settings = {},
  transactionCount = 0,
  onLogout,
  onOpenForgotPassword,
  onOpenMpinModal
}) {
  if (!isOpen || !user) return null;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [bioMessage, setBioMessage] = useState('');
  const [bioError, setBioError] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogoutAnimated = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
      onClose();
      setIsLoggingOut(false);
    }, 400);
  };

  const handleEnableBiometrics = async () => {
    setBioMessage('');
    setBioError('');
    try {
      await registerBiometricPasskey(user, token);
      setBioMessage('Face ID / Touch ID Biometrics Enabled!');
    } catch (err) {
      setBioError(err.message || 'Failed to enable biometrics');
    }
  };

  const assets = Number(settings.assets || 0);
  const liabilities = Number(settings.liabilities || 0);
  const netWorth = assets - liabilities;

  return (
    <div className={`modal-backdrop ${isLoggingOut ? 'fade-out' : ''}`}>
      <div
        className={`modal-content ${isLoggingOut ? 'scale-down' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}
      >
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <h2 style={{ fontSize: '18px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>User Profile & Security</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Identity Header Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 110, 230, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary-light)', marginBottom: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C6EE6 0%, #4F46E5 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(124, 110, 230, 0.3)',
                flexShrink: 0
              }}
            >
              {getInitials(user.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, wordBreak: 'break-word' }}>{user.name}</h3>
                <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                  <CheckCircle2 size={11} /> Verified Owner
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Mail size={12} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Authentication Actions: Biometrics & MPIN */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
            Fast Authentication Options
          </h4>
          <div className="user-profile-grid-2">
            <button
              className="btn btn-secondary"
              style={{ fontSize: '13px', justifyContent: 'flex-start', padding: '10px 12px' }}
              onClick={handleEnableBiometrics}
            >
              <Fingerprint size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontWeight: '700' }}>Face ID / Biometrics</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enable Touch ID / Passkey</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '13px', justifyContent: 'flex-start', padding: '10px 12px' }}
              onClick={() => {
                onClose();
                onOpenMpinModal('set');
              }}
            >
              <KeyRound size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontWeight: '700' }}>4-Digit MPIN</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Set Quick Mobile Pin</div>
              </div>
            </button>
          </div>

          {bioMessage && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> {bioMessage}
            </div>
          )}

          {bioError && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} /> {bioError}
            </div>
          )}
        </div>

        {/* Portfolio Quick Summary */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
            Financial Portfolio Summary
          </h4>
          <div className="user-profile-grid-2">
            <div className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Net Worth Valuation</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Managed Transactions</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                {transactionCount} records
              </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
            Security Architecture
          </h4>
          <div className="card" style={{ padding: '12px', marginBottom: 0, fontSize: '12px' }}>
            <div className="user-profile-grid-2">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Password Hashing:</span>
                <div style={{ fontWeight: '700', marginTop: '2px' }}>bcrypt (10 rounds)</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Passkeys & Biometrics:</span>
                <div style={{ fontWeight: '700', marginTop: '2px' }}>W3C WebAuthn Hardware</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onOpenForgotPassword();
            }}
            style={{ fontSize: '12px' }}
          >
            <Lock size={14} /> Change Password
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleLogoutAnimated}
            style={{ fontSize: '12px' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
