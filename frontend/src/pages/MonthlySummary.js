import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { generateMonthlyPDF } from '../utils/pdfExport';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const methodBadge = m => {
  const cls = m === 'BOB Transfer' ? 'badge-bob' : m === 'Cash' ? 'badge-cash' : m === 'UPI' ? 'badge-upi' : 'badge-other';
  return <span className={`badge ${cls}`}>{m}</span>;
};

export default function MonthlySummary() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const now = new Date();
  const [month, setMonth] = useState(parseInt(params.get('month')) || now.getMonth() + 1);
  const [year, setYear] = useState(parseInt(params.get('year')) || now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/summary/${year}/${month}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  const { rents = [], expenses = [], lightBill, summary = {} } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📄 Summary</div>
          <div className="page-sub">{MONTHS[month - 1]} {year}</div>
        </div>
        <button className="btn btn-accent" onClick={() => data && generateMonthlyPDF(data, user?.propertyName || 'My Property')}>
          ⬇️ PDF
        </button>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => setMonth(+e.target.value)} className="form-control" style={{ width: 'auto', fontSize: 14 }}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} className="form-control" style={{ width: 90, fontSize: 14 }} />
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="stat-label">Rent Received</div>
          <div className="stat-value income">Rs.{(summary.totalRent||0).toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">Rs.{(summary.totalExpenses||0).toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: `3px solid ${(summary.balance||0) >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-label">Balance</div>
          <div className={`stat-value ${(summary.balance||0) >= 0 ? 'balance-pos' : 'balance-neg'}`}>
            {(summary.balance||0) >= 0 ? '+' : ''}Rs.{(summary.balance||0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Rent & Expenses stacked on mobile, side-by-side on desktop */}
      <div className="summary-sections">
        {/* Rent */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 Rent Received</div>
            <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>Rs.{(summary.totalRent||0).toLocaleString('en-IN')}</span>
          </div>
          {rents.length === 0 ? <div className="empty"><span className="empty-icon">💸</span>No payments</div> : (
            <>
              {rents.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.tenantName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>{new Date(r.date).toLocaleDateString('en-IN')}</span>
                      {methodBadge(r.paymentMethod)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14, flexShrink: 0 }}>Rs.{r.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4, fontWeight: 800, fontSize: 15, borderTop: '2px solid var(--border)' }}>
                <span>Total</span><span style={{ color: 'var(--success)' }}>Rs.{(summary.totalRent||0).toLocaleString('en-IN')}</span>
              </div>
              {(summary.bobTotal > 0 || summary.cashTotal > 0 || summary.upiTotal > 0) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {summary.bobTotal > 0 && <span className="badge badge-bob">🏦 BOB: Rs.{summary.bobTotal.toLocaleString('en-IN')}</span>}
                  {summary.cashTotal > 0 && <span className="badge badge-cash">💵 Cash: Rs.{summary.cashTotal.toLocaleString('en-IN')}</span>}
                  {summary.upiTotal > 0 && <span className="badge badge-upi">📱 UPI: Rs.{summary.upiTotal.toLocaleString('en-IN')}</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Expenses */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Expenses</div>
            <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 15 }}>Rs.{(summary.totalExpenses||0).toLocaleString('en-IN')}</span>
          </div>
          {expenses.length === 0 ? <div className="empty"><span className="empty-icon">📋</span>No expenses</div> : (
            <>
              {expenses.map(e => (
                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(e.date).toLocaleDateString('en-IN')} • {e.category}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14, flexShrink: 0 }}>Rs.{e.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4, fontWeight: 800, fontSize: 15, borderTop: '2px solid var(--border)' }}>
                <span>Total</span><span style={{ color: 'var(--danger)' }}>Rs.{(summary.totalExpenses||0).toLocaleString('en-IN')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Light Bill */}
      {lightBill && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <div className="card-title">💡 Light Bill</div>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs.{lightBill.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          {/* Desktop table */}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Unit</th><th>Prev</th><th>Curr</th><th>Units</th><th>Rate</th><th>Amount</th></tr></thead>
              <tbody>
                {lightBill.entries.map((e, i) => (
                  <tr key={i}>
                    <td><strong>{e.unitLabel}</strong></td>
                    <td>{e.previousReading}</td><td>{e.currentReading}</td>
                    <td>{e.unitsConsumed}</td>
                    <td>Rs.{e.ratePerUnit}/u</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs.{e.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}><strong>Total</strong></td><td><strong>{lightBill.totalUnits}</strong></td><td></td><td style={{ color: 'var(--primary)', fontSize: 15 }}>Rs.{lightBill.totalAmount.toLocaleString('en-IN')}</td></tr></tfoot>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mobile-list">
            {lightBill.entries.map((e, i) => (
              <div key={i} className="mobile-card">
                <div className="mobile-card-header">
                  <div><div className="mobile-card-name">{e.unitLabel}</div><div className="mobile-card-meta"><span>{e.previousReading} → {e.currentReading}</span><span>{e.unitsConsumed} units × Rs.{e.ratePerUnit}</span></div></div>
                  <div className="mobile-card-amount" style={{ color: 'var(--primary)' }}>Rs.{e.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', padding: '10px 4px', fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>
              Total: {lightBill.totalUnits} units = Rs.{lightBill.totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Final balance box */}
      <div style={{ marginTop: 18, padding: '18px 20px', borderRadius: 14, background: (summary.balance||0) >= 0 ? 'var(--success-pale)' : 'var(--danger-pale)', border: `2px solid ${(summary.balance||0) >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>FINAL SUMMARY</div>
        {[['Total Rent', `Rs.${(summary.totalRent||0).toLocaleString('en-IN')}`, 'var(--success)'],
          ['Total Expenses', `Rs.${(summary.totalExpenses||0).toLocaleString('en-IN')}`, 'var(--danger)'],
          ['Balance', `${(summary.balance||0) >= 0 ? '+' : ''}Rs.${(summary.balance||0).toLocaleString('en-IN')}`, (summary.balance||0) >= 0 ? 'var(--success)' : 'var(--danger)']
        ].map(([l, v, c]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 14 }}>{l}</span>
            <span style={{ fontWeight: 800, color: c, fontSize: 15 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button className="btn btn-accent" style={{ width: '100%', padding: 14, fontSize: 15 }} onClick={() => data && generateMonthlyPDF(data, user?.propertyName || 'My Property')}>
          ⬇️ Download PDF Report
        </button>
      </div>
    </div>
  );
}
