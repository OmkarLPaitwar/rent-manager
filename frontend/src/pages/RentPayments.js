import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EMPTY_FORM = { tenantId: '', tenantName: '', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' };

const methodBadge = (m) => {
  const cls = m === 'BOB Transfer' ? 'badge-bob' : m === 'Cash' ? 'badge-cash' : m === 'UPI' ? 'badge-upi' : 'badge-other';
  return <span className={`badge ${cls}`}>{m}</span>;
};

export default function RentPayments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rents, setRents] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const loadRents = () => API.get(`/rent?month=${month}&year=${year}`).then(r => { setRents(r.data); setLoading(false); });
  useEffect(() => { setLoading(true); loadRents(); }, [month, year]);
  useEffect(() => { API.get('/tenants').then(r => setTenants(r.data.filter(t => t.isActive))); }, []);

  const handle = e => {
    const { name, value } = e.target;
    if (name === 'tenantId') {
      const t = tenants.find(t => t._id === value);
      setForm(f => ({ ...f, tenantId: value, tenantName: t?.name || '', amount: t?.monthlyRent || '', paymentMethod: t?.paymentMethod || 'Cash' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setModal(true); };
  const openEdit = r => {
    setForm({ tenantId: r.tenant, tenantName: r.tenantName, amount: r.amount, date: r.date.split('T')[0], paymentMethod: r.paymentMethod, notes: r.notes || '' });
    setEditing(r._id); setModal(true);
  };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/rent/${editing}`, form); show('✅ Updated'); }
      else { await API.post('/rent', form); show('✅ Rent recorded'); }
      setModal(false); loadRents();
    } catch (err) { show('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try { await API.delete(`/rent/${id}`); show('🗑️ Deleted'); loadRents(); }
    catch { show('❌ Error', 'error'); }
  };

  const totalRent = rents.reduce((s, r) => s + r.amount, 0);
  const bobTotal = rents.filter(r => r.paymentMethod === 'BOB Transfer').reduce((s, r) => s + r.amount, 0);
  const cashTotal = rents.filter(r => r.paymentMethod === 'Cash').reduce((s, r) => s + r.amount, 0);
  const upiTotal = rents.filter(r => r.paymentMethod === 'UPI').reduce((s, r) => s + r.amount, 0);
  const paidTenantIds = [...new Set(rents.map(r => r.tenant))];
  const unpaid = tenants.filter(t => !paidTenantIds.includes(t._id));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💰 Rent Payments</div>
          <div className="page-sub">{MONTHS[month - 1]} {year}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Rent</button>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => setMonth(+e.target.value)} className="form-control" style={{ width: 'auto', fontSize: 14 }}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} className="form-control" style={{ width: 90, fontSize: 14 }} />
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value income">Rs.{totalRent.toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">🏦 BOB</div><div className="stat-value neutral">Rs.{bobTotal.toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">💵 Cash</div><div className="stat-value neutral">Rs.{cashTotal.toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">📱 UPI</div><div className="stat-value neutral">Rs.{upiTotal.toLocaleString('en-IN')}</div></div>
      </div>

      {unpaid.length > 0 && (
        <div className="pending-alert">
          <div className="pending-alert-title">⚠️ Pending ({unpaid.length})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {unpaid.map(t => <span key={t._id} className="badge badge-other">{t.name} — Rs.{t.monthlyRent.toLocaleString('en-IN')}</span>)}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? <div className="loader"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Tenant</th><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                {rents.length === 0 && <tr><td colSpan={6}><div className="empty"><span className="empty-icon">💸</span>No payments this month</div></td></tr>}
                {rents.map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.tenantName}</strong></td>
                    <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>Rs.{r.amount.toLocaleString('en-IN')}</td>
                    <td>{methodBadge(r.paymentMethod)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.notes || '—'}</td>
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => del(r._id)}>🗑️</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
              {rents.length > 0 && <tfoot><tr><td colSpan={2}><strong>Total</strong></td><td colSpan={4} style={{ color: 'var(--success)', fontSize: 15 }}>Rs.{totalRent.toLocaleString('en-IN')}</td></tr></tfoot>}
            </table>
          )}
        </div>

        {/* Mobile card list */}
        <div className="mobile-list">
          {loading ? <div className="loader"><div className="spinner" /></div> : rents.length === 0 ? (
            <div className="empty"><span className="empty-icon">💸</span>No payments this month</div>
          ) : rents.map(r => (
            <div key={r._id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-name">{r.tenantName}</div>
                  <div className="mobile-card-meta">
                    <span>{new Date(r.date).toLocaleDateString('en-IN')}</span>
                    {methodBadge(r.paymentMethod)}
                  </div>
                </div>
                <div className="mobile-card-amount" style={{ color: 'var(--success)' }}>Rs.{r.amount.toLocaleString('en-IN')}</div>
              </div>
              {r.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{r.notes}</div>}
              <div className="mobile-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => del(r._id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
          {rents.length > 0 && (
            <div style={{ textAlign: 'right', padding: '12px 4px', fontWeight: 800, color: 'var(--success)', fontSize: 16 }}>
              Total: Rs.{totalRent.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* FAB for mobile */}
      <button className="fab" onClick={openAdd}>+</button>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Edit Payment' : '+ Add Rent Payment'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Tenant *</label>
                    <select className="form-control" name="tenantId" value={form.tenantId} onChange={handle} required>
                      <option value="">-- Select Tenant --</option>
                      {tenants.map(t => <option key={t._id} value={t._id}>{t.name} ({t.unitType} {t.unitLabel})</option>)}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (Rs.) *</label>
                    <input className="form-control" name="amount" type="number" value={form.amount} onChange={handle} required placeholder="8000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-control" name="date" type="date" value={form.date} onChange={handle} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" name="paymentMethod" value={form.paymentMethod} onChange={handle}>
                    {['BOB Transfer','Cash','UPI','Other'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" name="notes" value={form.notes} onChange={handle} placeholder="Optional note..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
