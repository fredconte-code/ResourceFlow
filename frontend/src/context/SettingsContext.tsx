import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  buffer: number;
  setBuffer: (value: number) => void;
  canadaHours: number;
  setCanadaHours: (value: number) => void;
  brazilHours: number;
  setBrazilHours: (value: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Theme
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Buffer and weekly hours
  const [buffer, setBuffer] = useState<number>(() => {
    const stored = localStorage.getItem("buffer");
    return stored ? Number(stored) : 20;
  });
  const [canadaHours, setCanadaHours] = useState<number>(() => {
    const stored = localStorage.getItem("canadaHours");
    return stored ? Number(stored) : 37.5;
  });
  const [brazilHours, setBrazilHours] = useState<number>(() => {
    const stored = localStorage.getItem("brazilHours");
    return stored ? Number(stored) : 44;
  });

  useEffect(() => { localStorage.setItem("buffer", String(buffer)); }, [buffer]);
  useEffect(() => { localStorage.setItem("canadaHours", String(canadaHours)); }, [canadaHours]);
  useEffect(() => { localStorage.setItem("brazilHours", String(brazilHours)); }, [brazilHours]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, buffer, setBuffer, canadaHours, setCanadaHours, brazilHours, setBrazilHours }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}; 