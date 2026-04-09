import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import RentPayments from './pages/RentPayments';
import Expenses from './pages/Expenses';
import LightBill from './pages/LightBill';
import MonthlySummary from './pages/MonthlySummary';
import YearlyReport from './pages/YearlyReport';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/auth" />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  // If logged in and visiting /auth, go to dashboard
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Landing page — always public, no redirect even if logged in */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            {/* App routes — protected */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tenants" element={<PrivateRoute><Tenants /></PrivateRoute>} />
            <Route path="/rent" element={<PrivateRoute><RentPayments /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
            <Route path="/lightbill" element={<PrivateRoute><LightBill /></PrivateRoute>} />
            <Route path="/summary" element={<PrivateRoute><MonthlySummary /></PrivateRoute>} />
            <Route path="/yearly" element={<PrivateRoute><YearlyReport /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
