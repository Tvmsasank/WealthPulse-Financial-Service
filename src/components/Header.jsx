import React, { useState } from 'react';
import {
  FolderSync,
  Upload,
  Plus,
  LogIn,
  UserPlus,
  LogOut,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Landmark,
  TrendingUp,
  Shield,
  Lock
} from 'lucide-react';

const LIVE_TICKERS = [
  { name: 'NIFTY 50', value: '24,050.05', change: '+237.65', pct: '+0.98%', isUp: true },
  { name: 'SENSEX', value: '78,907.64', change: '+820.56', pct: '+1.06%', isUp: true },
  { name: 'BANK NIFTY', value: '51,240.20', change: '+426.30', pct: '+0.84%', isUp: true },
  { name: 'S&P 500', value: '5,691.76', change: '+38.50', pct: '+0.68%', isUp: true },
  { name: 'NASDAQ', value: '18,289.71', change: '+239.80', pct: '+1.33%', isUp: true },
  { name: 'DOW JONES', value: '40,834.97', change: '+185.20', pct: '+0.45%', isUp: true },
  { name: 'GOLD 24K', value: '₹72,450/10g', change: '+₹320', pct: '+0.45%', isUp: true },
  { name: 'SILVER', value: '₹84,200/kg', change: '+₹950', pct: '+1.15%', isUp: true },
  { name: 'USD/INR', value: '₹83.92', change: '+0.03', pct: '+0.04%', isUp: true }
];

export default function Header({
  activeTabTitle,
  theme = 'dark',
  onSelectTheme,
  user,
  onOpenLogin,
  onOpenRegister,
  onOpenProfileModal,
  onLogout,
  onOpenAddEntry,
  onOpenImport,
  onTriggerDriveSync,
  isPrivacyMode = false,
  onTogglePrivacyMode
}) {
  const isDark = theme !== 'light';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleToggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    if (onSelectTheme) onSelectTheme(nextTheme);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 🔴 Top Live Streaming Indices Ticker Bar */}
      <div
        className="no-scrollbar"
        style={{
          width: '100%',
          background: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(241, 245, 249, 0.9)',
          borderBottom: '1px solid var(--border-color)',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          fontWeight: '700'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981', flexShrink: 0 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
          <span>NSE/BSE LIVE</span>
        </div>

        {LIVE_TICKERS.map((t, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.name}</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '800' }}>{t.value}</span>
            <span style={{ color: t.isUp ? '#10B981' : '#F87171', fontSize: '10.5px' }}>
              {t.pct}
            </span>
          </div>
        ))}
      </div>

      {/* Main Top Header Bar */}
      <header className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
        <div className="page-title-area" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/favicon.svg" alt="WealthPulse" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
              <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
                WealthPulse
              </span>
            </div>
          ) : (
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              {activeTabTitle}
            </h1>
          )}
        </div>

        <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 👁️ Privacy Mode Masking Toggle Button */}
          {user && (
            <button
              type="button"
              className={`btn btn-sm ${isPrivacyMode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={onTogglePrivacyMode}
              title={isPrivacyMode ? 'Privacy Mode Active (Balances Masked). Click to verify MPIN & unmask.' : 'Hide numbers and balances for privacy'}
              style={{
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                gap: '5px',
                background: isPrivacyMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isPrivacyMode ? '1px solid #10B981' : '1px solid var(--border-color)',
                color: isPrivacyMode ? '#34D399' : 'var(--text-muted)'
              }}
            >
              {isPrivacyMode ? <EyeOff size={15} /> : <Eye size={15} />}
              <span className="btn-text-desktop">{isPrivacyMode ? 'Private (Masked)' : 'Privacy Mode'}</span>
            </button>
          )}

          {/* 🌓 Simple 2-State Theme Toggle (Dark / Light) */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleToggleTheme}
            style={{
              padding: '7px 10px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--text-main)'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun size={15} style={{ color: '#FBBF24' }} />
                <span className="btn-text-desktop">Light</span>
              </>
            ) : (
              <>
                <Moon size={15} style={{ color: '#818CF8' }} />
                <span className="btn-text-desktop">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <>
              {/* Desktop Only Actions */}
              <button className="btn btn-ghost btn-sm desktop-only-action" onClick={onTriggerDriveSync} title="Sync Google Drive Inbox">
                <FolderSync size={16} /> <span>Drive sync</span>
              </button>

              <button className="btn btn-secondary btn-sm desktop-only-action" onClick={onOpenImport} title="Import Statement or File">
                <Upload size={16} /> <span>Import</span>
              </button>

              {/* Quick Add Entry */}
              <button className="btn btn-primary btn-sm" onClick={onOpenAddEntry} title="Add Entry" style={{ padding: '6px 12px' }}>
                <Plus size={16} /> <span className="btn-text-desktop">Add entry</span>
              </button>

              {/* Prominent User Profile Avatar Button */}
              <button
                type="button"
                className="btn btn-ghost user-profile-header-btn"
                style={{
                  padding: '2px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none'
                }}
                onClick={onOpenProfileModal}
                title="My Account & Security"
                aria-label="User Account"
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                    color: '#000000',
                    fontWeight: '800',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px var(--primary-glow)',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)'
                  }}
                >
                  {getInitials(user.name || user.email)}
                </div>
              </button>

              {/* Desktop Only Sign Out */}
              <button
                className="btn btn-ghost btn-sm desktop-only-action"
                onClick={onLogout}
                title="Sign Out"
                style={{ color: '#EF4444', padding: '6px 8px' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="header-auth-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-sign-in"
                onClick={onOpenLogin}
                style={{ padding: '6px 10px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', color: 'var(--text-main)' }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-register"
                onClick={onOpenRegister}
                style={{ padding: '6px 14px', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', borderRadius: '12px' }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
