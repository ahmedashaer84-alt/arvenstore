import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchStoreSettings } from '../services/settings';
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from '../types/database';

interface SettingsContextValue {
  settings: StoreSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  setSettingsLocal: (next: StoreSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchStoreSettings();
      setSettings(data);
    } catch {
      // Retain graceful default branding if store_settings table hasn't been migrated yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const setSettingsLocal = useCallback((next: StoreSettings) => {
    setSettings(next);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, loading, refreshSettings, setSettingsLocal }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
