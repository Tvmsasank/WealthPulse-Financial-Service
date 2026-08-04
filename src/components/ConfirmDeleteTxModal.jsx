import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmDeleteTxModal({ isOpen, onClose, transaction, onConfirm }) {
  if (!isOpen || !transaction) return null;

  const amtStr = `${transaction.type === 'income' ? '+' : '-'}₹${Math.abs(transaction.amount).toFixed(2)}`;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
            <AlertTriangle size={22} />
            <h2 style={{ fontSize: '18px', color: 'var(--danger)' }}>Confirm Transaction Deletion</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Are you sure you want to permanently delete this financial record?
        </p>

        <div style={{ padding: '16px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Merchant / Source</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{transaction.merchant}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date & Account</span>
            <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{transaction.date} • {transaction.account}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Amount</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
              {amtStr}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <Trash2 size={16} /> Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
