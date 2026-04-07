import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const EMPTY = { name: '', unitType: '1BHK', unitLabel: '', monthlyRent: '', paymentMethod: 'Cash', phone: '', isActive: true };

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const load = () => API.get('/tenants').then(r => { setTenants(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = t => { setForm({ ...t, monthlyRent: t.monthlyRent }); setEditing(t._id); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/tenants/${editing}`, form);
        show('✅ Tenant updated');
      } else {
        await API.post('/tenants', form);
        show('✅ Tenant added');
      }
      closeModal(); load();
    } catch (err) { show('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Remove tenant "${name}"? This will not delete their payment history.`)) return;
    try { await API.delete(`/tenants/${id}`); show('🗑️ Tenant removed'); load(); }
    catch (err) { show('❌ Error', 'error'); }
  };

  const toggle = async (t) => {
    try { await API.put(`/tenants/${t._id}`, { ...t, isActive: !t.isActive }); load(); }
    catch {}
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const active = tenants.filter(t => t.isActive);
  const inactive = tenants.filter(t => !t.isActive);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Tenants</div>
          <div className="page-sub">{active.length} active tenants • Total receivable: ₹{active.reduce((s, t) => s + t.monthlyRent, 0).toLocaleString('en-IN')}/mo</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Tenant</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Unit</th><th>Monthly Rent</th><th>Payment Method</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr><td colSpan={7}><div className="empty"><div className="empty-icon">🏠</div><div>No tenants added yet</div></div></td></tr>
              )}
              {tenants.map(t => (
                <tr key={t._id} style={{ opacity: t.isActive ? 1 : 0.5 }}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.unitType} {t.unitLabel && `(${t.unitLabel})`}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{t.monthlyRent.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge badge-${t.paymentMethod === 'BOB Transfer' ? 'bob' : t.paymentMethod === 'Cash' ? 'cash' : t.paymentMethod === 'UPI' ? 'upi' : 'other'}`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td>{t.phone || '—'}</td>
                  <td>
                    <span className={`badge ${t.isActive ? 'badge-cash' : 'badge-other'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggle(t)}>{t.isActive ? '🔴' : '🟢'}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => del(t._id, t.name)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Edit Tenant' : '+ Add New Tenant'}</div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tenant Name *</label>
                  <input className="form-control" name="name" value={form.name} onChange={handle} required placeholder="e.g. Mane, Bhutada" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Type</label>
                    <select className="form-control" name="unitType" value={form.unitType} onChange={handle}>
                      {['1BHK','1RK','Room','Shop','Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Label</label>
                    <input className="form-control" name="unitLabel" value={form.unitLabel} onChange={handle} placeholder="e.g. Front, Back, F1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monthly Rent (₹) *</label>
                    <input className="form-control" name="monthlyRent" type="number" value={form.monthlyRent} onChange={handle} required placeholder="8000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Payment</label>
                    <select className="form-control" name="paymentMethod" value={form.paymentMethod} onChange={handle}>
                      {['BOB Transfer','Cash','UPI','Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handle} placeholder="9876543210" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Tenant'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
