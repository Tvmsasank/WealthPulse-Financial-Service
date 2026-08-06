import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Search, Plus, Check } from 'lucide-react';

const POPULAR_SUGGESTIONS = [
  { name: 'Canara Bank', symbol: 'CANBK.NS', type: 'stock', defaultPrice: 131.70 },
  { name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'stock', defaultPrice: 2950 },
  { name: 'Tata Motors Ltd', symbol: 'TATAMOTORS.NS', type: 'stock', defaultPrice: 1020 },
  { name: 'Infosys Ltd', symbol: 'INFY.NS', type: 'stock', defaultPrice: 1820 },
  { name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', type: 'stock', defaultPrice: 1650 },
  { name: 'TCS - Tata Consultancy Services', symbol: 'TCS.NS', type: 'stock', defaultPrice: 4200 },
  { name: 'Parag Parikh Flexi Cap Direct Fund', symbol: '122639', type: 'mutual_fund', defaultPrice: 92.83 },
  { name: 'Nippon India Multi Asset Direct Fund', symbol: '148457', type: 'mutual_fund', defaultPrice: 27.22 },
  { name: 'Sovereign Gold Bond (SGB)', symbol: 'SGB', type: 'gold', defaultPrice: 7250 },
  { name: 'Bank Fixed Deposit (FD)', symbol: 'FD', type: 'fd', defaultPrice: 100000 }
];

export default function AddInvestmentModal({
  isOpen,
  onClose,
  onSave,
  editInvestment = null
}) {
  if (!isOpen) return null;

  const isEditing = !!editInvestment;

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('stock');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editInvestment) {
      setName(editInvestment.name || '');
      setSymbol(editInvestment.symbol || '');
      setType(editInvestment.type || 'stock');
      setQuantity(editInvestment.quantity ? String(editInvestment.quantity) : '1');
      setBuyPrice(editInvestment.buyPrice ? String(editInvestment.buyPrice) : '');
      setCurrentPrice(editInvestment.currentPrice ? String(editInvestment.currentPrice) : '');
      setNotes(editInvestment.notes || '');
    } else {
      setName('');
      setSymbol('');
      setType('stock');
      setQuantity('1');
      setBuyPrice('');
      setCurrentPrice('');
      setNotes('');
    }
    setError('');
  }, [editInvestment, isOpen]);

  const handleSelectSuggestion = (sug) => {
    setName(sug.name);
    setSymbol(sug.symbol);
    setType(sug.type);
    if (!buyPrice) setBuyPrice(String(sug.defaultPrice));
    if (!currentPrice) setCurrentPrice(String(sug.defaultPrice));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter asset or company name.');
      return;
    }

    const qty = Math.abs(parseFloat(quantity));
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity or units held.');
      return;
    }

    const buy = Math.abs(parseFloat(buyPrice));
    if (isNaN(buy) || buy < 0) {
      setError('Please enter buy price per unit.');
      return;
    }

    const cur = currentPrice ? Math.abs(parseFloat(currentPrice)) : buy;

    setSaving(true);
    try {
      await onSave({
        ...(isEditing ? { id: editInvestment.id } : {}),
        name: name.trim(),
        symbol: symbol.trim(),
        type,
        quantity: qty,
        buyPrice: buy,
        currentPrice: cur,
        notes: notes.trim()
      });
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      setError(err.message || 'Failed to save investment holding');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%', boxSizing: 'border-box' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <h2>{isEditing ? 'Edit Investment Holding' : 'Add Investment Holding'}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Quick Preset Selector */}
          {!isEditing && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick Select Popular Assets</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'thin' }}>
                {POPULAR_SUGGESTIONS.map(s => (
                  <button
                    key={s.symbol}
                    type="button"
                    className="pill"
                    style={{
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      background: symbol === s.symbol ? 'var(--primary-light)' : 'var(--bg-app)',
                      borderColor: symbol === s.symbol ? 'var(--primary)' : 'var(--border-color)',
                      color: symbol === s.symbol ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.name.split(' ')[0]} ({s.symbol})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Asset Type */}
          <div className="form-group">
            <label className="form-label">Asset Category</label>
            <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
              <option value="stock">Equity Stock (NSE / BSE)</option>
              <option value="mutual_fund">Mutual Fund (AMFI NAV)</option>
              <option value="gold">Gold & Precious Metals</option>
              <option value="fd">Fixed Deposit / Bond</option>
              <option value="other">Other Asset / Real Estate</option>
            </select>
          </div>

          {/* Name & Ticker */}
          <div className="settings-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Parag Parikh Flexi Cap"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ticker Symbol / Code</label>
              <input
                type="text"
                placeholder="e.g. RELIANCE.NS or Scheme Name"
                className="form-control"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
              />
            </div>
          </div>

          {/* Quantity & Buy Price */}
          <div className="settings-grid-2" style={{ marginTop: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Units / Quantity Held</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 10.5"
                className="form-control"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Average Buy Price (₹)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2800.00"
                className="form-control"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Current Live Price */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Current Market Price / NAV (₹)</label>
            <input
              type="number"
              step="any"
              placeholder="Leave blank for auto-sync or enter price"
              className="form-control"
              value={currentPrice}
              onChange={e => setCurrentPrice(e.target.value)}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Live prices auto-fetch continuously from AMFI & Yahoo Finance.
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes / Folio Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Zerodha Kite Account / Folio #123456"
              className="form-control"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Update Holding' : 'Save Investment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
