import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PinLockPage() {
  const { user, verifyPin, resetPin, logout } = useAuth();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = useCallback(
    async (fullPin) => {
      setLoading(true);
      setError('');
      try {
        const res = await verifyPin(fullPin);
        if (res.success) {
          navigate('/dashboard');
        } else {
          setError(res.message || 'Incorrect PIN');
          setShaking(true);
          setPin('');
          setTimeout(() => setShaking(false), 500);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong');
        setShaking(true);
        setPin('');
        setTimeout(() => setShaking(false), 500);
      } finally {
        setLoading(false);
      }
    },
    [verifyPin, navigate]
  );

  const handleKeyPress = useCallback(
    (key) => {
      if (loading || resetting) return;
      setError('');
      if (key === 'backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (/^\d$/.test(key)) {
        if (pin.length < 4) {
          const newPin = pin + key;
          setPin(newPin);
          if (newPin.length === 4) {
            handleSubmit(newPin);
          }
        }
      }
    },
    [pin, loading, resetting, handleSubmit]
  );

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace') {
        handleKeyPress('backspace');
      } else if (/^\d$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handleForgotPin = async () => {
    if (window.confirm('Reset your PIN to default (1234)?')) {
      setResetting(true);
      try {
        await resetPin();
        alert('PIN reset to 1234. Please enter 1234.');
        setPin('');
        setError('');
      } catch (err) {
        alert('Failed to reset PIN. Please check your connection.');
      } finally {
        setResetting(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={screenStyle}>
      {/* Decorative circles */}
      <div style={circleStyle1} />
      <div style={circleStyle2} />

      <div style={containerStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/logo.png" alt="Logo" style={logoStyle} />
        </div>

        {/* Title */}
        <h1 style={titleStyle}>Rent & Expense Manager</h1>
        
        {/* Greeting */}
        <p style={greetingStyle}>
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}
        </p>

        {/* PIN Prompt */}
        <p style={promptStyle}>Enter your 4-digit PIN</p>

        {/* Dot Indicators */}
        <div className={`pin-dots ${shaking ? 'pin-shake' : ''}`} style={dotsContainerStyle}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`pin-dot ${index < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && <div style={errorStyle}>⚠️ {error}</div>}

        {/* Numpad */}
        <div className="pin-numpad" style={numpadStyle}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="pin-key"
              onClick={() => handleKeyPress(num.toString())}
              disabled={loading || resetting}
            >
              {num}
            </button>
          ))}
          <div /> {/* Spacer */}
          <button
            type="button"
            className="pin-key"
            onClick={() => handleKeyPress('0')}
            disabled={loading || resetting}
          >
            0
          </button>
          <button
            type="button"
            className="pin-key backspace"
            onClick={() => handleKeyPress('backspace')}
            disabled={loading || resetting}
          >
            ⌫
          </button>
        </div>

        {/* Status indicator */}
        {loading && <div style={statusStyle}>Verifying...</div>}
        {resetting && <div style={statusStyle}>Resetting PIN...</div>}

        {/* Footer Actions */}
        <div style={footerStyle}>
          <button
            type="button"
            style={linkBtnStyle}
            onClick={handleForgotPin}
            disabled={loading || resetting}
          >
            Forgot PIN?
          </button>
          <button
            type="button"
            style={{ ...linkBtnStyle, marginTop: 12 }}
            onClick={handleLogout}
            disabled={loading || resetting}
          >
            Not you? Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Inline Styles --- */
const screenStyle = {
  fontFamily: "'Inter', -apple-system, sans-serif",
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f1f4a 0%, #1e3a6e 45%, #2a52a0 100%)',
  position: 'relative',
  overflowY: 'auto',
  color: 'white',
  boxSizing: 'border-box',
  padding: '20px 0'
};

const circleStyle1 = {
  position: 'absolute',
  width: 'clamp(300px, 40vw, 500px)',
  height: 'clamp(300px, 40vw, 500px)',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.03)',
  top: -100,
  right: -100,
  pointerEvents: 'none'
};

const circleStyle2 = {
  position: 'absolute',
  width: 'clamp(200px, 30vw, 300px)',
  height: 'clamp(200px, 30vw, 300px)',
  borderRadius: '50%',
  background: 'rgba(240, 165, 0, 0.05)',
  bottom: 50,
  left: -50,
  pointerEvents: 'none'
};

const containerStyle = {
  width: '100%',
  maxWidth: 340,
  padding: 'clamp(16px, 4vh, 32px) 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 10
};

const logoStyle = {
  width: 'clamp(56px, 8vh, 72px)',
  height: 'clamp(56px, 8vh, 72px)',
  objectFit: 'contain'
};

const titleStyle = {
  fontSize: 'clamp(16px, 4vw, 18px)',
  fontWeight: 800,
  color: 'white',
  margin: 0,
  textAlign: 'center'
};

const greetingStyle = {
  fontSize: 13,
  color: 'rgba(255, 255, 255, 0.6)',
  margin: '4px 0 0 0',
  textAlign: 'center'
};

const promptStyle = {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.5)',
  margin: 'clamp(20px, 4vh, 32px) 0 clamp(12px, 3vh, 20px) 0',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const dotsContainerStyle = {
  marginBottom: 8
};

const errorStyle = {
  color: '#ff6b6b',
  fontSize: 13,
  marginTop: 10,
  textAlign: 'center',
  fontWeight: 500
};

const numpadStyle = {
  marginTop: 'clamp(16px, 4vh, 32px)'
};

const statusStyle = {
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: 13,
  marginTop: 12,
  textAlign: 'center'
};

const footerStyle = {
  marginTop: 'clamp(20px, 4vh, 32px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
  padding: '4px 8px',
  transition: 'color 0.2s',
  ':hover': {
    color: 'rgba(255, 255, 255, 0.8)'
  }
};
