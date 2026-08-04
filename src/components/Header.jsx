import React from 'react';
import { FolderSync, Upload, Plus, Sun, Moon } from 'lucide-react';

export default function Header({
  activeTabTitle,
  theme,
  onToggleTheme,
  onOpenAddEntry,
  onOpenImport,
  onTriggerDriveSync
}) {
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
        >
          {theme === 'dark' ? <Sun size={18} style={{ color: '#FDE047' }} /> : <Moon size={18} />}
        </button>

        <button className="btn btn-ghost btn-sm" onClick={onTriggerDriveSync} title="Sync Google Drive Inbox">
          <FolderSync size={16} /> Drive sync
        </button>

        <button className="btn btn-secondary btn-sm" onClick={onOpenImport} title="Import Statement or File">
          <Upload size={16} /> Import
        </button>

        <button className="btn btn-primary btn-sm" onClick={onOpenAddEntry} title="Add Entry">
          <Plus size={16} /> Add entry
        </button>
      </div>
    </header>
  );
}
