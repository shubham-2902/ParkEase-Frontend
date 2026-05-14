import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import {
  TOKEN_KEY,
  REFRESH_KEY,
  USER_KEY,
  ROLES,
} from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';

// ── Create Context ─────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────
  const [user,          setUser]          = useState(null);
  const [token,         setToken]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [authError,     setAuthError]     = useState(null);

  // ── Initialize from localStorage on mount ─────────────────────
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser  = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        // Corrupt storage — clear it
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // OAuth2 callback is handled exclusively by OAuthCallbackPage.jsx
  // to ensure full profile data is captured from URL parameters.

  // ── Store auth in state + localStorage ────────────────────────
  const storeAuth = useCallback((accessToken, userData, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    setToken(accessToken);
    setUser(userData);
  }, []);

  // ── Clear auth ────────────────────────────────────────────────
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  // ── Navigate based on role ────────────────────────────────────
  const navigateToDashboard = useCallback((role) => {
    switch (role) {
      case ROLES.DRIVER:  navigate('/driver/dashboard');  break;
      case ROLES.MANAGER: navigate('/manager/dashboard'); break;
      case ROLES.ADMIN:   navigate('/admin/dashboard');   break;
      default:            navigate('/');
    }
  }, [navigate]);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      storeAuth(accessToken, userData, refreshToken);
      navigateToDashboard(userData.role);

      return { success: true };

    } catch (err) {
      const message = getErrorMessage(err);
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [storeAuth, navigateToDashboard]);

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    setAuthError(null);
    setLoading(true);

    try {
      const response = await authApi.register(data);
      const { accessToken, refreshToken, user: userData } = response.data;

      storeAuth(accessToken, userData, refreshToken);
      navigateToDashboard(userData.role);

      return { success: true };

    } catch (err) {
      const message = getErrorMessage(err);
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [storeAuth, navigateToDashboard]);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  // ── Update user in state (after profile update) ───────────────
  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Role helpers ──────────────────────────────────────────────
  const isDriver  = user?.role === ROLES.DRIVER;
  const isManager = user?.role === ROLES.MANAGER;
  const isAdmin   = user?.role === ROLES.ADMIN;
  const isLoggedIn = !!token && !!user;

  // ── Context value ─────────────────────────────────────────────
  const value = {
    // State
    user,
    token,
    loading,
    authError,

    // Actions
    login,
    register,
    logout,
    storeAuth,
    updateUser,
    setAuthError,

    // Helpers
    isLoggedIn,
    isDriver,
    isManager,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook ───────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export default AuthContext;