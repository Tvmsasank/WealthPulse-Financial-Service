import React, { useState } from 'react';
import { PieChart, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Target } from 'lucide-react';

export default function BudgetsTab({
  transactions = [],
  categories = [],
  settings = {},
  selectedPeriod,
  onOpenAddBudget,
  onEditBudget,
  onDeleteBudget
}) {
  const { budgets = [] } = settings;

  // Calculate actual spent per category in current period
  const expenses = filterByPeriod(transactions, selectedPeriod).filter(t => t.type === 'expense');
  const spentMap = {};
  for (const tx of expenses) {
    const cat = tx.category || 'Other';
    spentMap[cat] = (spentMap[cat] || 0) + Math.abs(tx.amount);
  }

  // Budget Health Calculation
  let totalLimit = 0;
  let totalSpent = 0;
  let overBudgetCount = 0;

  const budgetItems = budgets.map(b => {
    const spent = spentMap[b.category] || 0;
    const limit = Number(b.limit) || 0;
    const remaining = limit - spent;
    const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 999) : 0;
    const isOver = spent > limit;

    totalLimit += limit;
    totalSpent += spent;
    if (isOver) overBudgetCount++;

    return {
      ...b,
      spent,
      limit,
      remaining,
      percent,
      isOver
    };
  });

  const overallHealthPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Monthly Category Budgets</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Set spending targets and track real category utilization</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddBudget}>
          <Plus size={16} /> Create Budget
        </button>
      </div>

      {/* Budget Health Summary Card */}
      {budgets.length > 0 && (
        <div className="card" style={{ marginBottom: '28px', background: 'var(--bg-navy-card)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Overall Budget Utilization</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: overallHealthPercent > 100 ? '#EF4444' : '#10B981' }}>
                ₹{totalSpent.toFixed(2)} / ₹{totalLimit.toFixed(2)} ({overallHealthPercent}%)
              </div>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '6px' }}>
                {overBudgetCount > 0
                  ? `⚠️ ${overBudgetCount} category is over budget limit`
                  : '✓ All active budgets within target threshold'}
              </div>
            </div>

            <div style={{ width: '140px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: overallHealthPercent > 100 ? '#EF4444' : '#10B981' }}>
                {totalLimit - totalSpent >= 0 ? `₹${(totalLimit - totalSpent).toFixed(0)}` : `-₹${Math.abs(totalLimit - totalSpent).toFixed(0)}`}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Net Remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards List */}
      {budgetItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {budgetItems.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{item.category}</h3>
                  <span className={`badge ${item.isOver ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: '4px' }}>
                    {item.isOver ? 'Over Budget' : 'On Track'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onEditBudget(item)} title="Edit limit">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDeleteBudget(item.id)} title="Delete budget">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  <span>₹{item.spent.toFixed(2)} spent</span>
                  <span>₹{item.limit.toFixed(2)} limit</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--bg-app)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(item.percent, 100)}%`,
                      background: item.isOver ? 'var(--danger)' : item.percent > 85 ? 'var(--warning)' : 'var(--primary)',
                      borderRadius: '5px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{item.percent}% used</span>
                <span style={{ fontWeight: '600', color: item.remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {item.remaining >= 0 ? `₹${item.remaining.toFixed(2)} remaining` : `₹${Math.abs(item.remaining).toFixed(2)} over`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <div className="empty-state-title">No Budgets Configured</div>
          <div className="empty-state-text">
            Start managing monthly expenses by creating category budgets.
          </div>
          <button className="btn btn-primary" onClick={onOpenAddBudget}>
            Create First Budget
          </button>
        </div>
      )}
    </div>
  );
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
