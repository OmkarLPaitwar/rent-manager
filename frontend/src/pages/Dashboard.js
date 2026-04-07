import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Build last 6 months list
  useEffect(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m <= 0) { m += 12; y -= 1; }
      list.push({ month: m, year: y });
    }
    setMonths(list);
  }, [currentMonth, currentYear]);

  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    if (months.length === 0) return;
    Promise.all(months.map(({ month, year }) =>
      API.get(`/summary/${year}/${month}`).then(r => r.data).catch(() => null)
    )).then(data => {
      setSummaries(data.filter(Boolean));
      setLoading(false);
    });
  }, [months]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const current = summaries[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👋 Welcome, {user?.name?.split(' ')[0]}!</div>
          <div className="page-sub">{user?.propertyName} • {MONTHS[currentMonth - 1]} {currentYear}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/summary?month=${currentMonth}&year=${currentYear}`)}>
          📄 View This Month
        </button>
      </div>

      {/* Current month stats */}
      {current && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">💰 Rent Received</div>
            <div className="stat-value income">₹{current.summary.totalRent.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{current.rents.length} payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📋 Total Expenses</div>
            <div className="stat-value expense">₹{current.summary.totalExpenses.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{current.expenses.length} items</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📊 Balance</div>
            <div className={`stat-value ${current.summary.balance >= 0 ? 'balance-pos' : 'balance-neg'}`}>
              {current.summary.balance >= 0 ? '+' : ''}₹{current.summary.balance.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🏦 BOB Transfers</div>
            <div className="stat-value neutral">₹{current.summary.bobTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💵 Cash Received</div>
            <div className="stat-value neutral">₹{current.summary.cashTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">📱 UPI Received</div>
            <div className="stat-value neutral">₹{current.summary.upiTotal.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {/* Monthly history */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Monthly Overview</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/yearly')}>View Yearly →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Rent Received</th>
                <th>Total Expenses</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => (
                <tr key={`${s.month}-${s.year}`}>
                  <td><strong>{MONTHS[s.month - 1]} {s.year}</strong></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{s.summary.totalRent.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>₹{s.summary.totalExpenses.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ color: s.summary.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {s.summary.balance >= 0 ? '+' : ''}₹{s.summary.balance.toLocaleString('en-IN')}
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
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
        {[
          { icon: '💰', label: 'Add Rent', path: '/rent' },
          { icon: '📋', label: 'Add Expense', path: '/expenses' },
          { icon: '💡', label: 'Light Bill', path: '/lightbill' },
          { icon: '👥', label: 'Tenants', path: '/tenants' },
        ].map(a => (
          <button key={a.path} className="card" style={{ textAlign: 'center', cursor: 'pointer', border: '2px dashed var(--border)' }} onClick={() => navigate(a.path)}>
            <div style={{ fontSize: 28 }}>{a.icon}</div>
            <div style={{ fontWeight: 600, marginTop: 6, color: 'var(--primary)' }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
