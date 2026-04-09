import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tenants',   icon: '👥', label: 'Tenants' },
  { to: '/rent',      icon: '💰', label: 'Rent' },
  { to: '/expenses',  icon: '📋', label: 'Expenses' },
  { to: '/lightbill', icon: '💡', label: 'Light Bill' },
  { to: '/summary',   icon: '📄', label: 'Summary' },
  { to: '/yearly',    icon: '📈', label: 'Yearly' },
];

// Bottom nav shows 4 items + "More" button
const BOTTOM_MAIN = NAV.slice(0, 4);
const BOTTOM_MORE = NAV.slice(4);

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const doLogout = () => { logout(); navigate('/'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const isMoreActive = BOTTOM_MORE.some(n => location.pathname === n.to);

  const pageTitle = NAV.find(n => n.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-layout">

      {/* ── MOBILE TOPBAR ── */}
      <div className="mobile-topbar">
        <img src="/logo.png" alt="Logo" onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer' }} />
        <span className="mobile-topbar-title">{pageTitle}</span>
        <div className="mobile-topbar-user" onClick={() => setSidebarOpen(true)}>{initials}</div>
      </div>

      {/* ── SIDEBAR OVERLAY ── */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Rent Manager Logo" />
          <div className="sidebar-logo-text">
            <h1>Rent & Expense<br />Manager</h1>
            <p>Property Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav" onClick={() => setSidebarOpen(false)}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="icon">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-prop">{user?.propertyName}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={doLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {children}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {BOTTOM_MAIN.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="bn-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
          <button
            className={`bottom-nav-item${isMoreActive ? ' active' : ''}`}
            onClick={() => setMoreOpen(o => !o)}
          >
            <span className="bn-icon">⋯</span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── MORE DRAWER ── */}
      {moreOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 249 }} onClick={() => setMoreOpen(false)} />
      )}
      <div className={`more-drawer ${moreOpen ? 'open' : ''}`}>
        <div className="more-drawer-handle" />
        <div className="more-drawer-grid">
          {BOTTOM_MORE.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `more-drawer-item${isActive ? ' active' : ''}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="md-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
          <button
            className="more-drawer-item"
            onClick={doLogout}
            style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#c0392b' }}
          >
            <span className="md-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

    </div>
  );
}
