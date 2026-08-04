import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, ShieldCheck, Delete, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MpinModal({
  isOpen,
  onClose,
  mode = 'verify', // 'verify' | 'set'
  email = '',
  token = '',
  onSuccess
}) {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setPin('');
    setConfirmPin('');
    setIsConfirming(false);
    setError('');
    setSuccess('');
  }, [isOpen, mode]);

  const handleKeyPress = (numStr) => {
    if (loading) return;
    setError('');

    const current = isConfirming ? confirmPin : pin;
    if (current.length < 4) {
      const next = current + numStr;
      if (isConfirming) {
        setConfirmPin(next);
        if (next.length === 4) handleFinishSetMpin(pin, next);
      } else {
        setPin(next);
        if (next.length === 4) {
          if (mode === 'verify') {
            handleVerifyMpin(next);
          } else {
            setIsConfirming(true);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setError('');
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleVerifyMpin = async (completedPin) => {
    setLoading(true);
    try {
      const targetEmail = email || localStorage.getItem('ledgerly_remembered_email');
      if (!targetEmail) {
        throw new Error('Please enter your account email first');
      }

      const res = await fetch('/api/auth/mpin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, mpin: completedPin })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invalid 4-Digit MPIN');

      setSuccess('MPIN Verified!');
      setTimeout(() => {
        onSuccess(json.user, json.token);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetMpin = async (firstPin, secondPin) => {
    if (firstPin !== secondPin) {
      setError('MPINs do not match. Try again.');
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/mpin/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mpin: secondPin })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to set MPIN');

      setSuccess('4-Digit Security MPIN Set Successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to set MPIN');
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const activeDigits = isConfirming ? confirmPin : pin;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px' }}>
              {mode === 'verify' ? '4-Digit MPIN Authentication' : (isConfirming ? 'Confirm 4-Digit MPIN' : 'Set 4-Digit Security MPIN')}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {mode === 'verify'
            ? `Enter your 4-digit MPIN for ${email || 'your account'}`
            : (isConfirming ? 'Re-enter 4-digit MPIN to confirm' : 'Choose a 4-digit Security PIN for fast mobile unlock')}
        </p>

        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        {/* Tactile 4-Dot PIN Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '28px' }}>
          {[0, 1, 2, 3].map(index => {
            const isFilled = activeDigits.length > index;
            return (
              <div
                key={index}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isFilled ? 'var(--primary)' : 'transparent',
                  border: isFilled ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                  boxShadow: isFilled ? '0 0 12px var(--primary-glow)' : 'none',
                  transition: 'all 0.25s var(--ease-spring)',
                  transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                }}
              />
            );
          })}
        </div>

        {/* Number Pad Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '280px', margin: '0 auto 16px auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              className="btn btn-secondary"
              style={{
                height: '56px',
                fontSize: '20px',
                fontWeight: '700',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => handleKeyPress(num)}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              height: '56px',
              fontSize: '20px',
              fontWeight: '700',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
            onClick={handleDelete}
            title="Backspace"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
