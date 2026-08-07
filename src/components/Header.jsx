import React from 'react';
import { FolderSync, Upload, Plus, Sun, Moon, LogIn, UserPlus, LogOut, Palette } from 'lucide-react';

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
  onTriggerDriveSync
}) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="top-bar">
      <div className="page-title-area">
        <h1>{activeTabTitle}</h1>
      </div>

      <div className="top-actions">
        {/* Apple Liquid Glass Theme Selector */}
        <div
          title="Liquid Glass Theme Selector"
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

          {/* Cyber Emerald */}
          <button
            type="button"
            onClick={() => onSelectTheme('emerald')}
            title="Cyber Emerald & Obsidian Glass"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#10B981',
              border: (theme === 'emerald' || theme === 'dark') ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: (theme === 'emerald' || theme === 'dark') ? '0 0 12px #10B981' : 'none',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Aurora Cyan */}
          <button
            type="button"
            onClick={() => onSelectTheme('cyan')}
            title="Aurora Cyan & Sapphire Glass"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#00F2FE',
              border: theme === 'cyan' ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: theme === 'cyan' ? '0 0 12px #00F2FE' : 'none',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Golden Champagne */}
          <button
            type="button"
            onClick={() => onSelectTheme('gold')}
            title="Golden Champagne & Onyx Velvet"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#F59E0B',
              border: theme === 'gold' ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: theme === 'gold' ? '0 0 12px #F59E0B' : 'none',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Light Glass */}
          <button
            type="button"
            onClick={() => onSelectTheme('light')}
            title="Apple Crystal Light Mode"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: theme === 'light' ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: theme === 'light' ? '0 0 12px #FFFFFF' : 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {user ? (
          <>
            <button className="btn btn-ghost btn-sm header-action-btn" onClick={onTriggerDriveSync} title="Sync Google Drive Inbox">
              <FolderSync size={16} /> <span className="btn-text-desktop">Drive sync</span>
            </button>

            <button className="btn btn-secondary btn-sm header-action-btn" onClick={onOpenImport} title="Import Statement or File">
              <Upload size={16} /> <span className="btn-text-desktop">Import</span>
            </button>

            <button className="btn btn-primary btn-sm header-action-btn" onClick={onOpenAddEntry} title="Add Entry">
              <Plus size={16} /> <span className="btn-text-desktop">Add entry</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '4px', borderRadius: '50%' }}
              onClick={onOpenProfileModal}
              title="Account Settings"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-glass)'
                }}
              >
                {getInitials(user.name || user.email)}
              </div>
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={onLogout}
              title="Sign Out"
              style={{ color: '#EF4444', padding: '6px 8px' }}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onOpenLogin}>
              <LogIn size={15} /> Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenRegister}>
              <UserPlus size={15} /> Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
