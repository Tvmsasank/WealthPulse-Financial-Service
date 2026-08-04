import React, { useState, useEffect, useCallback } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Delete } from 'lucide-react';

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

  const handleKeyPress = useCallback((numStr) => {
    if (loading) return;
    setError('');

    if (isConfirming) {
      if (confirmPin.length < 4) {
        const next = confirmPin + numStr;
        setConfirmPin(next);
        if (next.length === 4) handleFinishSetMpin(pin, next);
      }
    } else {
      if (pin.length < 4) {
        const next = pin + numStr;
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
  }, [loading, isConfirming, pin, confirmPin, mode]);

  const handleDelete = useCallback(() => {
    if (loading) return;
    setError('');
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  }, [loading, isConfirming]);

  // Physical Keyboard Input Listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return; // Allow natural typing & backspace inside input fields!
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleDelete, onClose]);

  const handleVerifyMpin = async (completedPin) => {
    setLoading(true);
    try {
      const targetEmail = email || localStorage.getItem('ledgerly_remembered_email');
      if (!targetEmail) {
        throw new Error('Please enter your account email address first');
      }

      const res = await fetch('/api/auth/mpin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, mpin: completedPin })
      });

      const responseText = await res.text();
      let json = {};
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server response error (${res.status}). Please check API server.`);
      }

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
    const activeToken = token || localStorage.getItem('ledgerly_token') || sessionStorage.getItem('ledgerly_token') || '';

    try {
      const res = await fetch('/api/auth/mpin/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ mpin: secondPin })
      });

      const responseText = await res.text();
      let json = {};
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server response error (${res.status}). Please check API server.`);
      }

      if (!res.ok) throw new Error(json.error || 'Failed to set MPIN');

      localStorage.setItem('ledgerly_has_mpin', 'true');
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

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {mode === 'verify'
            ? `Type or tap your 4-digit MPIN for ${email || 'your account'}`
            : (isConfirming ? 'Re-type 4-digit MPIN to confirm' : 'Type or tap a 4-digit PIN using keyboard or key pad')}
        </p>

        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '8px 12px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        {/* Tactile 4-Dot PIN Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '280px', margin: '0 auto 16px auto' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              className="btn btn-secondary"
              style={{
                height: '54px',
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
              height: '54px',
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
              height: '54px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
            onClick={handleDelete}
            title="Backspace (Delete)"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
