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
  ShieldCheck
} from 'lucide-react';

export default function StockDetailModal({
  isOpen,
  onClose,
  investment,
  isPrivacyMode = false
}) {
  if (!isOpen || !investment) return null;

  const [timeframe, setTimeframe] = useState('1M'); // '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y' | 'ALL'

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

  // Day Change simulation
  const dayPct = investment.dayPercentage !== undefined ? Number(investment.dayPercentage) : (isPositive ? 0.85 : -0.42);
  const dayChangeRs = (ltp * dayPct) / 100;
  const isDayPositive = dayPct >= 0;

  // 52W High / Low estimation
  const low52 = investment.low52 || Math.round(ltp * 0.72 * 100) / 100;
  const high52 = investment.high52 || Math.round(ltp * 1.35 * 100) / 100;
  const rangePct = Math.min(100, Math.max(0, ((ltp - low52) / (high52 - low52)) * 100));

  // Generate realistic SVG chart curve points based on timeframe
  const chartPoints = useMemo(() => {
    const pointsCount = timeframe === '1D' ? 24 : (timeframe === '1W' ? 30 : 45);
    const data = [];
    const base = buyPrice > 0 ? buyPrice : ltp * 0.9;
    const end = ltp;
    const trend = end - base;

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // add natural market wave variation
      const noise = (Math.sin(i * 0.8) + Math.cos(i * 1.4)) * (ltp * 0.02);
      const val = base + trend * progress + noise;
      data.push(val);
    }
    data[data.length - 1] = end;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const width = 500;
    const height = 160;

    const svgCoords = data.map((val, idx) => {
      const x = (idx / (pointsCount - 1)) * width;
      const y = height - ((val - min) / range) * (height - 30) - 15;
      return `${x},${y}`;
    });

    return {
      polyline: svgCoords.join(' '),
      areaPath: `M 0,${height} L ${svgCoords.join(' L ')} L ${width},${height} Z`,
      min,
      max
    };
  }, [timeframe, buyPrice, ltp]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ padding: '16px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '640px',
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
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
                {investment.symbol || investment.name}
              </h2>
              <span
                className="badge"
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  borderRadius: '6px'
                }}
              >
                {investment.type || 'Stock'} • NSE
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
              {formatInr(ltp)}
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
              {isDayPositive ? '+' : ''}
              {isPrivacyMode ? '₹••••' : `₹${Math.abs(dayChangeRs).toFixed(2)}`} ({isDayPositive ? '+' : ''}
              {dayPct.toFixed(2)}%) Today
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
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Performance Curve */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '160px',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 25, 47, 0.4) 100%)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <svg viewBox="0 0 500 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10B981' : '#F87171'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={isPositive ? '#10B981' : '#F87171'} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={chartPoints.areaPath} fill="url(#curveGradient)" />
            <polyline
              fill="none"
              stroke={isPositive ? '#10B981' : '#F87171'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartPoints.polyline}
            />
          </svg>
        </div>

        {/* 52-Week High / Low Range Slider */}
        <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
