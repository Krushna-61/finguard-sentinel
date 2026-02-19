'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // Rehydrate token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newToken);
    }
  };

  const logout = () => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
