import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currency: string;
  setCurrency: (c: string) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('finflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('finflow_currency') || '$';
  });

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('finflow_currency', c);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('finflow_user', JSON.stringify(res.data.user));
      }
    } catch {
      // If profile fetch fails (e.g. token expired), reset
      setUser(null);
      api.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('finflow_access_token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.success && res.data) {
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      localStorage.setItem('finflow_user', JSON.stringify(res.data.user));
    }
  };

  const register = async (credentials: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await api.register(credentials);
    if (res.success && res.data) {
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      localStorage.setItem('finflow_user', JSON.stringify(res.data.user));
    }
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  const formatCurrency = (amount: number): string => {
    const formattedNum = Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency}${formattedNum}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currency,
        setCurrency,
        login,
        register,
        logout,
        refreshUser,
        formatCurrency,
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
