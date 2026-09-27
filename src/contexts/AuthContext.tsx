import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem('lc_user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const login = useCallback((u: User, token?: string) => {
    setUser(u);
    localStorage.setItem('lc_user', JSON.stringify(u));
    if (token) localStorage.setItem('lc_token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lc_user');
    localStorage.removeItem('lc_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, isDemoMode: DEMO_MODE }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'visitor': return '/visitor';
    case 'organizer': return '/organizer';
    case 'partner': return '/partner';
    case 'admin': return '/admin';
    default: return '/login';
  }
}
