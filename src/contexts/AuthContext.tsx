import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { signOutAdmin, verifyAdminAccess } from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const evaluateUser = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setUser(nextUser);
    const allowed = await verifyAdminAccess(nextUser.id);
    setIsAdmin(allowed);
    setLoading(false);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase.auth.getUser();
    await evaluateUser(data.user ?? null);
  }, [evaluateUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      void evaluateUser(data.session?.user ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        void evaluateUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [evaluateUser]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await signOutAdmin();
    }
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
