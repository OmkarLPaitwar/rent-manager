import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import API from '../utils/api';

const MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = v => `${(v/1000).toFixed(0)}k`;

export default function YearlyReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/summary/yearly/${year}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!data) return null;

  const chartData = data.monthly.map((m, i) => ({ name: MS[i], Rent: m.totalRent, Expenses: m.totalExpenses, Balance: m.balance }));
  const totalRent = data.monthly.reduce((s, m) => s + m.totalRent, 0);
  const totalExp = data.monthly.reduce((s, m) => s + m.totalExpenses, 0);
  const totalBal = totalRent - totalExp;
  const bestMonth = [...data.monthly].filter(m => m.totalRent > 0).sort((a, b) => b.balance - a.balance)[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📈 Yearly Report</div>
          <div className="page-sub">{year}</div>
        </div>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)}
          className="form-control" style={{ width: 90, fontSize: 14 }} />
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="stat-label">Total Rent</div>
          <div className="stat-value income">Rs.{totalRent.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">Rs.{totalExp.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: `3px solid ${totalBal >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${totalBal >= 0 ? 'balance-pos' : 'balance-neg'}`}>
            {totalBal >= 0 ? '+' : ''}Rs.{totalBal.toLocaleString('en-IN')}
          </div>
        </div>
        {bestMonth && (
          <div className="stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
            <div className="stat-label">Best Month</div>
            <div className="stat-value neutral">{MS[bestMonth.month - 1]}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Rs.{bestMonth.balance.toLocaleString('en-IN')}</div>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 8px 16px 16px' }}>
        <div className="card-header" style={{ paddingRight: 8 }}>
          <div className="card-title">📊 Rent vs Expenses</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => `Rs.${v.toLocaleString('en-IN')}`} />
            <Bar dataKey="Rent" fill="#27ae60" radius={[3,3,0,0]} maxBarSize={28} />
            <Bar dataKey="Expenses" fill="#c0392b" radius={[3,3,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 8px 16px 16px' }}>
        <div className="card-header" style={{ paddingRight: 8 }}>
          <div className="card-title">📉 Balance Trend</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => `Rs.${v.toLocaleString('en-IN')}`} />
            <Line type="monotone" dataKey="Balance" stroke="#1e3a6e" strokeWidth={2.5} dot={{ fill: '#1e3a6e', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table — desktop */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Month-by-Month</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Rent</th><th>Expenses</th><th>Balance</th></tr></thead>
            <tbody>
              {data.monthly.map((m, i) => (
                <tr key={i} style={{ opacity: m.totalRent === 0 && m.totalExpenses === 0 ? 0.35 : 1 }}>
                  <td><strong>{MS[i]} {year}</strong></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{m.totalRent > 0 ? `Rs.${m.totalRent.toLocaleString('en-IN')}` : '—'}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{m.totalExpenses > 0 ? `Rs.${m.totalExpenses.toLocaleString('en-IN')}` : '—'}</td>
                  <td>{(m.totalRent > 0 || m.totalExpenses > 0) && <span style={{ fontWeight: 700, color: m.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{m.balance >= 0 ? '+' : ''}Rs.{m.balance.toLocaleString('en-IN')}</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total {year}</strong></td>
                <td style={{ color: 'var(--success)', fontWeight: 800 }}>Rs.{totalRent.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 800 }}>Rs.{totalExp.toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 800, color: totalBal >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>{totalBal >= 0 ? '+' : ''}Rs.{totalBal.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile list */}
        <div className="mobile-list">
          {data.monthly.map((m, i) => {
            if (m.totalRent === 0 && m.totalExpenses === 0) return null;
            return (
              <div key={i} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-name">{MS[i]} {year}</div>
                  <span style={{ fontWeight: 800, color: m.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
                    {m.balance >= 0 ? '+' : ''}Rs.{m.balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: 'var(--success)' }}>↑ Rs.{m.totalRent.toLocaleString('en-IN')}</span>
                  <span style={{ color: 'var(--danger)' }}>↓ Rs.{m.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
          <div style={{ padding: '14px 4px', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border)', fontWeight: 800, fontSize: 15, marginTop: 4 }}>
            <span>Year Total</span>
            <span style={{ color: totalBal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalBal >= 0 ? '+' : ''}Rs.{totalBal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
