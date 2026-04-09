import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState([]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      let m = currentMonth - i, y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }
      list.push({ month: m, year: y });
    }
    Promise.all(list.map(({ month, year }) =>
      API.get(`/summary/${year}/${month}`).then(r => r.data).catch(() => null)
    )).then(data => { setSummaries(data.filter(Boolean)); setLoading(false); });
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const current = summaries[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👋 {user?.name?.split(' ')[0]}!</div>
          <div className="page-sub">{user?.propertyName} • {MONTHS[currentMonth - 1]} {currentYear}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/summary?month=${currentMonth}&year=${currentYear}`)}>
          📄 This Month
        </button>
      </div>

      {current && (
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
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '💰', label: 'Rent', path: '/rent' },
          { icon: '📋', label: 'Expenses', path: '/expenses' },
          { icon: '💡', label: 'Light Bill', path: '/lightbill' },
          { icon: '👥', label: 'Tenants', path: '/tenants' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)} style={{
            background: 'white', border: '2px dashed var(--border)', borderRadius: 12,
            padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s'
          }}>
            <div style={{ fontSize: 26 }}>{a.icon}</div>
            <div style={{ fontWeight: 600, marginTop: 5, color: 'var(--primary)', fontSize: 12 }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* Monthly overview card */}
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
              {summaries.map(s => (
                <tr key={`${s.month}-${s.year}`}>
                  <td><strong>{MONTHS[s.month - 1]} {s.year}</strong></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs.{s.summary.totalRent.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>Rs.{s.summary.totalExpenses.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ color: s.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {s.summary.balance >= 0 ? '+' : ''}Rs.{s.summary.balance.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/summary?month=${s.month}&year=${s.year}`)}>
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="mobile-list">
          {summaries.map(s => (
            <div key={`${s.month}-${s.year}`} className="mobile-card">
              <div className="mobile-card-header">
                <div className="mobile-card-name">{MONTHS[s.month - 1]} {s.year}</div>
                <span style={{ color: s.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: 16 }}>
                  {s.summary.balance >= 0 ? '+' : ''}Rs.{s.summary.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--success)' }}>↑ Rs.{s.summary.totalRent.toLocaleString('en-IN')}</span>
                <span style={{ color: 'var(--danger)' }}>↓ Rs.{s.summary.totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="mobile-card-actions">
                <button className="btn btn-ghost btn-sm w-full" onClick={() => navigate(`/summary?month=${s.month}&year=${s.year}`)}>
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
