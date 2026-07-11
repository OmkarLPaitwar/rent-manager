import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, propertyName, pin) => {
    const res = await API.post('/auth/register', { name, email, password, propertyName, pin });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('pinVerified');
    setUser(null);
  };

  const verifyPin = async (pin) => {
    const res = await API.post('/auth/verify-pin', { pin });
    if (res.data.success) {
      sessionStorage.setItem('pinVerified', 'true');
    }
    return res.data;
  };

  const resetPin = async () => {
    const res = await API.post('/auth/reset-pin');
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await API.put('/auth/profile', data);
    setUser(res.data.user);
  };

  const forgotPassword = async (email) => {
    const res = await API.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await API.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, forgotPassword, resetPassword, verifyPin, resetPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
