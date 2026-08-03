import React, { useState } from 'react';
import { Search, Filter, Plus, FileText, Trash2, Tag, ChevronDown } from 'lucide-react';
import ConfirmDeleteTxModal from './ConfirmDeleteTxModal';

export default function TransactionsTab({
  transactions = [],
  categories = [],
  accounts = [],
  allTags = [],
  selectedPeriod,
  onPeriodChange,
  onUpdateCategory,
  onUpdateTags,
  onDeleteTransaction,
  onOpenAddEntry,
  onOpenTagModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteTargetTx, setDeleteTargetTx] = useState(null);

  // Filter transactions by period, search, account, and category
  const filtered = filterTransactions(transactions, selectedPeriod, searchQuery, selectedAccount, selectedCategory);

  const handleRemoveTag = (tx, tagToRemove) => {
    const currentTags = parseTags(tx.tags);
    const newTags = currentTags.filter(t => t !== tagToRemove);
    onUpdateTags(tx.id, newTags);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetTx) {
      onDeleteTransaction(deleteTargetTx.id);
      setDeleteTargetTx(null);
    }
  };

  return (
    <div>
      {/* Top Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Transactions</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Search, filter, and manage financial records</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="period-selector">
            {[
              { id: 'all-time', label: 'All time' },
              { id: 'this-month', label: 'This month' },
              { id: 'last-month', label: 'Last month' },
              { id: 'last-3-months', label: 'Last 3 months' },
              { id: 'last-6-months', label: 'Last 6 months' },
              { id: 'this-year', label: 'This year' }
            ].map(p => (
              <button
                key={p.id}
                className={`period-btn ${selectedPeriod === p.id ? 'active' : ''}`}
                onClick={() => onPeriodChange(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={onOpenAddEntry}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search merchant, category, or tag..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Account Filter */}
          <select className="form-control" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Category Filter */}
          <select className="form-control" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Merchant</th>
                <th>Category (Inline edit)</th>
                <th>Account</th>
                <th>Tags</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const txTags = parseTags(tx.tags);
                return (
                  <tr key={tx.id}>
                    {/* Merchant & Date */}
                    <td>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {tx.merchant}
                        {tx.receipt === 1 && (
                          <span title="Receipt Attached" style={{ color: 'var(--primary)', display: 'inline-flex' }}>
                            <FileText size={14} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.date} • <span style={{ textTransform: 'capitalize' }}>{tx.source}</span></div>
                    </td>

                    {/* Inline Category Editor Dropdown */}
                    <td>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          className="form-control"
                          style={{
                            padding: '4px 24px 4px 10px',
                            minHeight: '32px',
                            fontSize: '13px',
                            fontWeight: '500',
                            borderRadius: 'var(--radius-sm)',
                            background: tx.category === 'Needs review' ? 'var(--warning-light)' : 'var(--bg-app)',
                            borderColor: tx.category === 'Needs review' ? 'var(--warning)' : 'var(--border-color)',
                            color: tx.category === 'Needs review' ? 'var(--warning)' : 'var(--text-main)'
                          }}
                          value={tx.category}
                          onChange={e => onUpdateCategory(tx.id, e.target.value)}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </td>

                    {/* Account */}
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {tx.account}
                    </td>

                    {/* Inline Tag Pills + Add Tag Button */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                        {txTags.map(tag => (
                          <span
                            key={tag}
                            className="pill"
                            style={{ cursor: 'pointer', padding: '2px 8px', fontSize: '11px' }}
                            title="Click to remove tag"
                            onClick={() => handleRemoveTag(tx, tag)}
                          >
                            {tag} ×
                          </span>
                        ))}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', minHeight: '26px', fontSize: '12px' }}
                          title="Add tag"
                          onClick={() => onOpenTagModal(tx)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)' }}>
                      {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)', padding: '4px' }}
                        title="Delete transaction"
                        onClick={() => setDeleteTargetTx(tx)}
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
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Filter size={28} />
          </div>
          <div className="empty-state-title">No transactions found</div>
          <div className="empty-state-text">
            {transactions.length === 0
              ? 'Your ledger is empty. Add a manual transaction or import a statement.'
              : 'No transactions match your current search or filter criteria.'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn btn-primary" onClick={onOpenAddEntry}>
              Add Transaction
            </button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteTxModal
        isOpen={!!deleteTargetTx}
        onClose={() => setDeleteTargetTx(null)}
        transaction={deleteTargetTx}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

// Helpers
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

function filterTransactions(txs, period, query, account, category) {
  let result = filterByPeriod(txs, period);

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(t => {
      const matchMerchant = (t.merchant || '').toLowerCase().includes(q);
      const matchCategory = (t.category || '').toLowerCase().includes(q);
      const tagsArray = parseTags(t.tags);
      const matchTag = tagsArray.some(tag => tag.toLowerCase().includes(q));
      return matchMerchant || matchCategory || matchTag;
    });
  }

  if (account) {
    result = result.filter(t => t.account === account);
  }

  if (category) {
    result = result.filter(t => t.category === category);
  }

  return result;
}

function filterByPeriod(txs = [], period) {
  if (period === 'all-time' || !period) return txs;
  const now = new Date();
  
  return txs.filter(t => {
    const txDate = new Date(t.date);
    if (isNaN(txDate.getTime())) return false;

    if (period === 'this-month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (period === 'last-month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
    }
    if (period === 'last-3-months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return txDate >= threeMonthsAgo;
    }
    if (period === 'last-6-months') {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return txDate >= sixMonthsAgo;
    }
    if (period === 'this-year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });
}
