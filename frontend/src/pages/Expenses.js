import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATS = ['Maintenance','Utilities','Travel','Installment','Insurance','Tax','Other'];
const EMPTY = { title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Other', notes: '' };

const CAT_COLORS = { Maintenance: '#3b82f6', Utilities: '#f59e0b', Travel: '#10b981', Installment: '#8b5cf6', Insurance: '#06b6d4', Tax: '#ef4444', Other: '#6b7280' };

export default function Expenses() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const load = () => API.get(`/expenses?month=${month}&year=${year}`).then(r => { setExpenses(r.data); setLoading(false); });
  useEffect(() => { setLoading(true); load(); }, [month, year]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = e => { setForm({ title: e.title, amount: e.amount, date: e.date.split('T')[0], category: e.category, notes: e.notes || '' }); setEditing(e._id); setModal(true); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/expenses/${editing}`, form); show('✅ Updated'); }
      else { await API.post('/expenses', form); show('✅ Expense added'); }
      setModal(false); load();
    } catch (err) { show('❌ Error', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await API.delete(`/expenses/${id}`); show('🗑️ Deleted'); load(); }
    catch { show('❌ Error', 'error'); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const byCat = CATS.reduce((acc, c) => {
    const items = expenses.filter(e => e.category === c);
    if (items.length) acc[c] = items.reduce((s, i) => s + i.amount, 0);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Expenses</div>
          <div className="page-sub">{MONTHS[month - 1]} {year} • Total: ₹{total.toLocaleString('en-IN')}</div>
        </div>
        <button className="btn btn-danger" onClick={openAdd}>+ Add Expense</button>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} style={{ width: 90 }} />
      </div>

      {/* Category breakdown */}
      {Object.keys(byCat).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(byCat).map(([cat, amt]) => (
            <div key={cat} className="card" style={{ padding: '10px 16px', flex: '0 0 auto', borderTop: `3px solid ${CAT_COLORS[cat]}` }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{cat}</div>
              <div style={{ fontWeight: 700, color: CAT_COLORS[cat], fontSize: 16 }}>₹{amt.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loader"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr><th>Title</th><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {expenses.length === 0 && (
                  <tr><td colSpan={6}><div className="empty"><div className="empty-icon">📋</div><div>No expenses for this month</div></div></td></tr>
                )}
                {expenses.map(e => (
                  <tr key={e._id}>
                    <td><strong>{e.title}</strong></td>
                    <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: CAT_COLORS[e.category] + '22', color: CAT_COLORS[e.category] }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.notes || '—'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => del(e._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3}><strong>Total</strong></td>
                    <td colSpan={3} style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 15 }}>₹{total.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Edit Expense' : '+ Add Expense'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-control" name="title" value={form.title} onChange={handle} required placeholder="e.g. Solar Installment, Sarpanch for Vihir" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="form-control" name="amount" type="number" value={form.amount} onChange={handle} required placeholder="3500" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-control" name="date" type="date" value={form.date} onChange={handle} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" name="category" value={form.category} onChange={handle}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-control" name="notes" value={form.notes} onChange={handle} placeholder="Any notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
