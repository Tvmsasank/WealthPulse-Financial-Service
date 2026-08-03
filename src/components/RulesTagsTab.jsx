import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Tag, CheckSquare } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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
  const [newTagInput, setNewTagInput] = useState('');
  const [deleteRuleTarget, setDeleteRuleTarget] = useState(null);
  const [deleteTagTarget, setDeleteTagTarget] = useState(null);

  const handleAddTagSubmit = (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddTag(newTagInput.trim());
    setNewTagInput('');
  };

  // Calculate usage counts per tag
  const tagUsageMap = {};
  for (const t of transactions) {
    const tagsArr = parseTags(t.tags);
    for (const tag of tagsArr) {
      tagUsageMap[tag] = (tagUsageMap[tag] || 0) + 1;
    }
  }

  const allTagNames = Array.from(new Set([...tags.map(t => t.name || t), ...Object.keys(tagUsageMap)]));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Rules & Tag Management</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Automate transaction categorization and manage custom tags</p>
      </div>

      {/* 1. Categorization Rules Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Automated Categorization Rules ({rules.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={onOpenAddRule}>
            <Plus size={14} /> Add Rule
          </button>
        </div>

        {rules.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Active</th>
                  <th>Condition (When...)</th>
                  <th>Target Category</th>
                  <th>Attached Tag</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={rule.enabled === 1 || rule.enabled === true}
                        onChange={e => onToggleRule(rule.id, e.target.checked)}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      If merchant contains <strong>"{rule.merchantPattern}"</strong>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{rule.category}</span>
                    </td>
                    <td>
                      {rule.tag ? <span className="pill">{rule.tag}</span> : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteRuleTarget(rule)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <Sliders size={28} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>No Categorization Rules Created</div>
            <div style={{ fontSize: '12px', marginBottom: '14px' }}>Create rules to automatically categorize imported CSV bank statements or receipts.</div>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddRule}>
              Add First Rule
            </button>
          </div>
        )}
      </div>

      {/* 2. Tag Management Section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Managed Transaction Tags ({allTagNames.length})</h3>

        <div className="card" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleAddTagSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Add new tag name (e.g. Vacation, Office, Tax Deductible)..."
              className="form-control"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Tag
            </button>
          </form>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tag Name</th>
                <th>Usage Count</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allTagNames.map(tagName => {
                const count = tagUsageMap[tagName] || 0;
                return (
                  <tr key={tagName}>
                    <td>
                      <span className="pill" style={{ fontWeight: '600', fontSize: '13px' }}>{tagName}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Used in <strong>{count}</strong> transaction(s)
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteTagTarget(tagName)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Rule Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteRuleTarget}
        onClose={() => setDeleteRuleTarget(null)}
        title="Delete Categorization Rule"
        message={`Are you sure you want to delete the rule for pattern "${deleteRuleTarget?.merchantPattern}"?`}
        itemDetails={deleteRuleTarget ? { pattern: deleteRuleTarget.merchantPattern, category: deleteRuleTarget.category } : null}
        onConfirm={() => {
          if (deleteRuleTarget) onDeleteRule(deleteRuleTarget.id);
        }}
      />

      {/* Delete Tag Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTagTarget}
        onClose={() => setDeleteTagTarget(null)}
        title="Delete Tag"
        message={`Are you sure you want to remove tag "${deleteTagTarget}"?`}
        itemDetails={deleteTagTarget ? { tag: deleteTagTarget, usage: `${tagUsageMap[deleteTagTarget] || 0} transaction(s)` } : null}
        onConfirm={() => {
          if (deleteTagTarget) onDeleteTag(deleteTagTarget);
        }}
      />
    </div>
  );
}

function parseTags(tagsVal) {
  if (Array.isArray(tagsVal)) return tagsVal;
  if (!tagsVal) return [];
  if (typeof tagsVal === 'string') {
    try {
      const parsed = JSON.parse(tagsVal);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (tagsVal.trim() && tagsVal !== '[]') return [tagsVal];
    }
  }
  return [];
}
