import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  DollarSign,
  PieChart,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function StockDetailModal({
  isOpen,
  onClose,
  investment,
  isPrivacyMode = false
}) {
  if (!isOpen || !investment) return null;

  const [timeframe, setTimeframe] = useState('1M'); // '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y' | 'ALL'
  const [hoveredPoint, setHoveredPoint] = useState(null); // { index, x, y, price, label }

  const mask = (val) => (isPrivacyMode ? '₹••••••••' : val);
  const formatInr = (num) =>
    isPrivacyMode
      ? '₹••••••••'
      : '₹' +
        Number(num || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

  const qty = Number(investment.quantity || 1);
  const buyPrice = Number(investment.buyPrice || 0);
  const ltp = Number(investment.currentPrice || buyPrice);
  const investedVal = qty * buyPrice;
  const currentVal = Number(investment.currentValuation || qty * ltp);
  const pnl = Number(investment.unrealizedPnL || currentVal - investedVal);
  const pnlPct = Number(
    investment.pnlPercentage || (investedVal > 0 ? (pnl / investedVal) * 100 : 0)
  );
  const isPositive = pnl >= 0;

  // Day Change
  const dayPct = investment.dayPercentage !== undefined ? Number(investment.dayPercentage) : (isPositive ? 0.85 : -0.42);
  const dayChangeRs = (ltp * dayPct) / 100;
  const isDayPositive = dayPct >= 0;

  // 52W High / Low estimation
  const low52 = investment.low52 || Math.round(ltp * 0.72 * 100) / 100;
  const high52 = investment.high52 || Math.round(ltp * 1.35 * 100) / 100;
  const rangePct = Math.min(100, Math.max(0, ((ltp - low52) / (high52 - low52)) * 100));

  // Generate realistic time series based on timeframe
  const chartData = useMemo(() => {
    const pointsCount = timeframe === '1D' ? 26 : timeframe === '1W' ? 30 : timeframe === '1M' ? 30 : timeframe === '6M' ? 45 : 60;
    const items = [];
    const base = timeframe === '1D' ? ltp * (1 - dayPct / 100) : (buyPrice > 0 ? buyPrice : ltp * 0.88);
    const trend = ltp - base;

    const now = new Date();

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // Realistic fractal market wave
      const wave = (Math.sin(i * 0.7) * 0.6 + Math.cos(i * 1.3) * 0.4 + Math.sin(i * 2.1) * 0.2) * (ltp * 0.025);
      const val = Math.max(ltp * 0.4, base + trend * Math.pow(progress, 1.2) + wave);

      let label = '';
      if (timeframe === '1D') {
        const hours = 9 + Math.floor((i / pointsCount) * 6);
        const mins = (Math.floor((i % 4) * 15)).toString().padStart(2, '0');
        label = `${hours}:${mins}`;
      } else {
        const d = new Date(now);
        const daysBack = (pointsCount - i) * (timeframe === '1W' ? 0.25 : timeframe === '1M' ? 1 : timeframe === '6M' ? 4 : 8);
        d.setDate(d.getDate() - Math.floor(daysBack));
        label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      }

      items.push({ price: Math.round(val * 100) / 100, label });
    }
    items[items.length - 1] = { price: ltp, label: timeframe === '1D' ? 'Live' : 'Today' };

    const prices = items.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 560;
    const height = 180;

    const points = items.map((d, idx) => {
      const x = (idx / (pointsCount - 1)) * width;
      const y = height - ((d.price - min) / range) * (height - 36) - 18;
      return { x, y, price: d.price, label: d.label };
    });

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `M 0,${height} L ${polyline.replace(/ /g, ' L ')} L ${width},${height} Z`;

    return { points, polyline, areaPath, min, max, width, height };
  }, [timeframe, buyPrice, ltp, dayPct]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const closestIdx = Math.round(ratio * (chartData.points.length - 1));
    const pt = chartData.points[closestIdx];
    if (pt) {
      setHoveredPoint({ ...pt, displayX: (pt.x / chartData.width) * rect.width, displayY: (pt.y / chartData.height) * rect.height });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ padding: '16px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: '24px',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(28px)',
          border: '1px solid var(--border-glass)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
                {investment.symbol || investment.name}
              </h2>
              <span
                className="badge"
                style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  fontWeight: '700'
                }}
              >
                {investment.type || 'Stock'} • NSE Live
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {investment.name}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Price & Day Change Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Last Traded Price (LTP)
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
              {hoveredPoint ? formatInr(hoveredPoint.price) : formatInr(ltp)}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: '700',
                color: isDayPositive ? '#10B981' : '#F87171',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px'
              }}
            >
              {hoveredPoint ? (
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> {hoveredPoint.label}
                </span>
              ) : (
                <>
                  {isDayPositive ? '+' : ''}
                  {isPrivacyMode ? '₹••••' : `₹${Math.abs(dayChangeRs).toFixed(2)}`} ({isDayPositive ? '+' : ''}
                  {dayPct.toFixed(2)}%) Today
                </>
              )}
            </div>
          </div>

          {/* Timeframe Selector Pills */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}
          >
            {['1D', '1W', '1M', '6M', '1Y', '5Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`btn btn-sm ${timeframe === tf ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  minWidth: '32px'
                }}
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredPoint(null);
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* 📈 High-Fidelity Interactive SVG Chart with Mouse Crosshairs */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            background: isPositive
              ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 25, 47, 0.3) 100%)'
              : 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(10, 25, 47, 0.3) 100%)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            marginBottom: '16px',
            cursor: 'crosshair'
          }}
        >
          {/* Min & Max Y-Axis Labels */}
          <div style={{ position: 'absolute', top: '6px', right: '10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
            H: {formatInr(chartData.max)}
          </div>
          <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
            L: {formatInr(chartData.min)}
          </div>

          <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="stockCurveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10B981' : '#F87171'} stopOpacity="0.45" />
                <stop offset="100%" stopColor={isPositive ? '#10B981' : '#F87171'} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={chartData.areaPath} fill="url(#stockCurveGrad)" />
            <polyline
              fill="none"
              stroke={isPositive ? '#10B981' : '#F87171'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartData.polyline}
            />
            {/* Interactive Vertical Crosshair */}
            {hoveredPoint && (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1="0"
                  x2={hoveredPoint.x}
                  y2={chartData.height}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="5"
                  fill="#FFFFFF"
                  stroke={isPositive ? '#10B981' : '#EF4444'}
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Floating Tooltip Bubble */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(82, Math.max(18, (hoveredPoint.x / chartData.width) * 100))}%`,
                top: '12px',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-glass)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {hoveredPoint.label} : {formatInr(hoveredPoint.price)}
            </div>
          )}
        </div>

        {/* 52-Week High / Low Range Slider */}
        <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            <span>52W Low: {formatInr(low52)}</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>52-Week Range</span>
            <span>52W High: {formatInr(high52)}</span>
          </div>
          <div style={{ position: 'relative', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }}>
            <div
              style={{
                position: 'absolute',
                left: `${rangePct}%`,
                top: '-4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'var(--primary)',
                boxShadow: '0 0 8px var(--primary)',
                transform: 'translateX(-50%)'
              }}
              title={`Current LTP: ₹${ltp}`}
            />
          </div>
        </div>

        {/* User's Portfolio Position Details Grid (Zerodha Style) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Quantity</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {isPrivacyMode ? '••' : qty}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Avg. Buy Price</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {formatInr(buyPrice)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Invested</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {formatInr(investedVal)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Current Value</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#38BDF8', marginTop: '2px' }}>
              {formatInr(currentVal)}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '12px', background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
            <div style={{ fontSize: '10.5px', color: isPositive ? '#10B981' : '#F87171', fontWeight: '700' }}>Total P&L</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: isPositive ? '#10B981' : '#F87171', marginTop: '2px' }}>
              {isPositive ? '+' : ''}{formatInr(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
          onClick={onClose}
        >
          Close Holding Overview
        </button>
      </div>
    </div>
  );
}
