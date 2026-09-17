"use client";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const next = language === "en" ? "fr" : "en";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={language === "en" ? "Switch to French" : "Passer en anglais"}
      onClick={() => setLanguage(next)}
    >
      {next.toUpperCase()}
    </Button>
  );
}
