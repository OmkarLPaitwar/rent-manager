import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Quick actions — icons as SVG-like emoji with labels
const QUICK_ACTIONS = [
  { emoji: '💰', label: 'Rent', path: '/rent', color: '#27ae60' },
  { emoji: '📋', label: 'Expenses', path: '/expenses', color: '#c0392b' },
  { emoji: '💡', label: 'Light Bill', path: '/lightbill', color: '#f0a500' },
  { emoji: '👥', label: 'Tenants', path: '/tenants', color: '#1e3a6e' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [summaries, setSummaries] = useState([]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Optimised: single API call for current month, then lazy-load history
  const load = useCallback(async () => {
    try {
      // Load current month first — show it immediately
      const cur = await API.get(`/summary/${currentYear}/${currentMonth}`).then(r => r.data).catch(() => null);
      setCurrent(cur);
      setLoading(false);

      // Then load last 5 months in parallel (background)
      const list = [];
      for (let i = 1; i <= 5; i++) {
        let m = currentMonth - i, y = currentYear;
        if (m <= 0) { m += 12; y -= 1; }
        list.push({ month: m, year: y });
      }
      const hist = await Promise.all(
        list.map(({ month, year }) =>
          API.get(`/summary/${year}/${month}`).then(r => r.data).catch(() => null)
        )
      );
      setSummaries([cur, ...hist.filter(Boolean)].filter(Boolean));
    } catch {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div>
          <div className="page-title">👋 {user?.name?.split(' ')[0]}!</div>
          <div className="page-sub">{user?.propertyName} • {MONTH_FULL[currentMonth - 1]} {currentYear}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/summary?month=${currentMonth}&year=${currentYear}`)}>
          📄 This Month
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      {loading ? (
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card" style={{ minHeight: 80 }}>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 4, marginBottom: 12, width: '60%' }} />
              <div style={{ height: 24, background: 'var(--border)', borderRadius: 4, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : current ? (
        <div className="stats-grid">
          <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
            <div className="stat-label">💰 Rent</div>
            <div className="stat-value income">Rs.{current.summary.totalRent.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{current.rents.length} payments</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
            <div className="stat-label">📋 Expenses</div>
            <div className="stat-value expense">Rs.{current.summary.totalExpenses.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{current.expenses.length} items</div>
          </div>
          <div className="stat-card" style={{ borderTop: `3px solid ${current.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
            <div className="stat-label">📊 Balance</div>
            <div className={`stat-value ${current.summary.balance >= 0 ? 'balance-pos' : 'balance-neg'}`}>
              {current.summary.balance >= 0 ? '+' : ''}Rs.{current.summary.balance.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🏦 BOB</div>
            <div className="stat-value neutral">Rs.{current.summary.bobTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💵 Cash</div>
            <div className="stat-value neutral">Rs.{current.summary.cashTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📱 UPI</div>
            <div className="stat-value neutral">Rs.{current.summary.upiTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px', marginBottom: 16, color: 'var(--text-muted)' }}>
          No data for {MONTH_FULL[currentMonth - 1]} yet. Add your first rent payment!
        </div>
      )}

      {/* ── QUICK ACTIONS — fully visible, touch-friendly ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              background: 'white',
              border: `1.5px solid ${a.color}22`,
              borderTop: `3px solid ${a.color}`,
              borderRadius: 12,
              padding: '14px 6px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              minHeight: 76,
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{a.emoji}</span>
            <span style={{ fontWeight: 700, color: a.color, fontSize: 11, lineHeight: 1.2 }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── MONTHLY OVERVIEW ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Monthly Overview</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/yearly')}>Yearly →</button>
        </div>

        {/* Desktop table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Rent</th><th>Expenses</th><th>Balance</th><th></th></tr>
            </thead>
            <tbody>
              {summaries.length === 0 && !loading && (
                <tr><td colSpan={5}><div className="empty"><span className="empty-icon">📅</span>No history yet</div></td></tr>
              )}
              {summaries.map(s => (
                <tr key={`${s.month}-${s.year}`}>
                  <td><strong>{MONTHS[s.month - 1]} {s.year}</strong></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs.{s.summary.totalRent.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>Rs.{s.summary.totalExpenses.toLocaleString('en-IN')}</td>
                  <td><span style={{ color: s.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {s.summary.balance >= 0 ? '+' : ''}Rs.{s.summary.balance.toLocaleString('en-IN')}
                  </span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/summary?month=${s.month}&year=${s.year}`)}>Details →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="mobile-list">
          {summaries.length === 0 && !loading && (
            <div className="empty"><span className="empty-icon">📅</span>No history yet</div>
          )}
          {summaries.map(s => (
            <div key={`${s.month}-${s.year}`} className="mobile-card">
              <div className="mobile-card-header">
                <div className="mobile-card-name">{MONTHS[s.month - 1]} {s.year}</div>
                <span style={{ color: s.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: 16 }}>
                  {s.summary.balance >= 0 ? '+' : ''}Rs.{s.summary.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--success)' }}>↑ Rs.{s.summary.totalRent.toLocaleString('en-IN')}</span>
                <span style={{ color: 'var(--danger)' }}>↓ Rs.{s.summary.totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="mobile-card-actions">
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/summary?month=${s.month}&year=${s.year}`)}>
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
