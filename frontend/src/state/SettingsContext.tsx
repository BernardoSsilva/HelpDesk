import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AppSettings = {
  systemName: string;
  supportEmail: string;
  emailNotifications: boolean;
  allowClosedComments: boolean;
};

const STORAGE_KEY = "helpdesk_settings";

export const defaultSettings: AppSettings = {
  systemName: "Help Desk",
  supportEmail: "suporte@empresa.com",
  emailNotifications: true,
  allowClosedComments: true,
};

type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (next: AppSettings) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

/** Preferências guardadas neste navegador; usadas pela interface (nome do sistema, comentários em tickets fechados...). */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readStoredSettings);

  const saveSettings = useCallback((next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Armazenamento indisponível (modo privado, cota cheia): a preferência vale só nesta sessão.
    }

    setSettings(next);
  }, []);

  const value = useMemo(() => ({ settings, saveSettings }), [settings, saveSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  }

  return context;
}
