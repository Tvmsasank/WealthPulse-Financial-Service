import React, { useState } from 'react';
import { PieChart, Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Calculate category spending based on expense transactions
  const categorySpendMap = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.category) {
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + Math.abs(t.amount);
    }
  }

  // Combined totals
  const totalLimit = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (categorySpendMap[b.category] || 0), 0);
  const overallPercent = totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0;
  const overBudgetCount = budgets.filter(b => (categorySpendMap[b.category] || 0) > (Number(b.limit) || 0)).length;

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

      {/* Overall Utilization Card */}
      <div className="card" style={{ marginBottom: '28px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Overall Budget Utilization</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: overBudgetCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              ₹{totalSpent.toFixed(2)} / ₹{totalLimit.toFixed(2)} ({overallPercent}%)
            </div>
            <div style={{ fontSize: '12px', color: overBudgetCount > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {overBudgetCount > 0 ? (
                <> <AlertCircle size={14} /> {overBudgetCount} category budget(s) exceeded target limit! </>
              ) : (
                <> <CheckCircle size={14} /> All active budgets within target threshold </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: totalLimit - totalSpent >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              ₹{Math.max(totalLimit - totalSpent, 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Remaining</div>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {budgets.map(b => {
            const spent = categorySpendMap[b.category] || 0;
            const limit = Number(b.limit) || 0;
            const remaining = limit - spent;
            const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
            const isOver = spent > limit;
            const isWarning = !isOver && percent >= 85;

            return (
              <div key={b.id || b.category} className="card" style={{ borderLeft: `4px solid ${isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{b.category}</h3>
                    <span className={`badge ${isOver ? 'badge-danger' : isWarning ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: '4px' }}>
                      {isOver ? 'Over Budget' : isWarning ? 'Near Limit' : 'On Track'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditBudget(b)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(b)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
                    ₹{spent.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>spent</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    ₹{limit.toFixed(2)} limit
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{percent}% used</span>
                  <span style={{ fontWeight: '600', color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                    {isOver ? `Over by ₹${Math.abs(remaining).toFixed(2)}` : `₹${remaining.toFixed(2)} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><PieChart size={28} /></div>
          <div className="empty-state-title">No Category Budgets Defined</div>
          <div className="empty-state-text">
            Create monthly spending target limits for categories like Groceries, Dining, or Utilities.
          </div>
          <button className="btn btn-primary" onClick={onOpenAddBudget}>
            Create First Budget
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category Budget"
        message={`Are you sure you want to delete the budget limit for "${deleteTarget?.category}"?`}
        itemDetails={deleteTarget ? { category: deleteTarget.category, limit: `₹${deleteTarget.limit}` } : null}
        onConfirm={() => {
          if (deleteTarget) onDeleteBudget(deleteTarget.id);
        }}
      />
    </div>
  );
}
