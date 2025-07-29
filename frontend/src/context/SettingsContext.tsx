import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsApi } from "@/lib/api";

type Theme = "dark" | "light" | "system";

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  buffer: number;
  setBuffer: (buffer: number) => void;
  canadaHours: number;
  setCanadaHours: (hours: number) => void;
  brazilHours: number;
  setBrazilHours: (hours: number) => void;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });

  const [buffer, setBuffer] = useState(10);
  const [canadaHours, setCanadaHours] = useState(37.5);
  const [brazilHours, setBrazilHours] = useState(44);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await settingsApi.getAll();
        
        setBuffer(Number(data.buffer));
        setCanadaHours(Number(data.canadaHours));
        setBrazilHours(Number(data.brazilHours));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        console.error('Error loading settings:', err);
        // Don't fail the entire app if settings fail to load
        // Use default values instead
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Save settings to API when they change
  useEffect(() => {
    const saveSettings = async () => {
      if (!loading) { // Don't save during initial load
        try {
          await settingsApi.update({
            buffer,
            canadaHours,
            brazilHours
          });
        } catch (err) {
          console.error('Error saving settings:', err);
        }
      }
    };

    saveSettings();
  }, [buffer, canadaHours, brazilHours, loading]);

  const value: SettingsContextType = {
    theme,
    setTheme,
    buffer,
    setBuffer,
    canadaHours,
    setCanadaHours,
    brazilHours,
    setBrazilHours,
    loading,
    error
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 