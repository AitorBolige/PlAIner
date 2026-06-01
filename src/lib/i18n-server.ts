import { cookies } from "next/headers";
import { normalizeCurrency } from "./currency";
import { getTranslations, type Locale, type Translations } from "./i18n";

export function getServerLocale(): { locale: Locale; t: Translations } {
  const cookieStore = cookies();
  const val = cookieStore.get("pl-lang")?.value;
  const locale: Locale = val === "es" || val === "en" || val === "de" || val === "fr" || val === "it" || val === "pt" || val === "ar" || val === "zh" || val === "hi" ? val : "ca";
  return { locale, t: getTranslations(locale) };
}

export function getServerCurrency(): string {
  const cookieStore = cookies();
  return normalizeCurrency(cookieStore.get("pl-currency")?.value);
}
