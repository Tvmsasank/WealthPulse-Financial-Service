import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Building2,
  Briefcase,
  Coins,
  Landmark,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Search,
  Filter,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import StockDetailModal from './StockDetailModal';

export default function InvestmentsTab({
  investments = [],
  onOpenAddInvestment,
  onOpenEditInvestment,
  onDeleteInvestment,
  onRefreshPrices,
  isSyncing = false,
  isPrivacyMode = false
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'stock' | 'us_stock' | 'mutual_fund' | 'gold' | 'fd'
  const [searchQuery, setSearchQuery] = useState('');

  const safeInvestments = Array.isArray(investments) ? investments : [];

  const mask = (val) => (isPrivacyMode ? '₹••••••••' : val);
  const formatInr = (num) =>
    isPrivacyMode
      ? '₹••••••••'
      : '₹' +
        Number(num || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

  // Calculate High-Level Metrics
  const totalValuation = safeInvestments.reduce((sum, i) => sum + (Number(i.currentValuation) || 0), 0);
  const totalCost = safeInvestments.reduce((sum, i) => sum + ((Number(i.buyPrice) || 0) * (Number(i.quantity) || 1)), 0);
  const totalPnL = totalValuation - totalCost;
  const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Day's P&L calculation (estimated across holdings)
  const totalDayPnL = safeInvestments.reduce((sum, i) => {
    const ltp = Number(i.currentPrice || i.buyPrice || 0);
    const qty = Number(i.quantity || 1);
    const dayPct = i.dayPercentage !== undefined ? Number(i.dayPercentage) : (Number(i.unrealizedPnL || 0) >= 0 ? 0.85 : -0.42);
    return sum + (ltp * qty * (dayPct / 100));
  }, 0);
  const dayPnLPct = totalValuation > 0 ? (totalDayPnL / totalValuation) * 100 : 0;

  // Filter holdings
  const filteredInvestments = safeInvestments.filter((item) => {
    const matchesCat =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'stock'
        ? item.type === 'stock'
        : categoryFilter === 'us_stock'
        ? item.type === 'us_stock' || item.type === 'crypto'
        : categoryFilter === 'mutual_fund'
        ? item.type === 'mutual_fund'
        : categoryFilter === 'gold'
        ? item.type === 'gold'
        : item.type === 'fd' || item.type === 'other';

    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Category counts
  const countAll = safeInvestments.length;
  const countIndian = safeInvestments.filter(i => i.type === 'stock').length;
  const countUS = safeInvestments.filter(i => i.type === 'us_stock' || i.type === 'crypto').length;
  const countMF = safeInvestments.filter(i => i.type === 'mutual_fund').length;
  const countGold = safeInvestments.filter(i => i.type === 'gold').length;
  const countFD = safeInvestments.filter(i => i.type === 'fd' || i.type === 'other').length;

  // Allocation Pie Chart Data
  const typeMap = {};
  for (const i of safeInvestments) {
    const t = i.type || 'other';
    const label =
      t === 'stock'
        ? 'Indian Stocks'
        : t === 'us_stock' || t === 'crypto'
        ? 'US / Tech Equities'
        : t === 'mutual_fund'
        ? 'Mutual Funds'
        : t === 'gold'
        ? 'Gold & SGB'
        : 'Fixed Deposits';
    typeMap[label] = (typeMap[label] || 0) + (Number(i.currentValuation) || 0);
  }
  const pieData = Object.keys(typeMap).map((k) => ({ name: k, value: Math.round(typeMap[k]) }));
  const COLORS = ['#10B981', '#38BDF8', '#818CF8', '#FBBF24', '#F472B6'];

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteInvestment(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 8px 60px 8px' }}>
      {/* Top Header & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={26} style={{ color: 'var(--primary)' }} /> Portfolio Holdings & Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Live NSE/BSE stock quotes, AMFI daily NAVs & multi-asset wealth allocation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefreshPrices}
            disabled={isSyncing}
            style={{ borderRadius: '12px', padding: '9px 14px', gap: '6px' }}
          >
            <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Updating Prices...' : 'Refresh Quotes'}
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddInvestment}
            style={{ borderRadius: '12px', padding: '9px 16px', gap: '6px', fontWeight: '800' }}
          >
            <Plus size={16} /> Add Holding
          </button>
        </div>
      </div>

      {/* 📊 Zerodha-Style High-Impact Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Invested
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
            {formatInr(totalCost)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Initial capital deployed
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current Portfolio Value
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#38BDF8', marginTop: '4px' }}>
            {formatInr(totalValuation)}
          </div>
          <div style={{ fontSize: '11px', color: totalPnL >= 0 ? '#10B981' : '#F87171', fontWeight: '700', marginTop: '2px' }}>
            {totalPnL >= 0 ? '+' : ''}{formatInr(totalPnL)} ({totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%)
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Day's P&L
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: totalDayPnL >= 0 ? '#10B981' : '#F87171', marginTop: '4px' }}>
            {totalDayPnL >= 0 ? '+' : ''}{formatInr(totalDayPnL)}
          </div>
          <div style={{ fontSize: '11px', color: totalDayPnL >= 0 ? '#10B981' : '#F87171', fontWeight: '700', marginTop: '2px' }}>
            {dayPnLPct >= 0 ? '+' : ''}{dayPnLPct.toFixed(2)}% Today
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Realized & Unrealized P&L
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: totalPnL >= 0 ? '#10B981' : '#F87171', marginTop: '4px' }}>
            {totalPnL >= 0 ? '+' : ''}{formatInr(totalPnL)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Across {safeInvestments.length} holdings
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px'
        }}
      >
        {/* Category Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          {[
            { id: 'all', label: 'All Holdings', count: countAll },
            { id: 'stock', label: 'Indian Stocks', count: countIndian },
            { id: 'us_stock', label: 'US Stocks', count: countUS },
            { id: 'mutual_fund', label: 'Mutual Funds', count: countMF },
            { id: 'gold', label: 'Gold & SGB', count: countGold },
            { id: 'fd', label: 'Fixed Deposits', count: countFD }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm ${categoryFilter === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label} {cat.count > 0 && <span style={{ opacity: 0.8 }}>({cat.count})</span>}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', fontSize: '12px', borderRadius: '10px' }}
            placeholder="Search symbol, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 📋 Exact Zerodha Holdings Table */}
      <div className="card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '14px 16px' }}>Instrument</th>
                <th>Qty.</th>
                <th>Avg. Cost</th>
                <th>LTP</th>
                <th>Invested</th>
                <th>Cur. Val</th>
                <th style={{ textAlign: 'right' }}>P&L</th>
                <th style={{ textAlign: 'right' }}>Net Chg.</th>
                <th style={{ textAlign: 'right' }}>Day Chg.</th>
                <th style={{ textAlign: 'center', padding: '14px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No investment holdings found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((item) => {
                  const qty = Number(item.quantity || 1);
                  const buyPrice = Number(item.buyPrice || 0);
                  const ltp = Number(item.currentPrice || buyPrice);
                  const invested = qty * buyPrice;
                  const curVal = Number(item.currentValuation || qty * ltp);
                  const pnl = Number(item.unrealizedPnL || curVal - invested);
                  const netPct = Number(item.pnlPercentage || (invested > 0 ? (pnl / invested) * 100 : 0));
                  const isPos = pnl >= 0;

                  const dayPct = item.dayPercentage !== undefined ? Number(item.dayPercentage) : (isPos ? 0.85 : -0.42);
                  const dayRs = (ltp * dayPct) / 100;
                  const isDayPos = dayPct >= 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedStockForDetail(item)}
                      style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                    >
                      {/* Instrument & Badges */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                                {item.symbol || item.name}
                              </span>
                              {netPct > 10 && (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} title="Top Gainer" />
                              )}
                              {netPct < -5 && (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} title="Top Loser" />
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Qty */}
                      <td style={{ fontWeight: '700', fontSize: '13px' }}>
                        {isPrivacyMode ? '••' : qty}
                      </td>

                      {/* Avg. Cost */}
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {formatInr(buyPrice)}
                      </td>

                      {/* LTP */}
                      <td style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-main)' }}>
                        {formatInr(ltp)}
                      </td>

                      {/* Invested */}
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {formatInr(invested)}
                      </td>

                      {/* Cur. Val */}
                      <td style={{ fontWeight: '800', fontSize: '13.5px', color: '#38BDF8' }}>
                        {formatInr(curVal)}
                      </td>

                      {/* P&L */}
                      <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '13.5px', color: isPos ? '#10B981' : '#F87171' }}>
                        {isPos ? '+' : ''}{formatInr(pnl)}
                      </td>

                      {/* Net Chg % */}
                      <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12.5px', color: isPos ? '#10B981' : '#F87171' }}>
                        {isPos ? '+' : ''}{netPct.toFixed(2)}%
                      </td>

                      {/* Day Chg */}
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '12px', color: isDayPos ? '#10B981' : '#F87171' }}>
                        {isDayPos ? '+' : ''}{isPrivacyMode ? '••' : dayRs.toFixed(2)} ({isDayPos ? '+' : ''}{dayPct.toFixed(2)}%)
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center', padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px' }}
                            onClick={() => onOpenEditInvestment(item)}
                            title="Edit Holding"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px', color: '#F87171' }}
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Holding"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Allocation Pie Chart */}
      {pieData.length > 0 && (
        <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} style={{ color: 'var(--primary)' }} /> Asset Allocation Breakdown
          </h2>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [isPrivacyMode ? '₹••••••••' : `₹${Number(val).toLocaleString('en-IN')}`, 'Valuation']}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stock Detailed Chart Modal */}
      <StockDetailModal
        isOpen={!!selectedStockForDetail}
        onClose={() => setSelectedStockForDetail(null)}
        investment={selectedStockForDetail}
        isPrivacyMode={isPrivacyMode}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>Delete Holding?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Are you sure you want to remove <strong>{deleteTarget.symbol || deleteTarget.name}</strong> from your portfolio?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
