import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function GoalModal({ isOpen, onClose, initialGoal, onSave }) {
  if (!isOpen) return null;

  const [name, setName] = useState(initialGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialGoal?.targetAmount || '');
  const [currentAmount, setCurrentAmount] = useState(initialGoal?.currentAmount || 0);
  const [dueDate, setDueDate] = useState(initialGoal?.dueDate || '');
  const [note, setNote] = useState(initialGoal?.note || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    if (!name.trim() || isNaN(target) || target <= 0) return;

    setSaving(true);
    await onSave({
      id: initialGoal?.id || `goal_${Date.now()}`,
      name: name.trim(),
      targetAmount: target,
      currentAmount: current,
      dueDate,
      note: note.trim()
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>{initialGoal ? 'Edit Goal' : 'Create Financial Goal'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Bike"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input
                type="number"
                step="1"
                placeholder="100000"
                className="form-control"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currently Saved (₹)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                className="form-control"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Date (Optional)</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 6 months of living expenses"
              className="form-control"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
