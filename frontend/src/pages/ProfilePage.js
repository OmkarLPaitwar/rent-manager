import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../utils/api';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', propertyName: user?.propertyName || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMode, setPwMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSave = async e => {
    e.preventDefault();
    if (!form.name.trim()) { show('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      await updateProfile({ name: form.name, propertyName: form.propertyName });
      show('✅ Profile updated!');
      setEditMode(false);
    } catch { show('❌ Failed to update', 'error'); }
    setSaving(false);
  };

  const handlePwSave = async e => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { show('Password must be at least 6 characters', 'error'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { show('Passwords do not match', 'error'); return; }
    setPwSaving(true);
    try {
      await API.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      show('✅ Password changed!');
      setPwMode(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      show('❌ ' + (err.response?.data?.message || 'Failed'), 'error');
    }
    setPwSaving(false);
  };

  const doLogout = () => { logout(); navigate('/'); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👤 My Profile</div>
          <div className="page-sub">Manage your account details</div>
        </div>
      </div>

      {/* ── PROFILE CARD ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 24, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(30,58,110,0.3)'
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>🏠 {user?.propertyName || 'My Property'}</div>
          </div>
        </div>

        {/* Info rows */}
        {!editMode ? (
          <>
            {[
              ['Full Name', user?.name, '👤'],
              ['Email', user?.email, '📧'],
              ['Property Name', user?.propertyName || '—', '🏠'],
            ].map(([label, value, icon]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{icon} {label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPwMode(m => !m)}>🔑 Change Password</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Property Name</label>
              <input className="form-control" value={form.propertyName} onChange={e => setForm(f => ({ ...f, propertyName: e.target.value }))} placeholder="e.g. Shri Ram Apartments" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Email cannot be changed. Contact support if needed.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setEditMode(false); setForm({ name: user?.name, propertyName: user?.propertyName }); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Changes'}</button>
            </div>
          </form>
        )}
      </div>

      {/* ── CHANGE PASSWORD ── */}
      {pwMode && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>🔑 Change Password</div>
          <form onSubmit={handlePwSave}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password * (min 6 chars)</label>
              <input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input className="form-control" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPwMode(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={pwSaving}>{pwSaving ? '⏳ Saving...' : '🔑 Update Password'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── APP INFO ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>📱 App Info</div>
        {[
          ['App Version', 'v4.0 — Fully Responsive'],
          ['Platform', 'Rent & Expense Manager'],
          ['Built for', 'Indian Property Owners'],
          ['Support', 'Use Contact form on homepage'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="card" style={{ border: '1px solid #fca5a5', background: '#fef2f2', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>⚠️ Account Actions</div>
        <button
          className="btn btn-danger"
          style={{ width: '100%' }}
          onClick={() => { if (window.confirm('Are you sure you want to logout?')) doLogout(); }}
        >
          🚪 Logout from Account
        </button>
      </div>
    </div>
  );
}
