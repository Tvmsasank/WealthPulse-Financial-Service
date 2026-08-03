import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to permanently delete this item?',
  itemDetails = null,
  onConfirm
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
            <AlertTriangle size={22} />
            <h2 style={{ fontSize: '18px', color: 'var(--danger)' }}>{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
          {message}
        </p>

        {itemDetails && (
          <div style={{ padding: '14px 16px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
            {typeof itemDetails === 'string' ? (
              <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{itemDetails}</div>
            ) : (
              Object.entries(itemDetails).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{val}</span>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
