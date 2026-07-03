import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';

const EMPTY = { name: '', unitType: '1BHK', unitLabel: '', monthlyRent: '', paymentMethod: 'Cash', phone: '', isActive: true };

const methodBadge = (m) => {
  const cls = m === 'BOB Transfer' ? 'badge-bob' : m === 'Cash' ? 'badge-cash' : m === 'UPI' ? 'badge-upi' : 'badge-other';
  return <span className={`badge ${cls}`}>{m}</span>;
};

export default function Tenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [deleted, setDeleted] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const { show } = useToast();

  const load = () => API.get('/tenants').then(r => { setTenants(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const loadDeleted = async () => {
    setLoadingDeleted(true);
    try {
      const r = await API.get('/tenants/deleted');
      setDeleted(r.data);
    } catch { show('❌ Failed to load former tenants', 'error'); }
    setLoadingDeleted(false);
  };

  // Always re-fetch when opening the panel so it's never stale
  const toggleDeleted = async () => {
    const opening = !showDeleted;
    setShowDeleted(opening);
    if (opening) await loadDeleted();
  };

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = t => { setForm({ ...t }); setEditing(t._id); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/tenants/${editing}`, form); show('✅ Tenant updated'); }
      else { await API.post('/tenants', form); show('✅ Tenant added'); }
      closeModal(); load();
    } catch (err) { show('❌ ' + (err.response?.data?.message || 'Error'), 'error'); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from active tenants?\nTheir complete history will be preserved in Former Tenants.`)) return;
    try {
      await API.delete(`/tenants/${id}`);
      show('🗂️ Moved to Former Tenants');
      // Reload active list immediately
      load();
      // Always refresh deleted list so panel shows new entry when opened
      await loadDeleted();
      // Auto-open the Former Tenants panel so user sees it
      setShowDeleted(true);
    } catch (err) {
      show('❌ ' + (err.response?.data?.message || 'Error deleting tenant'), 'error');
    }
  };

  const toggle = async (t) => {
    try { await API.put(`/tenants/${t._id}`, { ...t, isActive: !t.isActive }); load(); }
    catch {}
  };

  if (loading) return <Loader message="Fetching your tenant list..." />;

  const active = tenants.filter(t => t.isActive);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Tenants</div>
          <div className="page-sub">
            {active.length} active • Rs.{active.reduce((s, t) => s + t.monthlyRent, 0).toLocaleString('en-IN')}/mo ·{' '}
            <span style={{ color: 'var(--primary-light)', fontStyle: 'italic' }}>click a tenant to view history</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${showDeleted ? 'btn-accent' : 'btn-ghost'}`}
            onClick={toggleDeleted}
            style={{ position: 'relative' }}
          >
            🗂️ Former Tenants
            {deleted.length > 0 && showDeleted && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--danger)', color: 'white',
                fontSize: 10, fontWeight: 700,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{deleted.length}</span>
            )}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
        </div>
      </div>

      {/* ── Active Tenants ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Desktop table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Unit</th><th>Rent/Month</th><th>Method</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr><td colSpan={7}><div className="empty"><span className="empty-icon">🏠</span>No tenants yet</div></td></tr>
              )}
              {tenants.map(t => (
                <tr
                  key={t._id}
                  style={{ opacity: t.isActive ? 1 : 0.5, cursor: 'pointer' }}
                  onClick={() => navigate(`/tenants/${t._id}`)}
                >
                  <td>
                    <strong style={{ color: 'var(--primary)' }}>{t.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>tap to view history</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{t.unitType} {t.unitLabel && `(${t.unitLabel})`}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>Rs.{t.monthlyRent.toLocaleString('en-IN')}</td>
                  <td>{methodBadge(t.paymentMethod)}</td>
                  <td>{t.phone || '—'}</td>
                  <td><span className={`badge ${t.isActive ? 'badge-cash' : 'badge-other'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="actions" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" title="View History" onClick={() => navigate(`/tenants/${t._id}`)}>👁️</button>
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

        {/* Mobile card list */}
        <div className="mobile-list">
          {tenants.length === 0 && <div className="empty"><span className="empty-icon">🏠</span>No tenants yet</div>}
          {tenants.map(t => (
            <div key={t._id} className="mobile-card" style={{ opacity: t.isActive ? 1 : 0.55 }}>
              <div className="mobile-card-header" onClick={() => navigate(`/tenants/${t._id}`)} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="mobile-card-name" style={{ color: 'var(--primary)' }}>{t.name}</div>
                  <div className="mobile-card-meta">
                    <span>{t.unitType} {t.unitLabel && `(${t.unitLabel})`}</span>
                    {methodBadge(t.paymentMethod)}
                    <span className={`badge ${t.isActive ? 'badge-cash' : 'badge-other'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mobile-card-amount" style={{ color: 'var(--success)' }}>Rs.{t.monthlyRent.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>👁️ view history</div>
                </div>
              </div>
              {t.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📞 {t.phone}</div>}
              <div className="mobile-card-actions">
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/tenants/${t._id}`)}>👁️ History</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(t)}>✏️ Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => toggle(t)}>{t.isActive ? '🔴' : '🟢'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => del(t._id, t.name)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fab" onClick={openAdd}>+</button>

      {/* ── Former / Deleted Tenants Section ── */}
      {showDeleted && (
        <div style={{ marginBottom: 24 }}>
          {/* Section Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14, padding: '12px 16px',
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 'var(--radius)', flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: 20 }}>🗂️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>Former Tenants</div>
              <div style={{ fontSize: 12, color: '#a16207' }}>
                Removed tenants — complete history is still preserved and accessible
              </div>
            </div>
            {loadingDeleted && <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />}
          </div>

          {loadingDeleted ? (
            <Loader message="Loading former tenants history..." />
          ) : deleted.length === 0 ? (
            <div className="card">
              <div className="empty">
                <span className="empty-icon">📭</span>
                No former tenants yet. Deleted tenants will appear here.
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card table-wrap" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Rent/Month</th>
                      <th>Phone</th>
                      <th>Removed On</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deleted.map(t => (
                      <tr key={t._id} style={{ opacity: 0.85 }}>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>{t.name}</strong>
                          <span style={{
                            marginLeft: 8, background: '#fef3c7', color: '#92400e',
                            fontSize: 10, fontWeight: 700, padding: '2px 7px',
                            borderRadius: 20, border: '1px solid #fde68a'
                          }}>Former</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.unitType} {t.unitLabel && `(${t.unitLabel})`}</td>
                        <td style={{ color: 'var(--text-muted)' }}>Rs.{t.monthlyRent.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.phone || '—'}</td>
                        <td style={{ color: 'var(--danger)', fontSize: 12 }}>
                          {t.deletedAt ? new Date(t.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/tenants/${t._id}`)}
                            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                          >
                            👁️ View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards for deleted */}
              <div className="mobile-list">
                {deleted.map(t => (
                  <div key={t._id} className="mobile-card" style={{
                    opacity: 0.9,
                    background: '#fffbeb',
                    border: '1px solid #fde68a'
                  }}>
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-name" style={{ color: 'var(--text)' }}>
                          {t.name}
                          <span style={{
                            marginLeft: 8, background: '#fef3c7', color: '#92400e',
                            fontSize: 10, fontWeight: 700, padding: '2px 7px',
                            borderRadius: 20, border: '1px solid #fde68a', verticalAlign: 'middle'
                          }}>Former</span>
                        </div>
                        <div className="mobile-card-meta">
                          <span>{t.unitType} {t.unitLabel && `(${t.unitLabel})`}</span>
                          {methodBadge(t.paymentMethod)}
                        </div>
                        {t.deletedAt && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>
                            🗑️ Removed: {new Date(t.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mobile-card-amount" style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                          Rs.{t.monthlyRent.toLocaleString('en-IN')}
                        </div>
                        {t.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📞 {t.phone}</div>}
                      </div>
                    </div>
                    <div className="mobile-card-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        onClick={() => navigate(`/tenants/${t._id}`)}
                      >
                        👁️ View Full History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Edit Tenant' : '+ Add Tenant'}</div>
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
                      {['1BHK','1RK','Room','Shared Room','Shop','Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Label</label>
                    <input className="form-control" name="unitLabel" value={form.unitLabel} onChange={handle} placeholder="Front, Back, F1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monthly Rent (Rs.) *</label>
                    <input className="form-control" name="monthlyRent" type="number" value={form.monthlyRent} onChange={handle} required placeholder="8000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-control" name="paymentMethod" value={form.paymentMethod} onChange={handle}>
                      {['BOB Transfer','Cash','UPI','Other'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
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
