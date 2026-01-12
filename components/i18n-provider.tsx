"use client";

import * as React from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<SupportedLanguage>("en");
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage after mount
  React.useEffect(() => {
    const stored = localStorage.getItem("desk-tools-lang") as SupportedLanguage;
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      setLanguageState(stored);
      i18n.changeLanguage(stored);
    } else {
      // Use browser language if available
      const browserLang = navigator.language.split("-")[0] as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        setLanguageState(browserLang);
        i18n.changeLanguage(browserLang);
      }
    }
    setMounted(true);
  }, []);

  // Update html lang attribute when language changes
  React.useEffect(() => {
    if (mounted) {
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const setLanguage = React.useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("desk-tools-lang", lang);
    document.documentElement.lang = lang;
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within I18nProvider");
  }
  return context;
}
