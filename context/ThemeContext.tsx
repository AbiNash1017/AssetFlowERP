"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { THEME_MODES, DEFAULT_THEME, type ThemeMode, THEME_STORAGE_KEY } from "@/lib/constants/theme";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with the default (light) theme to align with server SSR
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage only after mounting on the client to avoid SSR hydration mismatch
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
      setThemeState(savedTheme);
      // Synchronously apply the class during mount
      if (savedTheme === THEME_MODES.DARK) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    if (newTheme === THEME_MODES.DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    setTheme(nextTheme);
  };

  // Avoid layout shifting or class mismatch issues by waiting for mount
  // or rendering the provider immediately while managing the class on the html element.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
