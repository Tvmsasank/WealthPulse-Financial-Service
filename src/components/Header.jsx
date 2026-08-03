import React from 'react';
import { FolderSync, Upload, Plus, Sun, Moon, LogIn, UserPlus, LogOut, User } from 'lucide-react';

export default function Header({
  activeTabTitle,
  theme,
  onToggleTheme,
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

            {/* Clickable Profile Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C6EE6 0%, #4F46E5 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 110, 230, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                className="profile-avatar-btn"
                title={`${user.name} (${user.email}) - Click to view profile`}
                onClick={onOpenProfileModal}
              >
                {getInitials(user.name)}
              </button>

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
