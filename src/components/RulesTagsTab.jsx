import React, { useState } from 'react';
import { Sliders, Tag, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function RulesTagsTab({
  rules = [],
  tags = [],
  transactions = [],
  categories = [],
  onOpenAddRule,
  onToggleRule,
  onDeleteRule,
  onAddTag,
  onDeleteTag
}) {
  const [newTagName, setNewTagName] = useState('');

  // Calculate usage counts per tag
  const tagUsageMap = {};
  for (const t of tags) {
    tagUsageMap[t.name] = 0;
  }
  for (const tx of transactions) {
    const txTags = Array.isArray(tx.tags) ? tx.tags : JSON.parse(tx.tags || '[]');
    for (const tag of txTags) {
      tagUsageMap[tag] = (tagUsageMap[tag] || 0) + 1;
    }
  }

  const handleCreateTagSubmit = (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim());
    setNewTagName('');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Categorization Rules & Tags</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Automate merchant categorization and organize custom tags</p>
      </div>

      {/* Rules Section */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Categorization Rules</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied automatically during statement import after duplicate detection</p>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenAddRule}>
            <Plus size={14} /> Create Rule
          </button>
        </div>

        {rules.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>When Merchant Contains</th>
                  <th>Then Set Category & Tag</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={rule.enabled === 1}
                          onChange={e => onToggleRule(rule.id, e.target.checked)}
                        />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: rule.enabled === 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {rule.enabled === 1 ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </td>
                    <td style={{ fontWeight: '600' }}>"{rule.whenText}"</td>
                    <td>
                      <span className="badge badge-info">{rule.thenText || rule.thenCategory}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDeleteRule(rule.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No categorization rules created yet.</p>
          </div>
        )}
      </div>

      {/* Tags Management Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'var(--info-light)', color: 'var(--info)', borderRadius: 'var(--radius-md)' }}>
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tag Management</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Create custom tags without requiring a category</p>
            </div>
          </div>

          <form onSubmit={handleCreateTagSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="New tag name..."
              className="form-control"
              style={{ minHeight: '36px', fontSize: '13px' }}
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Plus size={14} /> Add Tag
            </button>
          </form>
        </div>

        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {tags.map(t => (
              <div
                key={t.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px'
                }}
              >
                <span style={{ fontWeight: '600' }}>{t.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'white', padding: '1px 6px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  {tagUsageMap[t.name] || 0} uses
                </span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onClick={() => onDeleteTag(t.name)}
                  title="Delete tag"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No tags created yet. Create a tag above or in the Add Entry modal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
