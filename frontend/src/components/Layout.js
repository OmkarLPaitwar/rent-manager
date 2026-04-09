import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tenants', icon: '👥', label: 'Tenants' },
  { to: '/rent', icon: '💰', label: 'Rent' },
  { to: '/expenses', icon: '📋', label: 'Expenses' },
  { to: '/lightbill', icon: '💡', label: 'Light Bill' },
  { to: '/summary', icon: '📄', label: 'Summary' },
  { to: '/yearly', icon: '📈', label: 'Yearly' },
];

const BOTTOM_MAIN = NAV.slice(0, 4);
const BOTTOM_MORE = NAV.slice(4);

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const doLogout = () => {
    logout();
    navigate('/auth'); // fixed route
  };

  const initials =
    user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const isMoreActive = BOTTOM_MORE.some(n => location.pathname === n.to);

  const pageTitle =
    NAV.find(n => n.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-layout">

      {/* 🔝 MOBILE TOPBAR */}
      <div className="mobile-topbar">
        <img
          src="/logo.png"
          alt="Logo"
          onClick={() => setSidebarOpen(true)}
          style={{ cursor: 'pointer', width: '35px' }}
        />
        <span className="mobile-topbar-title">{pageTitle}</span>
        <div
          className="mobile-topbar-user"
          onClick={() => setSidebarOpen(true)}
        >
          {initials}
        </div>
      </div>

      {/* 🟦 SIDEBAR OVERLAY */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 📂 SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <div>
            <h1>Rent Manager</h1>
            <p>Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav" onClick={() => setSidebarOpen(false)}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
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

          <button className="btn" onClick={doLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT */}
      <main className="main-content">
        {children}
      </main>

      {/* 📱 BOTTOM NAV */}
      <nav className="bottom-nav">
        {BOTTOM_MAIN.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span>{n.icon}</span>
            <small>{n.label}</small>
          </NavLink>
        ))}

        <button
          className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          ⋯
        </button>
      </nav>

      {/* 📤 MORE DRAWER */}
      {moreOpen && (
        <div
          className="overlay"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <div className={`more-drawer ${moreOpen ? 'open' : ''}`}>
        {BOTTOM_MORE.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            onClick={() => setMoreOpen(false)}
          >
            {n.icon} {n.label}
          </NavLink>
        ))}

        <button onClick={doLogout}>🚪 Logout</button>
      </div>
    </div>
  );
}