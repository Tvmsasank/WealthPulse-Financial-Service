import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Edit3 } from 'lucide-react';

export default function AddEntryModal({
  isOpen,
  onClose,
  onSave,
  editTransaction = null,
  categories = [],
  accounts = [],
  tags = []
}) {
  if (!isOpen) return null;

  const isEditing = !!editTransaction;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[0] || 'Needs review');
  const [account, setAccount] = useState(accounts[0] || 'Main Checking');
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || 'expense');
      setAmount(editTransaction.amount ? String(editTransaction.amount) : '');
      setMerchant(editTransaction.merchant || '');
      setDate(editTransaction.date || new Date().toISOString().split('T')[0]);
      setCategory(editTransaction.category || categories[0] || 'Needs review');
      setAccount(editTransaction.account || accounts[0] || 'Main Checking');
      setSelectedTags(parseTags(editTransaction.tags));
      setHasReceipt(editTransaction.receipt === 1);
    } else {
      setType('expense');
      setAmount('');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(categories[0] || 'Needs review');
      setAccount(accounts[0] || 'Main Checking');
      setSelectedTags([]);
      setHasReceipt(false);
    }
    setError('');
  }, [editTransaction, isOpen]);

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setNewTagInput('');
  };

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanAmountStr = String(amount || '').replace(/,/g, '.').trim();
    const parsedAmount = Math.abs(parseFloat(cleanAmountStr));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!merchant.trim()) {
      setError('Please enter a merchant or source name.');
      return;
    }

    // Auto-include any pending typed tag in input field
    let finalTags = [...selectedTags];
    if (newTagInput.trim() && !finalTags.includes(newTagInput.trim())) {
      finalTags.push(newTagInput.trim());
    }

    setSaving(true);
    try {
      await onSave({
        ...(isEditing ? { id: editTransaction.id } : {}),
        type,
        amount: parsedAmount,
        merchant: merchant.trim(),
        date,
        category,
        account,
        tags: finalTags,
        receipt: hasReceipt ? 1 : 0,
        receiptFile: hasReceipt ? receiptFile : null,
        source: isEditing ? (editTransaction.source || 'manual') : 'manual'
      });
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      setError(err.message || 'Failed to save entry');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Edit3 size={20} style={{ color: 'var(--primary)' }} /> : <Plus size={20} style={{ color: 'var(--primary)' }} />}
            <h2>{isEditing ? 'Edit Financial Entry' : 'Add Financial Entry'}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Expense / Income Toggle */}
          <div className="form-group">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ background: type === 'expense' ? 'var(--warning)' : 'transparent', color: type === 'expense' ? 'white' : 'var(--text-muted)' }}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`btn ${type === 'income' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ background: type === 'income' ? 'var(--success)' : 'transparent', color: type === 'income' ? 'white' : 'var(--text-muted)' }}
                onClick={() => setType('income')}
              >
                Income
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="form-control"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Merchant / Source</label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Employer Paycheck, D-Mart"
              className="form-control"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account</label>
              <select className="form-control" value={account} onChange={e => setAccount(e.target.value)}>
                {accounts.length > 0 ? (
                  accounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))
                ) : (
                  <option value="Main Checking">Main Checking</option>
                )}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Select or Type Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(t => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className={`pill ${isSelected ? 'selected' : ''}`}
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

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add custom tag..."
                className="form-control"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddTag}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Optional Receipt Checkbox */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={hasReceipt}
                onChange={e => setHasReceipt(e.target.checked)}
              />
              <span>Attach Receipt or Invoice Document</span>
            </label>

            {hasReceipt && (
              <div style={{ marginTop: '12px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)' }}>
                <input
                  type="file"
                  accept="image/*,.pdf,.csv"
                  onChange={e => setReceiptFile(e.target.files[0] || null)}
                  style={{ display: 'block', width: '100%', fontSize: '13px' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supported files up to 20MB.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function parseTags(tagsVal) {
  if (!tagsVal) return [];
  if (Array.isArray(tagsVal)) return tagsVal;
  try {
    const parsed = JSON.parse(tagsVal);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
