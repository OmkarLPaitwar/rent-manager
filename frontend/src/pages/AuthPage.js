import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', propertyName: '', pin: '', confirmPin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { login, register, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else if (tab === 'register') {
        if (!form.name || !form.email || !form.password || !form.pin || !form.confirmPin) { setError('All fields are required'); setLoading(false); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        if (form.pin !== form.confirmPin) { setError('PINs do not match'); setLoading(false); return; }
        if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { setError('PIN must be exactly 4 digits'); setLoading(false); return; }
        
        await register(form.name, form.email, form.password, form.propertyName, form.pin);
        navigate('/dashboard');
      } else if (tab === 'forgot') {
        if (!form.email) { setError('Please enter your email'); setLoading(false); return; }
        await forgotPassword(form.email);
        setMessage('Reset link sent to your email (check console in dev)');
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: "contain" }} />
          <h1>Rent & Expense Manager</h1>
          <p>Track your property income & expenses</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setMessage(''); }}>Login</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setMessage(''); }}>Register</button>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}
        {message && <div className="auth-success" style={{ color: '#10b981', background: '#ecfdf5', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', border: '1px solid #10b981' }}>✅ {message}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" name="name" placeholder="Your name" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">Property Name</label>
                <input className="form-control" name="propertyName" placeholder="e.g. Shri Ram Apartments" value={form.propertyName} onChange={handle} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handle} required />
          </div>
          {tab !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                {tab === 'login' && (
                  <button type="button" onClick={() => setTab('forgot')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                    Forgot?
                  </button>
                )}
              </div>
              <input className="form-control" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
            </div>
          )}
          {tab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Set App PIN (4 digits)</label>
                <input className="form-control" name="pin" type="password" inputMode="numeric" maxLength={4} pattern="\d{4}" placeholder="••••" value={form.pin} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm PIN</label>
                <input className="form-control" name="confirmPin" type="password" inputMode="numeric" maxLength={4} pattern="\d{4}" placeholder="••••" value={form.confirmPin} onChange={handle} required />
              </div>
            </>
          )}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? '⏳ Please wait...' : tab === 'login' ? '🔑 Login' : tab === 'register' ? '🚀 Create Account' : '✉️ Send Reset Link'}
          </button>
          {tab === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: 15 }}>
              <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}>
                Back to Login
              </button>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
