import React from 'react';
import { Target, Plus, Edit2, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export default function GoalsTab({
  settings = {},
  onOpenAddGoal,
  onEditGoal,
  onDeleteGoal
}) {
  const { goals = [] } = settings;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Financial Goals & Savings</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track savings targets, emergency funds, and major milestone purchases</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddGoal}>
          <Plus size={16} /> Create Goal
        </button>
      </div>

      {goals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {goals.map(goal => {
            const target = Number(goal.targetAmount) || 0;
            const current = Number(goal.currentAmount) || 0;
            const remaining = target - current;
            const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
            const isCompleted = current >= target;

            return (
              <div key={goal.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{goal.name}</h3>
                    {goal.dueDate && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={12} /> Target: {goal.dueDate}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditGoal(goal)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDeleteGoal(goal.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '24px', fontWeight: '700', color: isCompleted ? 'var(--success)' : 'var(--primary)', marginBottom: '8px' }}>
                  ₹{current.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '400' }}>of ₹{target.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ width: '100%', height: '10px', background: 'var(--bg-app)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: isCompleted ? 'var(--success)' : 'var(--primary)',
                        borderRadius: '5px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{percent}% Saved</span>
                  <span style={{ fontWeight: '600', color: isCompleted ? 'var(--success)' : 'var(--text-main)' }}>
                    {isCompleted ? '✓ Goal Achieved!' : `₹${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`}
                  </span>
                </div>

                {goal.note && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    "{goal.note}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <div className="empty-state-title">No Financial Goals Defined</div>
          <div className="empty-state-text">
            Start tracking savings progress for an emergency fund, home deposit, or trip.
          </div>
          <button className="btn btn-primary" onClick={onOpenAddGoal}>
            Create First Goal
          </button>
        </div>
      )}
    </div>
  );
}
