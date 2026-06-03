"use client";

import * as React from "react";

import { convertCurrency, formatMoney } from "./currency";
import { useLocale } from "./i18n-client";
import { useCurrency } from "./use-currency";

/** Format amounts in the user's selected currency (stored costs default to EUR). */
export function useDisplayMoney(): (
  amount: number,
  sourceCurrency?: string,
) => string {
  const { locale } = useLocale();
  const [currency] = useCurrency();

  return React.useCallback(
    (amount: number, sourceCurrency = "EUR") =>
      formatMoney(
        convertCurrency(amount, sourceCurrency, currency),
        currency,
        locale,
      ),
    [currency, locale],
  );
}
