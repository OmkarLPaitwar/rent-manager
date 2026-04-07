import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useToast } from '../components/Toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_ENTRY = (label = '', tenantId = '') => ({ unitLabel: label, tenant: tenantId, tenantName: '', previousReading: '', currentReading: '', ratePerUnit: 12 });

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
        } else {
          setSaved(null);
          setEntries([DEFAULT_ENTRY()]);
        }
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

  const addEntry = () => setEntries(e => [...e, DEFAULT_ENTRY()]);
  const removeEntry = (i) => setEntries(e => e.filter((_, idx) => idx !== i));

  const calc = (e) => {
    const prev = parseFloat(e.previousReading) || 0;
    const curr = parseFloat(e.currentReading) || 0;
    const rate = parseFloat(e.ratePerUnit) || 12;
    const units = curr - prev;
    return { units: units > 0 ? units : 0, amount: units > 0 ? units * rate : 0 };
  };

  const totalUnits = entries.reduce((s, e) => s + (calc(e).units), 0);
  const totalAmount = entries.reduce((s, e) => s + (calc(e).amount), 0);

  const save = async () => {
    const valid = entries.every(e => e.unitLabel && e.currentReading !== '' && e.previousReading !== '');
    if (!valid) { show('⚠️ Please fill all unit labels and readings', 'error'); return; }
    try {
      const res = await API.post('/lightbill', { month, year, entries });
      setSaved(res.data);
      show('✅ Light bill saved!');
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
          <div className="page-title">💡 Light Bill Calculator</div>
          <div className="page-sub">{MONTHS[month - 1]} {year}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {saved && <button className="btn btn-ghost" onClick={del}>🗑️ Clear</button>}
          <button className="btn btn-success" onClick={save}>💾 Save Bill</button>
        </div>
      </div>

      <div className="month-bar">
        <select value={month} onChange={e => { setMonth(+e.target.value); }}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} min={2020} max={2099} onChange={e => setYear(+e.target.value)} style={{ width: 90 }} />
        {saved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>✅ Saved</span>}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <>
          {/* Header row */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'var(--primary)', color: 'white', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 1fr 40px', gap: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Unit / Tenant</span><span>Tenant Link</span><span>Prev Reading</span><span>Curr Reading</span><span>Rate/Unit</span><span>Calculated</span><span></span>
            </div>

            {entries.map((entry, i) => {
              const { units, amount } = calc(entry);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 1fr 40px', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <input
                    className="form-control"
                    value={entry.unitLabel}
                    onChange={e => updateEntry(i, 'unitLabel', e.target.value)}
                    placeholder="e.g. 1BHK Front"
                    style={{ padding: '6px 8px' }}
                  />
                  <select
                    className="form-control"
                    value={entry.tenant}
                    onChange={e => updateEntry(i, 'tenant', e.target.value)}
                    style={{ padding: '6px 8px' }}
                  >
                    <option value="">-- Link Tenant --</option>
                    {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <input className="form-control" type="number" value={entry.previousReading} onChange={e => updateEntry(i, 'previousReading', e.target.value)} placeholder="187" style={{ padding: '6px 8px' }} />
                  <input className="form-control" type="number" value={entry.currentReading} onChange={e => updateEntry(i, 'currentReading', e.target.value)} placeholder="219" style={{ padding: '6px 8px' }} />
                  <input className="form-control" type="number" value={entry.ratePerUnit} onChange={e => updateEntry(i, 'ratePerUnit', e.target.value)} style={{ padding: '6px 8px' }} />
                  <div>
                    {entry.previousReading !== '' && entry.currentReading !== '' ? (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{units} units × ₹{entry.ratePerUnit}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{amount.toLocaleString('en-IN')}</div>
                      </>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeEntry(i)}
                    disabled={entries.length === 1}
                    style={{ padding: '6px 8px' }}
                  >×</button>
                </div>
              );
            })}

            {/* Total row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 1fr 40px', gap: 10, padding: '14px 16px', background: 'var(--primary-pale)', borderTop: '2px solid var(--primary)', alignItems: 'center' }}>
              <strong style={{ color: 'var(--primary)' }}>TOTAL</strong>
              <span></span><span></span><span></span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalUnits} units</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{totalUnits} total units</div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <span></span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={addEntry}>+ Add Unit</button>
          </div>

          {/* Summary card */}
          <div className="card" style={{ marginTop: 20, background: 'var(--primary)', color: 'white' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>📊 Bill Summary — {MONTHS[month - 1]} {year}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Total Units</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{totalUnits}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Total Amount</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Units / tenant</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{entries.length > 0 ? Math.round(totalUnits / entries.length) : 0}</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card" style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>💡 How to use</div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8 }}>
              1. Enter the previous meter reading for each unit<br />
              2. Enter the current month's meter reading<br />
              3. Set rate per unit (default ₹12 as per your bill)<br />
              4. The calculation is automatic: Units × Rate = Amount<br />
              5. Click "Save Bill" to save for this month
            </div>
          </div>
        </>
      )}
    </div>
  );
}
