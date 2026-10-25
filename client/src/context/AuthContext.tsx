import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AuthResponse, ApiErrorResponse } from '@planner/shared';
import { handleUserLogout } from '../utils/localStorageBackup';
import { syncManager } from '../services/syncManager';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  pendingSyncCount: number;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginDev: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const clearError = () => setError(null);

  const updateUser = (updatedFields: Partial<UserProfile>) => {
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
        const data: AuthResponse = await res.json();
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

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
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

      const data: AuthResponse | ApiErrorResponse = await res.json();

      if (!res.ok || !data.success) {
        const errMsg =
          'error' in data ? data.error.message : 'Google authentication failed';
        setError(errMsg);
        return false;
      }

      setUser((data as AuthResponse).user);
      return true;
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Network error during Google sign-in';
      setError(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginDev = async (): Promise<boolean> => {
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
    } catch (err: unknown) {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
