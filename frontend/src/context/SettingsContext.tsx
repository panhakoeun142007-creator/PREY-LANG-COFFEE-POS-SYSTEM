import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS } from "../constants/defaultSettings";
import { fetchSettings, type AppSettings } from "../services/api";

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  setSettings: (next: AppSettings) => void;
  currency: string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchSettings();
      setSettings(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const currency = settings?.payment?.currency || "USD";

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
      setSettings,
      currency,
    }),
    [currency, error, isLoading, refreshSettings, settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
