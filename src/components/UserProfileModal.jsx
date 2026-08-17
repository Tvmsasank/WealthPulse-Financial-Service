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
  Trash2,
  AlertTriangle
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

      // Wipe all local storage keys
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

  return (
    <div className={`modal-backdrop ${isLoggingOut ? 'fade-out' : ''}`}>
      <div
        className={`modal-content ${isLoggingOut ? 'scale-down' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '24px 20px',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1.2' }}>
                User Profile & Security
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Account credentials & authentication settings</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* User Identity Banner */}
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 25, 47, 0.8) 100%)',
            border: '1px solid var(--border-glass)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '18px',
              boxShadow: '0 4px 16px var(--primary-glow)',
              flexShrink: 0
            }}
          >
            {getInitials(user.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{user.name}</h3>
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                <CheckCircle2 size={11} /> Verified Owner
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} style={{ flexShrink: 0, color: 'var(--primary)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Fast Authentication Options */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Fast Authentication Options
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* Face ID Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                justifyContent: 'flex-start',
                textAlign: 'left',
                minHeight: '68px',
                boxSizing: 'border-box'
              }}
              onClick={handleEnableBiometrics}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', flexShrink: 0 }}>
                <Fingerprint size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.2' }}>Face ID / Biometrics</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Touch ID & Passkey
                </div>
              </div>
            </button>

            {/* 4-Digit MPIN Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                justifyContent: 'flex-start',
                textAlign: 'left',
                minHeight: '68px',
                boxSizing: 'border-box'
              }}
              onClick={() => {
                onClose();
                onOpenMpinModal(hasRegisteredMpin ? 'change' : 'set');
              }}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.16)', color: '#38BDF8', flexShrink: 0 }}>
                <KeyRound size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.2' }}>
                  {hasRegisteredMpin ? 'Change 4-Digit PIN' : 'Set 4-Digit PIN'}
                </div>
                <div style={{ fontSize: '11px', color: hasRegisteredMpin ? '#34D399' : 'var(--text-muted)', marginTop: '3px', fontWeight: hasRegisteredMpin ? '700' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hasRegisteredMpin ? '✓ MPIN Active' : 'Set Quick Mobile PIN'}
                </div>
              </div>
            </button>
          </div>

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
              <button type="button" onClick={() => setBioError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '2px' }} title="Dismiss">
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
            <div style={{ padding: '12px', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', minHeight: '68px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Wallet size={13} style={{ color: 'var(--primary)' }} /> Net Worth Valuation
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: netWorth >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '4px' }}>
                ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', minHeight: '68px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Receipt size={13} style={{ color: '#38BDF8' }} /> Managed Records
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
                {transactionCount} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>entries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Deletion Confirmation Card */}
        {showDeleteConfirm && (
          <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCA5A5', fontWeight: '800', fontSize: '13px', marginBottom: '6px' }}>
              <AlertTriangle size={16} /> Permanently Delete Account?
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '10px' }}>
              This will permanently delete your account (<strong>{user.email}</strong>), passwords, MPIN, transactions, and investments. This action cannot be undone.
            </p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Type <code>DELETE MY ACCOUNT PERMANENTLY</code>:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="DELETE MY ACCOUNT PERMANENTLY"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                style={{ borderColor: '#EF4444', fontSize: '12px' }}
              />
            </div>

            {deleteError && (
              <div style={{ fontSize: '11px', color: '#FCA5A5', marginBottom: '8px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)} disabled={deletingAccount} style={{ fontSize: '12px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteAccountPermanent} disabled={deletingAccount} style={{ fontSize: '12px' }}>
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: '#EF4444', fontSize: '12px', padding: '6px 8px' }}
          >
            <Trash2 size={13} /> Delete Account
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onOpenForgotPassword();
              }}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Lock size={13} /> Change Password
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleLogoutAnimated}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
