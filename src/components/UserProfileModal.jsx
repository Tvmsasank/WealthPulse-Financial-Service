import React, { useState } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  Lock,
  Wallet,
  LogOut,
  KeyRound,
  CheckCircle2,
  Fingerprint,
  ShieldAlert,
  Sparkles,
  Receipt,
  Cpu,
  Check
} from 'lucide-react';
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
    }, 350);
  };

  const handleEnableBiometrics = async () => {
    setBioMessage('');
    setBioError('');
    try {
      await registerBiometricPasskey(user, token);
      setBioMessage('Face ID / Touch ID Biometrics Enabled!');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('timed out') || msg.includes('cancelled') || msg.includes('not allowed')) {
        setBioError('Passkey prompt closed. You can also use 4-Digit MPIN for quick access.');
      } else {
        setBioError(msg || 'Failed to enable biometrics');
      }
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
        style={{
          maxWidth: '560px',
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                User Profile & Security
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account credentials & authentication settings</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* User Identity Banner */}
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 25, 47, 0.8) 100%)',
            border: '1px solid var(--border-glass)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '20px',
              boxShadow: '0 4px 16px var(--primary-glow)',
              flexShrink: 0
            }}
          >
            {getInitials(user.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{user.name}</h3>
              <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                <CheckCircle2 size={12} /> Verified Owner
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} style={{ flexShrink: 0, color: 'var(--primary)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Fast Authentication Options */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Fast Authentication Options
          </div>

          <div className="user-profile-grid-2">
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '14px',
                justifyContent: 'flex-start',
                textAlign: 'left'
              }}
              onClick={handleEnableBiometrics}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
                <Fingerprint size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>Face ID / Biometrics</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Enable Touch ID / Passkey</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '14px',
                justifyContent: 'flex-start',
                textAlign: 'left'
              }}
              onClick={() => {
                onClose();
                onOpenMpinModal('set');
              }}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.16)', color: '#38BDF8', flexShrink: 0 }}>
                <KeyRound size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>4-Digit MPIN</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Set Quick Mobile Pin</div>
              </div>
            </button>
          </div>

          {bioMessage && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> {bioMessage}
              </div>
              <button type="button" onClick={() => setBioMessage('')} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {bioError && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid #EF4444', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{bioError}</span>
              </div>
              <button type="button" onClick={() => setBioError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '2px' }} title="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Portfolio Summary KPI Cards */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Financial Portfolio Summary
          </div>

          <div className="user-profile-grid-2">
            <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={14} style={{ color: 'var(--primary)' }} /> Net Worth Valuation
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: netWorth >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={14} style={{ color: '#38BDF8' }} /> Managed Transactions
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>
                {transactionCount} <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>records</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Architecture */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Security Architecture
          </div>

          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div className="user-profile-grid-2" style={{ gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Password Hashing
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                  bcrypt (10 rounds)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={12} /> Passkeys & Biometrics
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                  W3C WebAuthn Hardware
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              onOpenForgotPassword();
            }}
            style={{ fontSize: '13px', padding: '9px 16px' }}
          >
            <Lock size={15} /> Change Password
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLogoutAnimated}
            style={{ fontSize: '13px', padding: '9px 18px' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
