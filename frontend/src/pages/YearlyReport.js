import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import API from '../utils/api';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (v) => `₹${(v/1000).toFixed(0)}k`;

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

  const chartData = data.monthly.map((m, i) => ({
    name: MONTHS_SHORT[i],
    Rent: m.totalRent,
    Expenses: m.totalExpenses,
    Balance: m.balance
  }));

  const totalRent = data.monthly.reduce((s, m) => s + m.totalRent, 0);
  const totalExp = data.monthly.reduce((s, m) => s + m.totalExpenses, 0);
  const totalBal = totalRent - totalExp;
  const bestMonth = [...data.monthly].sort((a, b) => b.balance - a.balance)[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📈 Yearly Report</div>
          <div className="page-sub">Full year overview — {year}</div>
        </div>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)}
          style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14 }} />
      </div>

      {/* Year stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="stat-label">📥 Total Rent {year}</div>
          <div className="stat-value income">₹{totalRent.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">📤 Total Expenses {year}</div>
          <div className="stat-value expense">₹{totalExp.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: `3px solid ${totalBal >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-label">💹 Net Balance {year}</div>
          <div className={`stat-value ${totalBal >= 0 ? 'balance-pos' : 'balance-neg'}`}>
            {totalBal >= 0 ? '+' : ''}₹{totalBal.toLocaleString('en-IN')}
          </div>
        </div>
        {bestMonth && bestMonth.totalRent > 0 && (
          <div className="stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
            <div className="stat-label">🏆 Best Month</div>
            <div className="stat-value neutral">{MONTHS_SHORT[bestMonth.month - 1]}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>₹{bestMonth.balance.toLocaleString('en-IN')} balance</div>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📊 Rent vs Expenses — {year}</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
            <Legend />
            <Bar dataKey="Rent" fill="#27ae60" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#c0392b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Balance trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📉 Monthly Balance Trend</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
            <Line type="monotone" dataKey="Balance" stroke="#1e3a6e" strokeWidth={2.5} dot={{ fill: '#1e3a6e', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Month-by-Month Breakdown</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Rent</th><th>Expenses</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {data.monthly.map((m, i) => (
                <tr key={i} style={{ opacity: m.totalRent === 0 && m.totalExpenses === 0 ? 0.4 : 1 }}>
                  <td><strong>{MONTHS_SHORT[i]} {year}</strong></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {m.totalRent > 0 ? `₹${m.totalRent.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    {m.totalExpenses > 0 ? `₹${m.totalExpenses.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td>
                    {m.totalRent > 0 || m.totalExpenses > 0 ? (
                      <span style={{ fontWeight: 700, color: m.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {m.balance >= 0 ? '+' : ''}₹{m.balance.toLocaleString('en-IN')}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total {year}</strong></td>
                <td style={{ color: 'var(--success)', fontWeight: 800 }}>₹{totalRent.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 800 }}>₹{totalExp.toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 800, color: totalBal >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>
                  {totalBal >= 0 ? '+' : ''}₹{totalBal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
