"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/components/i18n-provider";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, SupportedLanguage } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation("navigation");
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Globe className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("changeLanguage")}
        title={t("changeLanguage")}
      >
        <Globe className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang as SupportedLanguage);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm rounded-sm hover:bg-accent transition-colors ${
                language === lang ? "bg-accent font-medium" : ""
              }`}
            >
              {LANGUAGE_NAMES[lang as SupportedLanguage]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
