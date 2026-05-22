import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

interface AuthUser {
  id: number;
  name: string;
  lastName: string;
  companyName: string;
  email: string;
  image?: string | null;
  parentUserId?: number | null;
  isActive: boolean;
  isMainAccount?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: Record<string, unknown>) => Promise<AuthUser>;
  updateUser: (userData: AuthUser | null, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await api.login({ email, password });
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data: Record<string, unknown>) => {
    const { user, token } = await api.register(data);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  }, []);

  const updateUser = useCallback((userData: AuthUser | null, token?: string) => {
    if (token) localStorage.setItem('token', token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
