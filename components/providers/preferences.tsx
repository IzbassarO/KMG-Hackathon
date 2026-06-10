"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { translate, type Locale } from "@/lib/i18n";

type Theme = "light" | "dark";

interface PreferencesValue {
  locale: Locale;
  theme: Theme;
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);
const LOCALE_KEY = "kmg.locale";
const THEME_KEY = "kmg.theme";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");
  const [theme, setThemeState] = useState<Theme>("light");

  // Загружаем сохранённые предпочтения (только на клиенте, чтобы не было mismatch).
  useEffect(() => {
    const l = window.localStorage.getItem(LOCALE_KEY);
    if (l === "ru" || l === "kk" || l === "en") setLocaleState(l);
    const th = window.localStorage.getItem(THEME_KEY);
    if (th === "dark" || th === "light") setThemeState(th);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(LOCALE_KEY, l);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem(THEME_KEY, t);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return (
    <PreferencesContext.Provider value={{ locale, theme, setLocale, setTheme, toggleTheme, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}

export function useT() {
  return usePreferences().t;
}
