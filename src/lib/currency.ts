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
  // Popular travel-destination currencies (hotels are priced locally).
  IDR: 1 / 17500,
  THB: 1 / 39,
  VND: 1 / 27000,
  MYR: 1 / 5.0,
  PHP: 1 / 63,
  KRW: 1 / 1450,
  HKD: 1 / 8.5,
  TWD: 1 / 35,
  ZAR: 1 / 20,
  AED: 1 / 4.0,
  SAR: 1 / 4.05,
  QAR: 1 / 4.0,
  EGP: 1 / 53,
  MAD: 1 / 10.8,
  NZD: 0.57,
  ILS: 1 / 4.0,
  COP: 1 / 4400,
  ARS: 1 / 1050,
  CLP: 1 / 1050,
  PEN: 1 / 4.1,
};

/**
 * Map an ISO 3166-1 country code to a sensible display currency. Countries whose
 * local currency we don't have an FX rate for fall back to USD (or EUR for
 * EUR-pegged zones). Defaults to EUR.
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  // Eurozone & EUR-pegged (incl. CFA franc, escudo)
  AD: "EUR", ES: "EUR", DE: "EUR", AT: "EUR", FR: "EUR", BE: "EUR", IT: "EUR",
  SM: "EUR", VA: "EUR", PT: "EUR", LU: "EUR", IE: "EUR", MC: "EUR", GQ: "EUR",
  SN: "EUR", CI: "EUR", CD: "EUR", CM: "EUR", MG: "EUR", CV: "EUR", DZ: "EUR",
  TN: "EUR", AO: "EUR", MZ: "EUR",
  GB: "GBP",
  CH: "CHF", LI: "CHF",
  CA: "CAD", AU: "AUD", NZ: "NZD", ZA: "ZAR", SG: "SGD", PH: "PHP",
  MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", BR: "BRL",
  SA: "SAR", EG: "EGP", MA: "MAD", AE: "AED", QA: "QAR",
  CN: "CNY", TW: "TWD", HK: "HKD", MO: "HKD", IN: "INR", NP: "INR",
  PS: "ILS",
  // Dollar-using / unsupported-local → USD
  US: "USD", VE: "USD", EC: "USD", GT: "USD", CU: "USD", BO: "USD", DO: "USD",
  HN: "USD", PY: "USD", SV: "USD", NI: "USD", CR: "USD", PA: "USD", UY: "USD",
  JM: "USD", TT: "USD", GH: "USD", NG: "USD", KE: "USD", HT: "USD", IQ: "USD",
  JO: "USD", LB: "USD", KW: "USD", BH: "USD", OM: "USD", SY: "USD", LY: "USD",
  SD: "USD", YE: "USD", FJ: "USD",
};

export function currencyForCountry(code: string | undefined | null): string {
  const c = String(code || "").toUpperCase().trim().slice(0, 2);
  return COUNTRY_CURRENCY[c] ?? DEFAULT_CURRENCY;
}

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
    currencyDisplay: "narrowSymbol",
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
