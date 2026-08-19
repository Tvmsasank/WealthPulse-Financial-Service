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
  Trash2,
  AlertTriangle,
  ChevronRight
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
  const [mpinResetMessage, setMpinResetMessage] = useState('');
  const [mpinResetLoading, setMpinResetLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleRequestMpinReset = async () => {
    const emailToUse = (user?.email || localStorage.getItem('wealthpulse_remembered_email') || '').trim();
    if (!emailToUse) {
      setMpinResetMessage('User email not found. Please log in again.');
      return;
    }
    setMpinResetMessage('');
    setMpinResetLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/auth/forgot-mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to send MPIN reset link');
      setMpinResetMessage(`MPIN reset link sent to ${emailToUse}! Check your Gmail inbox.`);
    } catch (err) {
      setMpinResetMessage(err.name === 'AbortError' ? 'Server timed out. Please check your network and retry.' : (err.message || 'Failed to send MPIN reset link'));
    } finally {
      setMpinResetLoading(false);
    }
  };

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

  const handleDeleteAccountPermanent = async () => {
    if (deleteConfirmText.trim() !== 'DELETE MY ACCOUNT PERMANENTLY') {
      setDeleteError('Please type exact confirmation phrase: DELETE MY ACCOUNT PERMANENTLY');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete account');
      }

      localStorage.removeItem('wealthpulse_token');
      localStorage.removeItem('wealthpulse_user');
      localStorage.removeItem('wealthpulse_remembered_email');
      localStorage.removeItem('wealthpulse_has_mpin');
      localStorage.removeItem('ledgerly_token');
      localStorage.removeItem('ledgerly_user');
      localStorage.removeItem('ledgerly_remembered_email');
      localStorage.removeItem('ledgerly_has_mpin');

      onLogout();
      onClose();
    } catch (err) {
      setDeleteError(err.message || 'Account deletion failed');
    } finally {
      setDeletingAccount(false);
    }
  };

  const assets = Number(settings.assets || 0);
  const liabilities = Number(settings.liabilities || 0);
  const netWorth = assets - liabilities;
  const hasRegisteredMpin = !!(user?.hasMpin || user?.mpinHash || localStorage.getItem('wealthpulse_has_mpin') === 'true');
  const hasRegisteredBiometrics = !!(user?.hasBiometrics || user?.webauthnCredentialId || localStorage.getItem('wealthpulse_has_biometrics') === 'true');

  return (
    <div className={`modal-backdrop ${isLoggingOut ? 'fade-out' : ''}`} onClick={onClose} style={{ padding: '16px', boxSizing: 'border-box' }}>
      <div
        className={`modal-content ${isLoggingOut ? 'scale-down' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '20px 18px',
          borderRadius: '20px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '7px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1.2' }}>
                User Profile & Security
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Account credentials & authentication
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* User Identity Banner */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 25, 47, 0.8) 100%)',
            border: '1px solid var(--border-glass)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '17px',
              boxShadow: '0 4px 14px var(--primary-glow)',
              flexShrink: 0
            }}
          >
            {getInitials(user.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </h3>
              <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 5px' }}>
                <CheckCircle2 size={10} /> Verified
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={11} style={{ flexShrink: 0, color: 'var(--primary)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Fast Authentication Options (Full-Width Clean Stacked Rows) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Fast Authentication Options
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Face ID / Passkey Row */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onClick={handleEnableBiometrics}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
                  <Fingerprint size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>Face ID / Biometrics</div>
                  <div style={{ fontSize: '11px', color: hasRegisteredBiometrics ? '#34D399' : 'var(--text-muted)', fontWeight: hasRegisteredBiometrics ? '700' : '400' }}>
                    {hasRegisteredBiometrics ? '✓ Face ID / Passkey Active' : 'Touch ID & Device Passkey'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* 4-Digit MPIN Row */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  flex: 1,
                  boxSizing: 'border-box'
                }}
                onClick={() => {
                  onClose();
                  onOpenMpinModal(hasRegisteredMpin ? 'change' : 'set');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.16)', color: '#38BDF8', flexShrink: 0 }}>
                    <KeyRound size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>
                      {hasRegisteredMpin ? 'Change 4-Digit MPIN' : 'Set 4-Digit MPIN'}
                    </div>
                    <div style={{ fontSize: '11px', color: hasRegisteredMpin ? '#34D399' : 'var(--text-muted)', fontWeight: hasRegisteredMpin ? '700' : '400' }}>
                      {hasRegisteredMpin ? '✓ MPIN Active' : 'Enable Fast PIN Login'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>

              {hasRegisteredMpin && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#F87171',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleRequestMpinReset}
                  disabled={mpinResetLoading}
                  title="Send MPIN Reset Link to Email"
                >
                  {mpinResetLoading ? 'Sending...' : 'Reset MPIN'}
                </button>
              )}
            </div>
          </div>

          {mpinResetMessage && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> {mpinResetMessage}
              </div>
              <button type="button" onClick={() => setMpinResetMessage('')} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
          )}

          {bioMessage && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> {bioMessage}
              </div>
              <button type="button" onClick={() => setBioMessage('')} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
          )}

          {bioError && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: '1px solid #EF4444', borderRadius: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                <span>{bioError}</span>
              </div>
              <button type="button" onClick={() => setBioError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '2px' }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Portfolio Summary KPI Cards */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Financial Portfolio Summary
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={12} style={{ color: 'var(--primary)' }} /> Net Worth
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: netWorth >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '4px' }}>
                ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Receipt size={12} style={{ color: '#38BDF8' }} /> Transactions
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
                {transactionCount} <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>entries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Deletion Confirmation Card */}
        {showDeleteConfirm && (
          <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FCA5A5', fontWeight: '800', fontSize: '12px', marginBottom: '4px' }}>
              <AlertTriangle size={14} /> Permanently Delete Account?
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
              This will permanently delete your account (<strong>{user.email}</strong>) and all records. This action cannot be undone.
            </p>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px', color: '#FCA5A5', fontWeight: '700', display: 'block', marginBottom: '3px' }}>
                Type <code>DELETE MY ACCOUNT PERMANENTLY</code>:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="DELETE MY ACCOUNT PERMANENTLY"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                style={{ borderColor: '#EF4444', fontSize: '11px', padding: '6px 8px' }}
              />
            </div>

            {deleteError && (
              <div style={{ fontSize: '11px', color: '#FCA5A5', marginBottom: '6px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)} disabled={deletingAccount} style={{ fontSize: '11px', padding: '4px 8px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteAccountPermanent} disabled={deletingAccount} style={{ fontSize: '11px', padding: '4px 8px' }}>
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: '#EF4444', fontSize: '11px', padding: '6px' }}
          >
            <Trash2 size={12} /> Delete Account
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onOpenForgotPassword();
              }}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              <Lock size={12} /> Password
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleLogoutAnimated}
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
