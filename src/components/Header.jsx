import React, { useState } from 'react';
import { FolderSync, Upload, Plus, LogIn, UserPlus, LogOut, Palette, ChevronDown, Landmark } from 'lucide-react';

const THEMES = [
  { id: 'emerald', label: 'Emerald Dark', color: '#10B981' },
  { id: 'cyan', label: 'Aurora Cyan', color: '#00F2FE' },
  { id: 'gold', label: 'Champagne Gold', color: '#F59E0B' },
  { id: 'light', label: 'Apple Light', color: '#FFFFFF' }
];

export default function Header({
  activeTabTitle,
  theme,
  onSelectTheme,
  user,
  onOpenLogin,
  onOpenRegister,
  onOpenProfileModal,
  onLogout,
  onOpenAddEntry,
  onOpenImport,
  onTriggerDriveSync,
  onOpenAaModal
}) {
  const [showThemePicker, setShowThemePicker] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const activeColor = THEMES.find(t => t.id === theme)?.color || '#10B981';

  return (
    <header className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        {/* Desktop Theme Selector (4 Dots) */}
        <div
          className="desktop-theme-selector"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '5px 10px',
            borderRadius: '24px',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <Palette size={14} style={{ color: 'var(--primary)', marginRight: '2px' }} />
          {THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTheme(t.id)}
              title={t.label}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: t.color,
                border: (theme === t.id || (t.id === 'emerald' && theme === 'dark')) ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                boxShadow: (theme === t.id || (t.id === 'emerald' && theme === 'dark')) ? `0 0 10px ${t.color}` : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        {/* Mobile Compact Theme Dropdown Button */}
        <div className="mobile-theme-selector" style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowThemePicker(!showThemePicker)}
            style={{
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)'
            }}
            title="Switch Theme"
          >
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: activeColor, border: '1px solid white' }} />
          </button>

          {showThemePicker && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '8px',
                display: 'flex',
                gap: '8px',
                zIndex: 100,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              {THEMES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(t.id);
                    setShowThemePicker(false);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: t.color,
                    border: (theme === t.id || (t.id === 'emerald' && theme === 'dark')) ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {user ? (
          <>
            {/* Desktop Only Actions */}
            <button className="btn btn-ghost btn-sm desktop-only-action" onClick={onTriggerDriveSync} title="Sync Google Drive Inbox">
              <FolderSync size={16} /> <span>Drive sync</span>
            </button>

            <button className="btn btn-secondary btn-sm desktop-only-action" onClick={onOpenImport} title="Import Statement or File">
              <Upload size={16} /> <span>Import</span>
            </button>

            {/* RBI Account Aggregator Live Bank Sync (Disabled for future release) */}
            <button
              className="btn btn-ghost btn-sm"
              disabled
              style={{ color: 'var(--text-muted)', gap: '5px', padding: '6px 10px', borderRadius: '10px', opacity: 0.5, cursor: 'not-allowed' }}
              title="Bank Sync (Coming Soon)"
            >
              <Landmark size={15} /> <span className="btn-text-desktop">Bank Sync</span>
            </button>

            {/* Quick Add Entry (+ Button on Mobile, Full on Desktop) */}
            <button className="btn btn-primary btn-sm" onClick={onOpenAddEntry} title="Add Entry" style={{ padding: '6px 12px' }}>
              <Plus size={16} /> <span className="btn-text-desktop">Add entry</span>
            </button>

            {/* Prominent User Profile Avatar Button (Always Visible & 100% Clickable!) */}
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
  );
}
