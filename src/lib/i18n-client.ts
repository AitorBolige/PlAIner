"use client";

import * as React from "react";
import { type Locale, type Translations, readLocale, getTranslations } from "./i18n";

/**
 * React hook that reads the locale once on mount and returns both
 * the locale code and the full translations dictionary.
 */
export function useLocale(initial?: Locale): { locale: Locale; t: Translations } {
  const [locale, setLocale] = React.useState<Locale>(initial || "ca");

  React.useEffect(() => {
    const l = readLocale();
    setLocale(l);
    try {
      document.cookie = `pl-lang=${l};path=/;max-age=31536000`;
    } catch {
      /* noop */
    }
  }, []);

  return { locale, t: getTranslations(locale) };
}
