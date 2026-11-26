import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      fetchUnreadCount();
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoUsers = async () => {
    try {
      const res = await api.getDemoUsers();
      setDemoUsers(res.demo_users || []);
    } catch (err) {
      console.error('Failed to load demo personas', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchDemoUsers();
  }, []);

  const switchDemoUser = async (userId) => {
    setLoading(true);
    try {
      const res = await api.switchDemo(userId);
      setAuthToken(res.token);
      setUser(res.user);
      await fetchUnreadCount();
      return res.user;
    } catch (err) {
      console.error('Error switching demo user', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.token);
      setUser(res.user);
      await fetchUnreadCount();
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setAuthToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoUsers,
        unreadCount,
        refreshUser: fetchCurrentUser,
        refreshNotifications: fetchUnreadCount,
        switchDemoUser,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
