import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { generateMonthlyPDF } from '../utils/pdfExport';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

  const downloadPDF = () => {
    if (!data) return;
    generateMonthlyPDF(data, user?.propertyName || 'My Property');
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const { rents = [], expenses = [], lightBill, summary = {} } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📄 Monthly Summary</div>
          <div className="page-sub">{MONTHS[month - 1]} {year}</div>
        </div>
        <button className="btn btn-accent" onClick={downloadPDF}>
          ⬇️ Download PDF
        </button>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} style={{ width: 90 }} />
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div className="stat-label">Total Rent Received</div>
          <div className="stat-value income">₹{(summary.totalRent || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card" style={{ borderTop: `3px solid ${(summary.balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="stat-label">Remaining Balance</div>
          <div className={`stat-value ${(summary.balance || 0) >= 0 ? 'balance-pos' : 'balance-neg'}`}>
            {(summary.balance || 0) >= 0 ? '+' : ''}₹{(summary.balance || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="summary-sections">
        {/* Rent Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 Rent Received</div>
            <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{(summary.totalRent || 0).toLocaleString('en-IN')}</span>
          </div>
          {rents.length === 0 ? (
            <div className="empty"><div className="empty-icon">💸</div><div>No rent payments</div></div>
          ) : (
            <>
              {rents.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.tenantName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('en-IN')} • {r.paymentMethod}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{r.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
              <div className="section-total">
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>₹{(summary.totalRent || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {summary.bobTotal > 0 && <span className="badge badge-bob">🏦 BOB: ₹{summary.bobTotal.toLocaleString('en-IN')}</span>}
                {summary.cashTotal > 0 && <span className="badge badge-cash">💵 Cash: ₹{summary.cashTotal.toLocaleString('en-IN')}</span>}
                {summary.upiTotal > 0 && <span className="badge badge-upi">📱 UPI: ₹{summary.upiTotal.toLocaleString('en-IN')}</span>}
              </div>
            </>
          )}
        </div>

        {/* Expenses Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Expenses</div>
            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</span>
          </div>
          {expenses.length === 0 ? (
            <div className="empty"><div className="empty-icon">📋</div><div>No expenses</div></div>
          ) : (
            <>
              {expenses.map(e => (
                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString('en-IN')} • {e.category}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
              <div className="section-total">
                <span>Total</span>
                <span style={{ color: 'var(--danger)' }}>₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Light Bill Section */}
      {lightBill && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">💡 Light Bill — {MONTHS[month - 1]} {year}</div>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{lightBill.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Unit</th><th>Prev</th><th>Curr</th><th>Units</th><th>Rate</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {lightBill.entries.map((e, i) => (
                  <tr key={i}>
                    <td><strong>{e.unitLabel}</strong></td>
                    <td>{e.previousReading}</td>
                    <td>{e.currentReading}</td>
                    <td>{e.unitsConsumed}</td>
                    <td>₹{e.ratePerUnit}/unit</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>Total</strong></td>
                  <td><strong>{lightBill.totalUnits} units</strong></td>
                  <td></td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>₹{lightBill.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Final Summary Box */}
      <div className="card" style={{ marginTop: 20, background: (summary.balance || 0) >= 0 ? 'var(--success-pale)' : 'var(--danger-pale)', border: `2px solid ${(summary.balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--primary)' }}>📊 Final Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span>Total Rent</span><span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{(summary.totalRent || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span>Total Expenses</span><span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontWeight: 700 }}>Remaining Balance</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: (summary.balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {(summary.balance || 0) >= 0 ? '+' : ''}₹{(summary.balance || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button className="btn btn-accent" onClick={downloadPDF} style={{ padding: '12px 32px', fontSize: 15 }}>
          ⬇️ Download PDF Report
        </button>
      </div>
    </div>
  );
}
