import React from 'react';
import { FolderSync, Upload, Plus, Sun, Moon, LogIn, UserPlus, LogOut } from 'lucide-react';

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

      <div className="top-actions">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ padding: '6px 8px' }}
        >
          {theme === 'dark' ? <Sun size={18} style={{ color: '#FDE047' }} /> : <Moon size={18} />}
        </button>

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

            <div className="header-divider" />

            {/* Clickable Profile Avatar Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  flexShrink: 0
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenLogin}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            >
              <LogIn size={14} /> <span>Sign In</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenRegister}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            >
              <UserPlus size={14} /> <span className="btn-text-desktop">Create Account</span><span className="btn-text-mobile">Join</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
