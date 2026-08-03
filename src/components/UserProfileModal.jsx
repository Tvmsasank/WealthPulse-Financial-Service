import React, { useState } from 'react';
import { X, User, Mail, ShieldCheck, Lock, Calendar, Wallet, LogOut, KeyRound, CheckCircle2, Edit3 } from 'lucide-react';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  settings = {},
  transactionCount = 0,
  onLogout,
  onOpenForgotPassword
}) {
  if (!isOpen || !user) return null;

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const assets = Number(settings.assets || 0);
  const liabilities = Number(settings.liabilities || 0);
  const netWorth = assets - liabilities;

  return (
    <div className={`modal-backdrop ${isLoggingOut ? 'fade-out' : ''}`} onClick={onClose}>
      <div
        className={`modal-content ${isLoggingOut ? 'scale-down' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', transition: 'all 0.3s ease' }}
      >
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>User Profile & Portfolio</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Identity Header Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 110, 230, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary-light)', marginBottom: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C6EE6 0%, #4F46E5 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(124, 110, 230, 0.3)'
              }}
            >
              {getInitials(user.name)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{user.name}</h3>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>
                  <CheckCircle2 size={12} /> Verified Owner
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Portfolio Summary */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700' }}>
            Financial Portfolio Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Net Worth Valuation</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {settings.netWorthConfigured ? `₹${netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Not set'}
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Managed Transactions</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                {transactionCount} records
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700' }}>
            Security & Cryptographic Architecture
          </h4>
          <div className="card" style={{ padding: '16px', background: 'var(--bg-app)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Password Hashing:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>bcrypt (10 rounds)</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Session Security:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>JWT Authorized Token</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Workspace Mode:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>Per-User Isolated Multi-Tenant</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onOpenForgotPassword();
            }}
          >
            <KeyRound size={14} /> Change Password
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={handleLogoutAnimated}
            disabled={isLoggingOut}
          >
            <LogOut size={14} /> {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
