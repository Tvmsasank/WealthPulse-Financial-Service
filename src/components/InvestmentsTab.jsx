import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Plus, Trash2, Edit3, ShieldAlert, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, Coins, Wallet } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function InvestmentsTab({
  investments = [],
  onOpenAddInvestment,
  onOpenEditInvestment,
  onDeleteInvestment,
  onRefreshPrices,
  isSyncing = false
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Compute portfolio statistics (Safe array check)
  const safeInvestments = Array.isArray(investments) ? investments : [];
  const totalValuation = safeInvestments.reduce((sum, i) => sum + (Number(i.currentValuation) || 0), 0);
  const totalCost = safeInvestments.reduce((sum, i) => sum + ((Number(i.buyPrice) || 0) * (Number(i.quantity) || 1)), 0);
  const totalPnL = totalValuation - totalCost;
  const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Breakdown by Asset Type for Pie Chart
  const typeMap = {};
  for (const i of safeInvestments) {
    const t = i.type || 'other';
    const label = t === 'stock' ? 'Equity Stocks' : t === 'mutual_fund' ? 'Mutual Funds' : t === 'gold' ? 'Gold' : t === 'fd' ? 'Fixed Deposits' : 'Other Assets';
    typeMap[label] = (typeMap[label] || 0) + (Number(i.currentValuation) || 0);
  }

  const pieData = Object.keys(typeMap).map(k => ({ name: k, value: Math.round(typeMap[k]) }));
  const COLORS = ['#7C6EE6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteInvestment(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp style={{ color: 'var(--primary)' }} /> Real-Time Investment & Asset Portfolio
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Live market price tracking for Mutual Funds & Stocks (AMFI & Yahoo Finance APIs)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={onRefreshPrices}
            disabled={isSyncing}
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Syncing Market Prices...' : 'Sync Live Market Prices'}
          </button>

          <button className="btn btn-primary" onClick={onOpenAddInvestment} style={{ fontSize: '13px' }}>
            <Plus size={16} /> Add Asset / Holding
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {/* Total Investment Value */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Portfolio Market Valuation
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>
            ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live updated from market prices
          </div>
        </div>

        {/* Invested Cost */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Total Invested Capital
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Initial buy cost across assets
          </div>
        </div>

        {/* Total P&L */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Unrealized Gain / Loss (P&L)
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {totalPnL >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
            {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}% Overall Returns
          </div>
        </div>

        {/* Total Assets Count */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Managed Asset Holdings
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            {investments.length} Assets
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across Stocks, MFs & Gold
          </div>
        </div>
      </div>

      {/* Asset Distribution Chart + Summary */}
      {pieData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} style={{ color: 'var(--primary)' }} /> Portfolio Asset Allocation
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                <Legend fontSize={12} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Holdings List View */}
      {investments.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-table-view">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Name & Symbol</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Buy Price (₹)</th>
                  <th>Live Market Price / NAV (₹)</th>
                  <th style={{ textAlign: 'right' }}>Current Valuation</th>
                  <th style={{ textAlign: 'right' }}>P&L (Returns)</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(item => {
                  const buyPrice = Number(item.buyPrice || 0);
                  const currentPrice = Number(item.currentPrice || buyPrice);
                  const valuation = Number(item.currentValuation || (currentPrice * (item.quantity || 1)));
                  const pnl = Number(item.unrealizedPnL || (valuation - (buyPrice * (item.quantity || 1))));
                  const pnlPct = Number(item.pnlPercentage || (buyPrice > 0 ? (pnl / (buyPrice * item.quantity)) * 100 : 0));

                  return (
                    <tr key={item.id}>
                      {/* Name & Symbol */}
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</div>
                        {item.symbol && <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>{item.symbol}</div>}
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className="badge badge-secondary" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                          {item.type === 'mutual_fund' ? 'Mutual Fund' : item.type}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td style={{ fontWeight: '600' }}>
                        {item.quantity} {item.type === 'mutual_fund' ? 'units' : 'shares'}
                      </td>

                      {/* Buy Price */}
                      <td style={{ color: 'var(--text-muted)' }}>
                        ₹{buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Current Live Price */}
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Valuation */}
                      <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '15px', color: 'var(--primary)' }}>
                        ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* P&L */}
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        <span className={`badge ${pnl >= 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px', padding: '4px 8px' }}>
                          {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px', color: 'var(--primary)' }}
                            title="Edit Holding"
                            onClick={() => onOpenEditInvestment(item)}
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px', color: 'var(--danger)' }}
                            title="Delete Asset"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-cards-view">
            {investments.map(item => {
              const buyPrice = Number(item.buyPrice || 0);
              const currentPrice = Number(item.currentPrice || buyPrice);
              const valuation = Number(item.currentValuation || (currentPrice * (item.quantity || 1)));
              const pnl = Number(item.unrealizedPnL || (valuation - (buyPrice * (item.quantity || 1))));
              const pnlPct = Number(item.pnlPercentage || (buyPrice > 0 ? (pnl / (buyPrice * item.quantity)) * 100 : 0));

              return (
                <div key={item.id} className="card" style={{ padding: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{item.name}</div>
                      {item.symbol && <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>{item.symbol}</div>}
                    </div>

                    <span className={`badge ${pnl >= 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px' }}>
                      {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', background: 'var(--bg-app)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    <div>Buy Price: <strong>₹{buyPrice.toLocaleString('en-IN')}</strong></div>
                    <div>Live Price: <strong style={{ color: 'var(--primary)' }}>₹{currentPrice.toLocaleString('en-IN')}</strong></div>
                    <div>Quantity: <strong>{item.quantity}</strong></div>
                    <div>Valuation: <strong style={{ color: 'var(--success)' }}>₹{valuation.toLocaleString('en-IN')}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px' }} onClick={() => onOpenEditInvestment(item)}>
                      <Edit3 size={16} /> Edit
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '4px' }} onClick={() => setDeleteTarget(item)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card empty-state" style={{ padding: '48px 20px' }}>
          <div className="empty-state-icon"><TrendingUp size={32} /></div>
          <div className="empty-state-title">No Investments Added</div>
          <div className="empty-state-text">Track your Mutual Funds, Stocks, Gold, and FDs continuously with live price updates.</div>
          <button className="btn btn-primary btn-sm" onClick={onOpenAddInvestment}>
            <Plus size={14} /> Add Your First Investment
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <ShieldAlert size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Delete Investment Asset?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from your investment portfolio?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
