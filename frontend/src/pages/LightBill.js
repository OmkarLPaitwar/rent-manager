import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_ENTRY = () => ({ unitLabel: '', tenant: '', tenantName: '', previousReading: '', currentReading: '', ratePerUnit: 12 });

export default function LightBill() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([DEFAULT_ENTRY()]);
  const [tenants, setTenants] = useState([]);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => { API.get('/tenants').then(r => setTenants(r.data.filter(t => t.isActive))); }, []);

  useEffect(() => {
    setLoading(true);
    API.get(`/lightbill?month=${month}&year=${year}`)
      .then(r => {
        if (r.data) {
          setSaved(r.data);
          setEntries(r.data.entries.map(e => ({
            unitLabel: e.unitLabel, tenant: e.tenant || '', tenantName: e.tenantName || '',
            previousReading: e.previousReading, currentReading: e.currentReading, ratePerUnit: e.ratePerUnit
          })));
        } else { setSaved(null); setEntries([DEFAULT_ENTRY()]); }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [month, year]);

  const updateEntry = (i, field, value) => {
    setEntries(prev => prev.map((e, idx) => {
      if (idx !== i) return e;
      const updated = { ...e, [field]: value };
      if (field === 'tenant') {
        const t = tenants.find(t => t._id === value);
        updated.tenantName = t?.name || '';
        if (!updated.unitLabel && t) updated.unitLabel = `${t.unitType} ${t.unitLabel || ''}`.trim();
      }
      return updated;
    }));
  };

  const calc = (e) => {
    const prev = parseFloat(e.previousReading) || 0;
    const curr = parseFloat(e.currentReading) || 0;
    const rate = parseFloat(e.ratePerUnit) || 12;
    const units = curr - prev;
    return { units: units > 0 ? units : 0, amount: units > 0 ? units * rate : 0 };
  };

  const totalUnits = entries.reduce((s, e) => s + calc(e).units, 0);
  const totalAmount = entries.reduce((s, e) => s + calc(e).amount, 0);

  const save = async () => {
    if (!entries.every(e => e.unitLabel && e.currentReading !== '' && e.previousReading !== '')) {
      show('⚠️ Fill all unit labels and readings', 'error'); return;
    }
    try {
      const res = await API.post('/lightbill', { month, year, entries });
      setSaved(res.data); show('✅ Light bill saved!');
    } catch { show('❌ Error saving', 'error'); }
  };

  const del = async () => {
    if (!window.confirm('Delete this light bill?')) return;
    try { await API.delete(`/lightbill/${month}/${year}`); setSaved(null); setEntries([DEFAULT_ENTRY()]); show('🗑️ Deleted'); }
    catch { show('❌ Error', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💡 Light Bill</div>
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

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <>
          {/* Desktop grid table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 70px 1fr 36px', gap: 8, padding: '10px 14px', background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <span>Unit</span><span>Tenant</span><span>Prev</span><span>Current</span><span>Rate</span><span>Amount</span><span></span>
            </div>
            {entries.map((entry, i) => {
              const { units, amount } = calc(entry);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 70px 1fr 36px', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: i % 2 ? 'var(--bg)' : 'white' }}>
                  <input className="form-control" value={entry.unitLabel} onChange={e => updateEntry(i, 'unitLabel', e.target.value)} placeholder="e.g. G1" style={{ fontSize: 13, padding: '5px 8px' }} />
                  <select className="form-control" value={entry.tenant} onChange={e => updateEntry(i, 'tenant', e.target.value)} style={{ fontSize: 13, padding: '5px 8px' }}>
                    <option value="">— Link —</option>
                    {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <input className="form-control" type="number" value={entry.previousReading} onChange={e => updateEntry(i, 'previousReading', e.target.value)} placeholder="187" style={{ fontSize: 13, padding: '5px 8px' }} />
                  <input className="form-control" type="number" value={entry.currentReading} onChange={e => updateEntry(i, 'currentReading', e.target.value)} placeholder="219" style={{ fontSize: 13, padding: '5px 8px' }} />
                  <input className="form-control" type="number" value={entry.ratePerUnit} onChange={e => updateEntry(i, 'ratePerUnit', e.target.value)} style={{ fontSize: 13, padding: '5px 8px' }} />
                  <div style={{ fontSize: 12 }}>
                    {entry.previousReading !== '' && entry.currentReading !== '' ? (
                      <><div style={{ color: 'var(--text-muted)' }}>{units}u × {entry.ratePerUnit}</div><div style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs.{amount.toLocaleString('en-IN')}</div></>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEntries(e => e.filter((_, idx) => idx !== i))} disabled={entries.length === 1} style={{ padding: '5px 8px', fontSize: 16 }}>×</button>
                </div>
              );
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 70px 1fr 36px', gap: 8, padding: '12px 14px', background: 'var(--primary-pale)', borderTop: '2px solid var(--primary)', alignItems: 'center' }}>
              <strong style={{ color: 'var(--primary)', fontSize: 12 }}>TOTAL</strong>
              <span /><span /><span />
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>{totalUnits}u</span>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalUnits} units</div><div style={{ fontWeight: 800, color: 'var(--primary)' }}>Rs.{totalAmount.toLocaleString('en-IN')}</div></div>
              <span />
            </div>
          </div>

          {/* Mobile card per unit */}
          <div className="mobile-list" style={{ marginBottom: 14 }}>
            {entries.map((entry, i) => {
              const { units, amount } = calc(entry);
              return (
                <div key={i} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>Unit {i + 1}</span>
                    {entries.length > 1 && <button className="btn btn-ghost btn-sm" onClick={() => setEntries(e => e.filter((_, idx) => idx !== i))} style={{ padding: '4px 10px' }}>× Remove</button>}
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Unit Label</label>
                      <input className="form-control" value={entry.unitLabel} onChange={e => updateEntry(i, 'unitLabel', e.target.value)} placeholder="e.g. G1, S2" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Link Tenant</label>
                      <select className="form-control" value={entry.tenant} onChange={e => updateEntry(i, 'tenant', e.target.value)}>
                        <option value="">— Select —</option>
                        {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Prev</label>
                      <input className="form-control" type="number" value={entry.previousReading} onChange={e => updateEntry(i, 'previousReading', e.target.value)} placeholder="187" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Current</label>
                      <input className="form-control" type="number" value={entry.currentReading} onChange={e => updateEntry(i, 'currentReading', e.target.value)} placeholder="219" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Rate</label>
                      <input className="form-control" type="number" value={entry.ratePerUnit} onChange={e => updateEntry(i, 'ratePerUnit', e.target.value)} />
                    </div>
                  </div>
                  {entry.previousReading !== '' && entry.currentReading !== '' && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--primary-pale)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{units} units × Rs.{entry.ratePerUnit}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>Rs.{amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btn btn-outline" onClick={() => setEntries(e => [...e, DEFAULT_ENTRY()])} style={{ marginBottom: 16 }}>+ Add Unit</button>

          {/* Summary */}
          <div className="card" style={{ background: 'var(--primary)', color: 'white', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>📊 Bill Summary — {MONTHS[month - 1]} {year}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[['Total Units', totalUnits], ['Total Amount', `Rs.${totalAmount.toLocaleString('en-IN')}`], ['Avg/Unit', entries.length ? Math.round(totalUnits / entries.length) : 0]].map(([l, v]) => (
                <div key={l}><div style={{ opacity: 0.7, fontSize: 11, marginBottom: 4 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div></div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>💡 How to use</div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8 }}>
              Enter previous & current meter reading for each unit → amount is auto-calculated → tap Save Bill.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
