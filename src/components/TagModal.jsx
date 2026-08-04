import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function TagModal({ isOpen, onClose, transaction, allTags = [], onSave }) {
  if (!isOpen || !transaction) return null;

  const currentTxTags = Array.isArray(transaction.tags)
    ? transaction.tags
    : JSON.parse(transaction.tags || '[]');

  const [selectedTags, setSelectedTags] = useState([...currentTxTags]);
  const [newTagInput, setNewTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateNewTag = () => {
    const name = newTagInput.trim();
    if (!name) return;
    if (!selectedTags.includes(name)) {
      setSelectedTags([...selectedTags, name]);
    }
    setNewTagInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(transaction.id, selectedTags, newTagInput.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2>Manage Tags</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Select or add tags for <strong>{transaction.merchant}</strong>:
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {allTags.map(t => {
            const isSelected = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className="pill"
                style={{
                  background: isSelected ? 'var(--primary)' : 'var(--bg-app)',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
                onClick={() => handleToggleTag(t)}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="form-group">
          <label className="form-label">Create new tag (name only)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. Tax-deductible"
              className="form-control"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateNewTag(); } }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateNewTag}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      </div>
    </div>
  );
}
