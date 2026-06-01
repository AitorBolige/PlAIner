"use client";

import * as React from "react";

import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  getStoredCurrency,
  normalizeCurrency,
  setStoredCurrency,
} from "./currency";

/** Currency synced to localStorage + cookies; updates across tabs and in-app. */
export function useCurrency(): [string, (c: string) => void] {
  const [currency, setCurrencyState] = React.useState(DEFAULT_CURRENCY);

  React.useEffect(() => {
    setCurrencyState(getStoredCurrency());

    const onStorage = (e: StorageEvent) => {
      if (e.key === CURRENCY_STORAGE_KEY && e.newValue) {
        setCurrencyState(normalizeCurrency(e.newValue));
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCurrencyState(normalizeCurrency(detail));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pl-currency-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pl-currency-change", onCustom);
    };
  }, []);

  const setCurrency = React.useCallback((next: string) => {
    const normalized = normalizeCurrency(next);
    setCurrencyState(normalized);
    setStoredCurrency(normalized);
  }, []);

  return [currency, setCurrency];
}
