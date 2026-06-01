export const CURRENCY_STORAGE_KEY = "pl-currency";
export const DEFAULT_CURRENCY = "EUR";

/** Approximate FX rates: units of foreign currency → EUR (1 USD ≈ 0.92 EUR). */
export const EUR_RATES: Record<string, number> = {
  EUR: 1,
  DKK: 1 / 7.46,
  SEK: 1 / 10.55,
  NOK: 1 / 11.75,
  GBP: 1.18,
  USD: 0.92,
  CHF: 1.06,
  PLN: 1 / 4.27,
  CZK: 1 / 25.3,
  HUF: 1 / 390,
  RON: 1 / 4.97,
  TRY: 1 / 36,
  JPY: 1 / 163,
  AUD: 0.61,
  CAD: 0.68,
  SGD: 0.7,
  MXN: 1 / 20,
  BRL: 1 / 6,
  ISK: 1 / 150,
  CNY: 1 / 7.8,
  INR: 1 / 90,
};

export function normalizeCurrency(code: string | undefined | null): string {
  const c = String(code || DEFAULT_CURRENCY)
    .toUpperCase()
    .trim()
    .slice(0, 3);
  return c || DEFAULT_CURRENCY;
}

export function toEur(amount: number, currency: string): number {
  const rate = EUR_RATES[normalizeCurrency(currency)];
  if (!rate) return Math.round(amount);
  return Math.round(amount * rate);
}

export function fromEur(amountEur: number, currency: string): number {
  const target = normalizeCurrency(currency);
  if (target === "EUR") return Math.round(amountEur);
  const rate = EUR_RATES[target];
  if (!rate) return Math.round(amountEur);
  return Math.round(amountEur / rate);
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  if (from === to) return Math.round(amount);
  return fromEur(toEur(amount, from), to);
}

/** Format an amount stored in `sourceCurrency` using the user's display currency. */
export function formatPriceDisplay(
  amount: number,
  userCurrency: string,
  locale = "es-ES",
  sourceCurrency = "EUR",
): string {
  return formatMoney(
    convertCurrency(amount, sourceCurrency, userCurrency),
    userCurrency,
    locale,
  );
}

export function formatMoney(
  value: number,
  currency: string,
  locale = "es-ES",
): string {
  const code = locale === "en" || locale === "en-US" ? "en-US" : "es-ES";
  return new Intl.NumberFormat(code, {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStoredCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored) return normalizeCurrency(stored);
  } catch {
    /* noop */
  }
  return DEFAULT_CURRENCY;
}

export function setStoredCurrency(next: string): void {
  const normalized = normalizeCurrency(next);
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
    document.cookie = `${CURRENCY_STORAGE_KEY}=${normalized};path=/;max-age=31536000`;
    window.dispatchEvent(
      new CustomEvent("pl-currency-change", { detail: normalized }),
    );
  } catch {
    /* noop */
  }
}
