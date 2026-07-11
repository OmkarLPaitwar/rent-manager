import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Loader from './components/Loader';
import LandingPage    from './pages/LandingPage';
import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import Tenants        from './pages/Tenants';
import TenantHistory  from './pages/TenantHistory';
import RentPayments   from './pages/RentPayments';
import Expenses       from './pages/Expenses';
import LightBill      from './pages/LightBill';
import MonthlySummary from './pages/MonthlySummary';
import YearlyReport   from './pages/YearlyReport';
import Maintenance    from './pages/Maintenance';
import ProfilePage    from './pages/ProfilePage';
import ResetPassword  from './pages/ResetPassword';
import PinLockPage    from './pages/PinLockPage';
import { isStandaloneMode } from './utils/pwa';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader message="Securing your session..." /></div>;
  if (!user) return <Navigate to="/auth" />;
  if (isStandaloneMode() && !sessionStorage.getItem('pinVerified')) {
    return <Navigate to="/pin-lock" />;
  }
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader message="Securing your session..." /></div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader message="Securing your session..." /></div>;
  if (user && isStandaloneMode() && !sessionStorage.getItem('pinVerified')) {
    return <Navigate to="/pin-lock" />;
  }
  if (user) return <Navigate to="/dashboard" />;
  return <LandingPage />;
}

function PinRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader message="Securing your session..." /></div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isStandaloneMode() || sessionStorage.getItem('pinVerified')) {
    return <Navigate to="/dashboard" />;
  }
  return <PinLockPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/"          element={<LandingRoute />} />
            <Route path="/auth"      element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/pin-lock"  element={<PinRoute />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tenants"   element={<PrivateRoute><Tenants /></PrivateRoute>} />
            <Route path="/tenants/:id" element={<PrivateRoute><TenantHistory /></PrivateRoute>} />
            <Route path="/rent"      element={<PrivateRoute><RentPayments /></PrivateRoute>} />
            <Route path="/expenses"  element={<PrivateRoute><Expenses /></PrivateRoute>} />
            <Route path="/lightbill" element={<PrivateRoute><LightBill /></PrivateRoute>} />
            <Route path="/maintenance" element={<PrivateRoute><Maintenance /></PrivateRoute>} />
            <Route path="/summary"   element={<PrivateRoute><MonthlySummary /></PrivateRoute>} />
            <Route path="/yearly"    element={<PrivateRoute><YearlyReport /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="*"          element={<Navigate to="/" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
