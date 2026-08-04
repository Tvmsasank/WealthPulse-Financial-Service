import React, { useState } from 'react';
import { Wallet, Settings, FolderSync, AlertTriangle, RefreshCw, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function SettingsTab({
  settings = {},
  categories = [],
  accounts = [],
  tags = [],
  onSaveNetWorth,
  onSaveCategories,
  onSaveAccounts,
  onRestoreIgnoredSuggestions,
  onOpenConfirmWipe
}) {
  const { netWorthConfigured = false } = settings;
  const [assetsInput, setAssetsInput] = useState(
    netWorthConfigured && settings.assets !== undefined ? settings.assets : ''
  );
  const [liabilitiesInput, setLiabilitiesInput] = useState(
    netWorthConfigured && settings.liabilities !== undefined ? settings.liabilities : ''
  );
  const [netWorthMessage, setNetWorthMessage] = useState('');

  const [newCatInput, setNewCatInput] = useState('');
  const [newAccInput, setNewAccInput] = useState('');
  const [catAccMessage, setCatAccMessage] = useState('');

  const driveFolder = settings.driveFolder || {
    name: 'Ledgerly Financial Inbox',
    url: 'https://drive.google.com/drive/folders/ledgerly-inbox'
  };
  const driveSync = settings.driveSync || {
    schedule: '08:00 AM Daily',
    timezone: 'Asia/Kolkata',
    lastSyncedAt: null,
    lastStatus: 'idle'
  };
  const dismissedCount = (settings.dismissedPatterns || []).length;

  const hasEnteredValues = assetsInput !== '' || liabilitiesInput !== '';
  const calculatedPreview = (parseFloat(assetsInput) || 0) - (parseFloat(liabilitiesInput) || 0);

  const handleNetWorthSubmit = async (e) => {
    e.preventDefault();
    if (assetsInput === '' && liabilitiesInput === '') {
      setNetWorthMessage('Please enter assets or liabilities values.');
      return;
    }
    const assets = parseFloat(assetsInput) || 0;
    const liabilities = parseFloat(liabilitiesInput) || 0;

    await onSaveNetWorth({
      assets,
      liabilities,
      netWorthConfigured: true
    });

    setNetWorthMessage('Net worth totals saved successfully!');
    setTimeout(() => setNetWorthMessage(''), 3000);
  };

  const handleAddCategory = () => {
    const cat = newCatInput.trim();
    if (!cat) return;
    if (categories.some(c => c.toLowerCase() === cat.toLowerCase())) {
      setCatAccMessage('Category already exists.');
      return;
    }
    onSaveCategories([...categories, cat]);
    setNewCatInput('');
    setCatAccMessage('');
  };

  const handleRemoveCategory = (cat) => {
    if (categories.length <= 1) {
      setCatAccMessage('Must keep at least one category.');
      return;
    }
    onSaveCategories(categories.filter(c => c !== cat));
    setCatAccMessage('');
  };

  const handleAddAccount = () => {
    const acc = newAccInput.trim();
    if (!acc) return;
    if (accounts.some(a => a.toLowerCase() === acc.toLowerCase())) {
      setCatAccMessage('Account already exists.');
      return;
    }
    onSaveAccounts([...accounts, acc]);
    setNewAccInput('');
    setCatAccMessage('');
  };

  const handleRemoveAccount = (acc) => {
    if (accounts.length <= 1) {
      setCatAccMessage('Must keep at least one account.');
      return;
    }
    onSaveAccounts(accounts.filter(a => a !== acc));
    setCatAccMessage('');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Settings & System Configuration</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure net worth totals, accounts, categories, and sync behavior</p>
      </div>

      {/* 1. Net Worth Setup */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <Wallet size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Net Worth Setup</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Net Worth is calculated as total assets minus total liabilities (not monthly cash flow).
            </p>
          </div>
        </div>

        {netWorthMessage && (
          <div style={{ padding: '10px 14px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {netWorthMessage}
          </div>
        )}

        <form onSubmit={handleNetWorthSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Total Assets (₹)</label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 500000"
                className="form-control"
                value={assetsInput}
                onChange={e => setAssetsInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Liabilities (₹)</label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 100000"
                className="form-control"
                value={liabilitiesInput}
                onChange={e => setLiabilitiesInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Calculated Net Worth Preview</label>
              <div style={{ padding: '10px 14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '18px', fontWeight: '700', color: hasEnteredValues ? (calculatedPreview >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--warning)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                {hasEnteredValues
                  ? `₹${calculatedPreview.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : 'Not set'}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Net Worth Configuration
          </button>
        </form>
      </div>

      {/* 2. Managed Categories & Accounts */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Managed Lookups (Categories & Accounts)</h3>

        {catAccMessage && (
          <div style={{ padding: '10px 14px', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {catAccMessage}
          </div>
        )}

        <div className="grid-2">
          {/* Categories */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Categories</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Add category..."
                className="form-control"
                style={{ minHeight: '36px', fontSize: '13px' }}
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCategory}><Plus size={14} /> Add</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {categories.map(cat => (
                <span key={cat} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}>
                  {cat}
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleRemoveCategory(cat)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Accounts</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Add account..."
                className="form-control"
                style={{ minHeight: '36px', fontSize: '13px' }}
                value={newAccInput}
                onChange={e => setNewAccInput(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAccount}><Plus size={14} /> Add</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {accounts.map(acc => (
                <span key={acc} className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}>
                  {acc}
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleRemoveAccount(acc)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Automatic Detection Settings */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Automatic Detection Settings</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Ledgerly detects recurring payments using normalized merchant names and cadence windows (weekly to annual). Dismissed suggestions are remembered across devices.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Ignored Pattern Suggestions</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currently ignoring {dismissedCount} dismissed merchant patterns</div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRestoreIgnoredSuggestions}
            disabled={dismissedCount === 0}
          >
            <RefreshCw size={14} /> Restore Ignored Suggestions
          </button>
        </div>
      </div>

      {/* 4. Google Drive Sync Settings */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <FolderSync size={20} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Google Drive Sync & Automation</h3>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>Folder Name: <strong>{driveFolder.name}</strong></div>
          <div>Schedule: <strong>{driveSync.schedule} ({driveSync.timezone})</strong></div>
          <div>Last Synced: <strong>{driveSync.lastSyncedAt ? new Date(driveSync.lastSyncedAt).toLocaleString() : 'Never'}</strong></div>
          <div>Sync Status: <strong style={{ color: 'var(--success)' }}>{driveSync.lastStatus}</strong></div>
        </div>
      </div>

      {/* 5. Danger Zone */}
      <div className="card" style={{ borderColor: 'var(--danger-light)', background: 'rgba(239, 68, 68, 0.05)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Permanently delete all site database records (transactions, rules, budgets, goals) and R2 file copies.
        </p>
        <button className="btn btn-danger" onClick={onOpenConfirmWipe}>
          Erase All Ledgerly Data...
        </button>
      </div>
    </div>
  );
}
