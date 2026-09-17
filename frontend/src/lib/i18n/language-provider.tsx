"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language } from "./translations";

type TranslateParams = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "fintrack-language";

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "fr";
}

function detectDefaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function getByPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined),
      source
    );
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    params[key] !== undefined ? String(params[key]) : match
  );
}

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setLanguage(isLanguage(stored) ? stored : detectDefaultLanguage());
    } catch {
      setLanguage(detectDefaultLanguage());
    }
  }, [setLanguage]);

  const setLanguageWithPersist = useCallback((next: Language) => {
    setLanguage(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, etc.) — language just won't persist
    }
  }, [setLanguage]);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const template = getByPath(translations[language], key);
      return typeof template === "string" ? interpolate(template, params) : key;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({ language, setLanguage: setLanguageWithPersist, t }),
    [language, setLanguageWithPersist, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
