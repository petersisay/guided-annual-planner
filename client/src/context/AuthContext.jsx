import React, { createContext, useContext, useState, useEffect } from 'react';
import { handleUserLogout } from '../utils/localStorageBackup.js';
import { syncManager } from '../services/syncManager.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const clearError = () => setError(null);

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    syncManager.initialize();
    syncManager.setActiveUser(user?.id || null);
    const unsub = syncManager.onQueueChange((count) => {
      setPendingSyncCount(count);
    });
    return () => unsub();
  }, [user]);

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg = data.error?.message || 'Google authentication failed';
        setError(errMsg);
        return false;
      }

      setUser(data.user);
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error during Google sign-in';
      setError(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginDev = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Dev login failed');
        return false;
      }

      setUser(data.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev login error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const currentUserId = user?.id;
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
      });
      handleUserLogout(currentUserId);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      handleUserLogout(user?.id);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        pendingSyncCount,
        loginWithGoogle,
        loginDev,
        logout,
        refreshUser,
        updateUser,
        clearError,
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
