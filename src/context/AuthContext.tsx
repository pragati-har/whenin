'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'loading'; payload: boolean }
  | { type: 'setUser'; payload: AuthUser | null }
  | { type: 'error'; payload: string | null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: action.payload };
    case 'setUser':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'error':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refresh = useCallback(async () => {
    try {
      dispatch({ type: 'loading', payload: true });
      const result = await apiFetch<{ success: boolean; user?: AuthUser }>('/api/auth/me');
      dispatch({ type: 'setUser', payload: result.user || null });
    } catch {
      dispatch({ type: 'setUser', payload: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ success: boolean; user?: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    dispatch({ type: 'setUser', payload: result.user || null });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await apiFetch<{ success: boolean; user?: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    dispatch({ type: 'setUser', payload: result.user || null });
  }, []);

  const logout = useCallback(async () => {
    await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    dispatch({ type: 'setUser', payload: null });
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout, refresh }),
    [state, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
