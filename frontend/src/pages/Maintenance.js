import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_ENTRY = () => ({ tenant: '', tenantName: '', amount: '', notes: '' });

export default function Maintenance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([DEFAULT_ENTRY()]);
  const [tenants, setTenants] = useState([]);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => { 
    API.get('/tenants').then(r => setTenants(r.data.filter(t => t.isActive))); 
  }, []);

  useEffect(() => {
    setLoading(true);
    API.get(`/maintenance?month=${month}&year=${year}`)
      .then(r => {
        if (r.data) {
          setSaved(r.data);
          setEntries(r.data.entries.map(e => ({
            tenant: e.tenant || '', tenantName: e.tenantName || '',
            amount: e.amount, notes: e.notes || ''
          })));
        } else { setSaved(null); setEntries([DEFAULT_ENTRY()]); }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [month, year]);

  const updateEntry = (i, field, value) => {
    const updatedEntries = [...entries];
    const e = { ...updatedEntries[i], [field]: value };

    if (field === 'tenant') {
      const t = tenants.find(t => t._id === value);
      e.tenantName = t?.name || '';
      // Maybe default amount from somewhere? For now just empty or keep existing
    }
    
    updatedEntries[i] = e;
    setEntries(updatedEntries);
  };

  const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const save = async () => {
    if (!entries.every(e => e.tenant && e.amount !== '')) {
      show('⚠️ Select tenants and enter amounts', 'error'); return;
    }
    try {
      const res = await API.post('/maintenance', { month, year, entries });
      setSaved(res.data); show('✅ Maintenance saved!');
    } catch { show('❌ Error saving', 'error'); }
  };

  const del = async () => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try { await API.delete(`/maintenance/${month}/${year}`); setSaved(null); setEntries([DEFAULT_ENTRY()]); show('🗑️ Deleted'); }
    catch { show('❌ Error', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🛠️ Maintenance</div>
          <div className="page-sub">{MONTHS[month - 1]} {year} {saved && '• ✅ Saved'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saved && <button className="btn btn-ghost btn-sm" onClick={del}>🗑️</button>}
          <button className="btn btn-success" onClick={save}>💾 Save</button>
        </div>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => setMonth(+e.target.value)} className="form-control" style={{ width: 'auto', fontSize: 14 }}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} className="form-control" style={{ width: 90, fontSize: 14 }} />
      </div>

      {loading ? <Loader message="Fetching maintenance records..." /> : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 36px', gap: 8, padding: '10px 14px', background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <span>Tenant</span><span>Amount (Rs.)</span><span>Notes</span><span></span>
            </div>
            {entries.map((entry, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 36px', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: i % 2 ? 'var(--bg)' : 'white' }}>
                <select className="form-control" value={entry.tenant} onChange={e => updateEntry(i, 'tenant', e.target.value)} style={{ fontSize: 13, padding: '5px 8px' }}>
                  <option value="">— Select Tenant —</option>
                  {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <input className="form-control" type="number" value={entry.amount} onChange={e => updateEntry(i, 'amount', e.target.value)} placeholder="500" style={{ fontSize: 13, padding: '5px 8px' }} />
                <input className="form-control" value={entry.notes} onChange={e => updateEntry(i, 'notes', e.target.value)} placeholder="e.g. Cleaning, Lift" style={{ fontSize: 13, padding: '5px 8px' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => setEntries(e => e.filter((_, idx) => idx !== i))} disabled={entries.length === 1} style={{ padding: '5px 8px', fontSize: 16 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 36px', gap: 8, padding: '12px 14px', background: 'var(--primary-pale)', borderTop: '2px solid var(--primary)', alignItems: 'center' }}>
              <strong style={{ color: 'var(--primary)', fontSize: 12 }}>TOTAL</strong>
              <strong style={{ color: 'var(--primary)', fontSize: 15 }}>Rs.{totalAmount.toLocaleString('en-IN')}</strong>
              <span /><span />
            </div>
          </div>

          {/* Mobile view */}
          <div className="mobile-list" style={{ marginBottom: 14 }}>
            {entries.map((entry, i) => (
              <div key={i} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Entry {i + 1}</span>
                  {entries.length > 1 && <button className="btn btn-ghost btn-sm" onClick={() => setEntries(e => e.filter((_, idx) => idx !== i))}>×</button>}
                </div>
                <div className="form-group">
                  <label className="form-label">Tenant</label>
                  <select className="form-control" value={entry.tenant} onChange={e => updateEntry(i, 'tenant', e.target.value)}>
                    <option value="">— Select —</option>
                    {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (Rs.)</label>
                    <input className="form-control" type="number" value={entry.amount} onChange={e => updateEntry(i, 'amount', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input className="form-control" value={entry.notes} onChange={e => updateEntry(i, 'notes', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-outline" onClick={() => setEntries(e => [...e, DEFAULT_ENTRY()])} style={{ marginBottom: 16 }}>+ Add Entry</button>

          <div className="card" style={{ background: 'var(--primary)', color: 'white', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>📊 Total Maintenance</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Rs.{totalAmount.toLocaleString('en-IN')}</div>
          </div>
        </>
      )}
    </div>
  );
}
