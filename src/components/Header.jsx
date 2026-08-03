import React from 'react';
import { FolderSync, Upload, Plus, Sun, Moon, LogIn, UserPlus, LogOut, User } from 'lucide-react';

export default function Header({
  activeTabTitle,
  theme,
  onToggleTheme,
  user,
  onOpenLogin,
  onOpenRegister,
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

      <div className="top-actions" style={{ gap: '10px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} style={{ color: '#FDE047' }} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onTriggerDriveSync} title="Sync Google Drive Inbox">
              <FolderSync size={16} /> Drive sync
            </button>

            <button className="btn btn-secondary btn-sm" onClick={onOpenImport} title="Import Statement or File">
              <Upload size={16} /> Import
            </button>

            <button className="btn btn-primary btn-sm" onClick={onOpenAddEntry} title="Add Entry">
              <Plus size={16} /> Add entry
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />

            {/* User Profile Avatar & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}
                title={user.email}
              >
                {getInitials(user.name)}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', display: 'none', minWidth: '100px' }} className="user-name-label">
                {user.name}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onLogout}
                title="Sign Out"
                style={{ color: 'var(--danger)', padding: '6px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={onOpenLogin}>
              <LogIn size={15} /> Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenRegister}>
              <UserPlus size={15} /> Create Account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
