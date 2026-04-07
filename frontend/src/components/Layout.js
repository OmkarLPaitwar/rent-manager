import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tenants', icon: '👥', label: 'Tenants' },
  { to: '/rent', icon: '💰', label: 'Rent Payments' },
  { to: '/expenses', icon: '📋', label: 'Expenses' },
  { to: '/lightbill', icon: '💡', label: 'Light Bill' },
  { to: '/summary', icon: '📄', label: 'Monthly Summary' },
  { to: '/yearly', icon: '📈', label: 'Yearly Report' },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => { logout(); navigate('/auth'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      <button className="hamburger" onClick={() => setOpen(true)}>☰</button>
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🏠 Rent & Expense<br />Manager</h1>
          <p>Property Dashboard</p>
        </div>

        <nav className="sidebar-nav" onClick={() => setOpen(false)}>
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
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={doLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}