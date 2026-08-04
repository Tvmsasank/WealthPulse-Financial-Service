import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, AlertCircle, Calendar, Plus, Upload } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardTab({
  transactions = [],
  settings = {},
  selectedPeriod,
  onPeriodChange,
  onOpenAddEntry,
  onOpenImport,
  onNavigateTab
}) {
  const { assets = 0, liabilities = 0, netWorthConfigured = false, recurring = [], subscriptions = [] } = settings;

  // Filter transactions by selectedPeriod
  const filteredTransactions = filterByPeriod(transactions, selectedPeriod);

  // Income, Spending, Savings Rate
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSpending = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savingsRate = totalIncome > 0 ? (((totalIncome - totalSpending) / totalIncome) * 100).toFixed(1) : '0';

  const netWorthValue = (assets || 0) - (liabilities || 0);

  // Cash flow chart data (up to 7 monthly points)
  const cashFlowData = getCashFlowChartData(filteredTransactions);

  // Spending by Category Pie chart data
  const categoryData = getSpendingByCategoryData(filteredTransactions);
  const COLORS = ['#7C6EE6', '#10B981', '#F97316', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#64748B'];

  // Needs review count
  const needsReviewCount = transactions.filter(t => t.category === 'Needs review').length;

  // Recent activity (5 newest)
  const recentTx = [...filteredTransactions].slice(0, 5);

  // Coming up recurring/subscriptions
  const comingUp = [...recurring, ...subscriptions].slice(0, 3);

  return (
    <div>
      {/* Date Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Financial Overview</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track real cash flow, budgets, and net worth</p>
        </div>

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
      </div>

      {/* 4 Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {/* Net Worth Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Net Worth</span>
            <div style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
              <Wallet size={18} />
            </div>
          </div>
          {netWorthConfigured ? (
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              ₹{netWorthValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          ) : (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>Not set</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'block', padding: '2px 0', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }}
                onClick={() => onNavigateTab('settings')}
              >
                Configure in Settings →
              </button>
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
            User configured assets & liabilities
          </div>
        </div>

        {/* Income Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Income</span>
            <div style={{ padding: '8px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
            Sum of income in period
          </div>
        </div>

        {/* Spending Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Spending</span>
            <div style={{ padding: '8px', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: 'var(--radius-md)' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            ₹{totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
            Sum of expenses in period
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Savings Rate</span>
            <div style={{ padding: '8px', background: 'var(--info-light)', color: 'var(--info)', borderRadius: 'var(--radius-md)' }}>
              <PiggyBank size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
            {savingsRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
            ((Income - Spending) / Income) * 100
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Cash Flow Line Chart */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Cash Flow Trend</h3>
          {cashFlowData.length > 0 ? (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowData}>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip formatter={(val) => `₹${Number(val).toFixed(2)}`} />
                  <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Expenses" stroke="#F97316" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <div className="empty-state-icon"><Calendar size={24} /></div>
              <div className="empty-state-title">No Cash Flow Data</div>
              <div className="empty-state-text">Import or add transactions to see cash flow.</div>
              <button className="btn btn-primary btn-sm" onClick={onOpenImport}>Import CSV</button>
            </div>
          )}
        </div>

        {/* Spending by Category Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Spending by Category</h3>
          {categoryData.length > 0 ? (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                  <Legend fontSize={12} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <div className="empty-state-icon"><PiggyBank size={24} /></div>
              <div className="empty-state-title">No Category Data</div>
              <div className="empty-state-text">Categorized expense transactions will appear here.</div>
              <button className="btn btn-secondary btn-sm" onClick={onOpenAddEntry}>Add Transaction</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Activity & Ledgerly Insight */}
      <div className="grid-2">
        {/* Recent Activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('transactions')}>
              View all ({filteredTransactions.length}) →
            </button>
          </div>

          {recentTx.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Merchant</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{tx.merchant}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.date}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{tx.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)' }}>
                        {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <div className="empty-state-text">No recent transactions in selected period.</div>
            </div>
          )}
        </div>

        {/* Ledgerly Insights & Coming Up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Ledgerly Insight Panel */}
          <div className="card card-navy">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
              Ledgerly Insight
            </h3>
            {needsReviewCount > 0 ? (
              <div style={{ fontSize: '14px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} style={{ color: '#F97316' }} />
                <span>You have <strong>{needsReviewCount}</strong> transactions flagged as <em>Needs review</em>. Review them in Transactions.</span>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#CBD5E1' }}>
                All saved transactions have assigned categories. Excellent organization!
              </div>
            )}
          </div>

          {/* Coming Up */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Coming Up</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('recurring')}>
                Manage →
              </button>
            </div>
            {comingUp.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {comingUp.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.merchant || item.serviceName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due: {item.nextDate || item.nextRenewalDate || 'Soon'}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>₹{Number(item.amount || item.averageAmount || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No upcoming confirmed recurring bills. Add or confirm items in <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', color: 'var(--primary)' }} onClick={() => onNavigateTab('recurring')}>Recurring</button>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
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

function getCashFlowChartData(txs = []) {
  if (txs.length === 0) return [];
  const map = {};
  for (const t of txs) {
    const month = (t.date || '').substring(0, 7);
    if (!month) continue;
    if (!map[month]) map[month] = { month, Income: 0, Expenses: 0 };
    if (t.type === 'income') map[month].Income += Math.abs(t.amount);
    else map[month].Expenses += Math.abs(t.amount);
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-7);
}

function getSpendingByCategoryData(txs = []) {
  const expenses = txs.filter(t => t.type === 'expense');
  if (expenses.length === 0) return [];
  const map = {};
  for (const t of expenses) {
    const cat = t.category || 'Other';
    map[cat] = (map[cat] || 0) + Math.abs(t.amount);
  }
  return Object.keys(map).map(cat => ({ name: cat, value: parseFloat(map[cat].toFixed(2)) }));
}
