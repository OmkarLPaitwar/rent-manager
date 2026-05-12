import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const methodBadge = (m) => {
  const cls = m === 'BOB Transfer' ? 'badge-bob' : m === 'Cash' ? 'badge-cash' : m === 'UPI' ? 'badge-upi' : 'badge-other';
  return <span className={`badge ${cls}`}>{m}</span>;
};

export default function TenantHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('rent');

  useEffect(() => {
    API.get(`/tenants/${id}/history`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.message || 'Failed to load history'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <div style={{ color: 'var(--danger)', marginBottom: 16, fontWeight: 600 }}>{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/tenants')}>← Back to Tenants</button>
    </div>
  );

  const { tenant, rentPayments, lightBillEntries, maintenanceEntries = [], stats } = data;
  const joinDate = tenant.joinDate ? new Date(tenant.joinDate) : null;
  const deletedDate = tenant.deletedAt ? new Date(tenant.deletedAt) : null;
  const hasNoHistory = rentPayments.length === 0 && lightBillEntries.length === 0 && maintenanceEntries.length === 0;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/tenants')}
            style={{ padding: '6px 10px' }}
          >
            ← Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="page-title">👤 {tenant.name}</div>
              {tenant.isDeleted && (
                <span style={{
                  background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20, border: '1px solid #fde68a'
                }}>
                  🗂️ Former Tenant
                </span>
              )}
            </div>
            <div className="page-sub">
              {tenant.unitType}{tenant.unitLabel ? ` · ${tenant.unitLabel}` : ''} ·{' '}
              {tenant.isDeleted
                ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    Removed {deletedDate ? deletedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                : <span className={`badge ${tenant.isActive ? 'badge-cash' : 'badge-other'}`} style={{ fontSize: 10 }}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Monthly Rent</div>
          <div className="stat-value neutral">Rs.{fmt(tenant.monthlyRent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Rent Paid</div>
          <div className="stat-value income">Rs.{fmt(stats.totalRentPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Maintenance</div>
          <div className="stat-value neutral">Rs.{fmt(stats.totalMaintenancePaid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value neutral" style={{ color: 'var(--primary)', borderBottom: '3px solid var(--primary)' }}>Rs.{fmt(stats.totalPaid)}</div>
        </div>
      </div>

      {/* ── Tenant Info Card ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📋 Tenant Information</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px 20px' }}>
          <InfoRow icon="🏠" label="Unit Type" value={`${tenant.unitType}${tenant.unitLabel ? ` (${tenant.unitLabel})` : ''}`} />
          <InfoRow icon="📞" label="Phone" value={tenant.phone || '—'} />
          <InfoRow icon="💳" label="Payment Method" value={null} badge={methodBadge(tenant.paymentMethod)} />
          <InfoRow icon="📅" label="Joined" value={joinDate ? joinDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          {tenant.isDeleted && deletedDate && (
            <InfoRow icon="🗂️" label="Removed On" value={deletedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
          <InfoRow icon="🧾" label="Rent Payments" value={`${stats.rentPaymentsCount} records`} />
          <InfoRow icon="⚡" label="Light Bill Records" value={`${lightBillEntries.length} months`} />
          <InfoRow icon="🛠️" label="Maintenance" value={`${maintenanceEntries.length} months`} />
        </div>
      </div>

      {/* ── No History Empty State ── */}
      {hasNoHistory ? (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border)',
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>📭</div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: 'var(--primary)',
            marginBottom: 8, letterSpacing: '-0.3px'
          }}>
            Oops! No History Present
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto 20px' }}>
            No rent payments or light bill records have been recorded for <strong>{tenant.name}</strong> yet.
            Payments you add will appear here automatically.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/rent')}>
              💰 Record Rent Payment
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/lightbill')}>
              ⚡ Add Light Bill
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/maintenance')}>
              🛠️ Add Maintenance
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--border)' }}>
            <TabBtn active={activeTab === 'rent'} onClick={() => setActiveTab('rent')}>
              💰 Rent Payments ({rentPayments.length})
            </TabBtn>
            <TabBtn active={activeTab === 'light'} onClick={() => setActiveTab('light')}>
              ⚡ Light Bills ({lightBillEntries.length})
            </TabBtn>
            <TabBtn active={activeTab === 'maint'} onClick={() => setActiveTab('maint')}>
              🛠️ Maintenance ({maintenanceEntries.length})
            </TabBtn>
          </div>

          {/* ── Rent Payments Tab ── */}
          {activeTab === 'rent' && (
            <div className="card">
              {rentPayments.length === 0 ? (
                <TabEmpty icon="💰" text="No rent payments recorded for this tenant" />
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Month / Year</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentPayments.map(r => (
                          <tr key={r._id}>
                            <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{MONTHS[r.month - 1]} {r.year}</td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>Rs.{fmt(r.amount)}</td>
                            <td>{methodBadge(r.paymentMethod)}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}><strong>Total</strong></td>
                          <td colSpan={3} style={{ color: 'var(--success)' }}>
                            Rs.{fmt(stats.totalRentPaid)} ({stats.rentPaymentsCount} payments)
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mobile-list">
                    {rentPayments.map(r => (
                      <div key={r._id} className="mobile-card">
                        <div className="mobile-card-header">
                          <div>
                            <div className="mobile-card-name">{MONTHS[r.month - 1]} {r.year}</div>
                            <div className="mobile-card-meta">
                              <span>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              {methodBadge(r.paymentMethod)}
                            </div>
                          </div>
                          <div className="mobile-card-amount" style={{ color: 'var(--success)' }}>
                            Rs.{fmt(r.amount)}
                          </div>
                        </div>
                        {r.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📝 {r.notes}</div>}
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', padding: '8px 4px', borderTop: '2px solid var(--border)', marginTop: 4 }}>
                      Total: Rs.{fmt(stats.totalRentPaid)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Light Bills Tab ── */}
          {activeTab === 'light' && (
            <div className="card">
              {lightBillEntries.length === 0 ? (
                <TabEmpty icon="⚡" text="No light bill records found for this tenant" />
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Month / Year</th>
                          <th>Unit Label</th>
                          <th>Prev Reading</th>
                          <th>Curr Reading</th>
                          <th>Units Used</th>
                          <th>Rate/Unit</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lightBillEntries.map((e, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{MONTHS[e.month - 1]} {e.year}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{e.unitLabel || '—'}</td>
                            <td>{e.previousReading}</td>
                            <td>{e.currentReading}</td>
                            <td style={{ fontWeight: 600 }}>{e.unitsConsumed} u</td>
                            <td style={{ color: 'var(--text-muted)' }}>Rs.{e.ratePerUnit}/u</td>
                            <td style={{ fontWeight: 700, color: 'var(--danger)' }}>Rs.{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={6}><strong>Total</strong></td>
                          <td style={{ color: 'var(--danger)' }}>Rs.{fmt(stats.totalLightBillPaid)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mobile-list">
                    {lightBillEntries.map((e, i) => (
                      <div key={i} className="mobile-card">
                        <div className="mobile-card-header">
                          <div>
                            <div className="mobile-card-name">{MONTHS[e.month - 1]} {e.year}</div>
                            <div className="mobile-card-meta">
                              <span>⚡ {e.unitsConsumed} units @ Rs.{e.ratePerUnit}/u</span>
                              {e.unitLabel && <span>🏷️ {e.unitLabel}</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              Reading: {e.previousReading} → {e.currentReading}
                            </div>
                          </div>
                          <div className="mobile-card-amount" style={{ color: 'var(--danger)' }}>
                            Rs.{fmt(e.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)', padding: '8px 4px', borderTop: '2px solid var(--border)', marginTop: 4 }}>
                      Total: Rs.{fmt(stats.totalLightBillPaid)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Maintenance Tab ── */}
          {activeTab === 'maint' && (
            <div className="card">
              {maintenanceEntries.length === 0 ? (
                <TabEmpty icon="🛠️" text="No maintenance payments recorded" />
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Month / Year</th><th>Notes</th><th>Amount</th></tr></thead>
                      <tbody>
                        {maintenanceEntries.map((e, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{MONTHS[e.month - 1]} {e.year}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{e.notes || '—'}</td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs.{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}><strong>Total Maintenance</strong></td>
                          <td style={{ color: 'var(--primary)' }}>Rs.{fmt(stats.totalMaintenancePaid)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mobile-list">
                    {maintenanceEntries.map((e, i) => (
                      <div key={i} className="mobile-card">
                        <div className="mobile-card-header">
                          <div><div className="mobile-card-name">{MONTHS[e.month - 1]} {e.year}</div><div className="mobile-card-meta">{e.notes || 'Monthly Maintenance'}</div></div>
                          <div className="mobile-card-amount">Rs.{fmt(e.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Helpers ── */
function InfoRow({ icon, label, value, badge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
        {badge || value}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        border: 'none',
        background: 'none',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
        marginBottom: -2,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function TabEmpty({ icon, text }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      {text}
    </div>
  );
}
