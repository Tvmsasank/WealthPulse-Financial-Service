import React, { useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Briefcase,
  Building2,
  Coins,
  Landmark,
  Layers,
  Activity,
  AlertCircle,
  Zap
} from 'lucide-react';
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

  // Group holdings by Category
  const stocks = safeInvestments.filter(i => i.type === 'stock');
  const mutualFunds = safeInvestments.filter(i => i.type === 'mutual_fund');
  const cryptoHoldings = safeInvestments.filter(i => i.type === 'crypto' || i.type === 'cryptocurrency');
  const goldHoldings = safeInvestments.filter(i => i.type === 'gold');
  const fdHoldings = safeInvestments.filter(i => i.type === 'fd' || i.type === 'other');

  // Pie chart breakdown
  const typeMap = {};
  for (const i of safeInvestments) {
    const t = i.type || 'other';
    const label = t === 'stock' ? 'Equity Stocks' : t === 'mutual_fund' ? 'Mutual Funds' : (t === 'crypto' || t === 'cryptocurrency') ? 'Cryptocurrency' : t === 'gold' ? 'Gold & Metals' : t === 'fd' ? 'Fixed Deposits' : 'Other Assets';
    typeMap[label] = (typeMap[label] || 0) + (Number(i.currentValuation) || 0);
  }

  const pieData = Object.keys(typeMap).map(k => ({ name: k, value: Math.round(typeMap[k]) }));
  const COLORS = ['#10B981', '#7C6EE6', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteInvestment(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Helper for Section Category Summary
  const getCategoryStats = (items) => {
    const valuation = items.reduce((s, i) => s + (Number(i.currentValuation) || 0), 0);
    const cost = items.reduce((s, i) => s + ((Number(i.buyPrice) || 0) * (Number(i.quantity) || 1)), 0);
    const pnl = valuation - cost;
    const pct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { valuation, cost, pnl, pct };
  };

  // Helper to render section table
  const renderHoldingTable = (items, categoryTitle) => {
    if (items.length === 0) return null;
    const stats = getCategoryStats(items);

    return (
      <div className="card" style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--border-color)' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {categoryTitle.includes('Stock') ? (
              <Building2 style={{ color: '#10B981' }} size={22} />
            ) : categoryTitle.includes('Mutual') ? (
              <Briefcase style={{ color: '#7C6EE6' }} size={22} />
            ) : categoryTitle.includes('Crypto') ? (
              <Zap style={{ color: '#F59E0B' }} size={22} />
            ) : categoryTitle.includes('Gold') ? (
              <Coins style={{ color: '#F59E0B' }} size={22} />
            ) : (
              <Landmark style={{ color: '#3B82F6' }} size={22} />
            )}
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                {categoryTitle}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {items.length} {items.length === 1 ? 'asset holding' : 'asset holdings'}
              </div>
            </div>
          </div>

          {/* Section Summary P&L Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category Valuation</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                ₹{stats.valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: stats.pnl >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: stats.pnl >= 0 ? '#34D399' : '#FCA5A5',
                border: `1px solid ${stats.pnl >= 0 ? '#10B981' : '#EF4444'}`
              }}
            >
              {stats.pnl >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {stats.pnl >= 0 ? '+' : ''}₹{Math.abs(stats.pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({stats.pct >= 0 ? '+' : ''}{stats.pct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="table-container desktop-table-view">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Name & Symbol</th>
                <th>Quantity</th>
                <th>Avg Buy Price (₹)</th>
                <th>Live Market Price / NAV (₹)</th>
                <th style={{ textAlign: 'right' }}>Current Valuation</th>
                <th style={{ textAlign: 'right' }}>P&L (Unrealized)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const buyPrice = Number(item.buyPrice || 0);
                const currentPrice = Number(item.currentPrice || buyPrice);
                const valuation = Number(item.currentValuation || (currentPrice * (item.quantity || 1)));
                const pnl = Number(item.unrealizedPnL || (valuation - (buyPrice * (item.quantity || 1))));
                const pnlPct = Number(item.pnlPercentage || (buyPrice > 0 ? (pnl / (buyPrice * item.quantity)) * 100 : 0));

                return (
                  <tr key={item.id}>
                    {/* Name & Symbol Badge */}
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {item.symbol ? (
                          <span
                            className="pill"
                            style={{
                              fontSize: '11px',
                              padding: '1px 7px',
                              background: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--primary)',
                              fontFamily: 'monospace'
                            }}
                          >
                            {item.symbol}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manual Asset</span>
                        )}
                        {item.priceStatus === 'invalid_symbol' && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title="Live ticker not found. Click edit to adjust ticker symbol."
                          >
                            <AlertCircle size={12} /> Check Ticker
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td style={{ fontSize: '13px', fontWeight: '600' }}>
                      {Number(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 4 })}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.type === 'stock' ? 'shares' : item.type === 'mutual_fund' ? 'units' : (item.type === 'crypto' || item.type === 'cryptocurrency') ? 'coins' : 'units'}
                      </span>
                    </td>

                    {/* Buy Price */}
                    <td style={{ fontSize: '13px' }}>
                      ₹{buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    {/* Live Market Price / NAV */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                          ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                        {item.priceStatus === 'ok' && (
                          <span
                            className="pill"
                            style={{
                              fontSize: '9px',
                              padding: '1px 5px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid #10B981'
                            }}
                          >
                            LIVE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Current Valuation */}
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>
                      ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* P&L */}
                    <td style={{ textAlign: 'right' }}>
                      {item.priceStatus === 'invalid_symbol' ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#F59E0B', fontSize: '11px', padding: '2px 6px' }}
                          onClick={() => onOpenEditInvestment(item)}
                        >
                          Set Ticker Code
                        </button>
                      ) : (
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: pnl >= 0 ? '#34D399' : '#FCA5A5'
                          }}
                        >
                          {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <div style={{ fontSize: '11px', fontWeight: '600' }}>
                            ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                          </div>
                        </div>
                      )}
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
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--danger)' }}
                          title="Delete Holding"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 size={15} />
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
          {items.map(item => {
            const buyPrice = Number(item.buyPrice || 0);
            const currentPrice = Number(item.currentPrice || buyPrice);
            const valuation = Number(item.currentValuation || (currentPrice * (item.quantity || 1)));
            const pnl = Number(item.unrealizedPnL || (valuation - (buyPrice * (item.quantity || 1))));
            const pnlPct = Number(item.pnlPercentage || (buyPrice > 0 ? (pnl / (buyPrice * item.quantity)) * 100 : 0));

            return (
              <div key={item.id} className="card" style={{ padding: '14px', marginBottom: '10px', background: 'var(--bg-app)' }}>
                {/* Top Row: Name + Valuation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {item.symbol && (
                        <span className="pill" style={{ fontSize: '11px', padding: '1px 6px' }}>
                          {item.symbol}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {Number(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 4 })} {item.type === 'stock' ? 'shares' : item.type === 'mutual_fund' ? 'units' : (item.type === 'crypto' || item.type === 'cryptocurrency') ? 'coins' : 'units'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      ₹{valuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: pnl >= 0 ? '#34D399' : '#FCA5A5' }}>
                      {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({pnlPct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Buy vs Live Price + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Buy: ₹{buyPrice.toLocaleString('en-IN')} ➔ Live: <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: 'var(--primary)' }}
                      onClick={() => onOpenEditInvestment(item)}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="tab-container animate-fade">
      {/* Header Bar */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={24} style={{ color: 'var(--primary)' }} /> Real-Time Investment Portfolio
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span>Live Ticker Active (3s Fast Market Feed) • AMFI, NSE & Crypto Real-Time APIs</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefreshPrices}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
            {isSyncing ? 'Fetching Live Prices...' : 'Sync Live Prices'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddInvestment}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Asset / Holding
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Total Valuation */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Portfolio Market Valuation
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>
            ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live market valuation
          </div>
        </div>

        {/* Invested Capital */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Total Invested Capital
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Initial buy cost
          </div>
        </div>

        {/* Total P&L with Vivid Colors */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Unrealized Gain / Loss (P&L)
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: totalPnL >= 0 ? '#34D399' : '#FCA5A5', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {totalPnL >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: totalPnL >= 0 ? '#34D399' : '#FCA5A5', marginTop: '2px' }}>
            {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}% Overall Returns
          </div>
        </div>

        {/* Total Assets Count */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Managed Asset Holdings
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            {safeInvestments.length} Assets
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across Stocks, MFs, Crypto & Metals
          </div>
        </div>
      </div>

      {/* Asset Distribution Chart */}
      {pieData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} style={{ color: 'var(--primary)' }} /> Portfolio Asset Allocation
          </h3>
          <div style={{ width: '100%', height: '200px' }}>
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

      {/* Categorized Holdings Tables */}
      {safeInvestments.length > 0 ? (
        <>
          {renderHoldingTable(stocks, 'Equity Stocks (NSE / BSE)')}
          {renderHoldingTable(mutualFunds, 'Mutual Funds (Direct Growth NAVs)')}
          {renderHoldingTable(cryptoHoldings, 'Cryptocurrency (Live Coins & Tokens)')}
          {renderHoldingTable(goldHoldings, 'Gold & Precious Metals')}
          {renderHoldingTable(fdHoldings, 'Fixed Deposits & Other Assets')}
        </>
      ) : (
        <div className="card empty-state" style={{ padding: '48px 20px' }}>
          <div className="empty-state-icon"><TrendingUp size={32} /></div>
          <div className="empty-state-title">No Investments Added</div>
          <div className="empty-state-text">Track your Mutual Funds, Stocks, Crypto, Gold, and FDs continuously with live price updates.</div>
          <button className="btn btn-primary btn-sm" onClick={onOpenAddInvestment}>
            <Plus size={14} /> Add Your First Investment
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
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
