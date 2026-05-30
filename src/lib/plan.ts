import type { TransportOption } from "@/components/plan/PlanProvider";
import type { Translations } from "@/lib/i18n";

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: "plane", label: "Avió", sub: "Més ràpid" },
  { id: "train", label: "Tren", sub: "Sostenible" },
  { id: "bus", label: "Bus / Ferri", sub: "Econòmic" },
  { id: "car", label: "Cotxe propi", sub: "Flexible" },
];

/** Return transport options with labels from the given translations. */
export function getTransportOptions(t: Translations): TransportOption[] {
  return [
    { id: "plane", label: t.transportPlane, sub: t.transportPlaneSub },
    { id: "train", label: t.transportTrain, sub: t.transportTrainSub },
    { id: "bus", label: t.transportBus, sub: t.transportBusSub },
    { id: "car", label: t.transportCar, sub: t.transportCarSub },
  ];
}

/**
 * Deterministic thousands grouping ("1200" → "1.200"). Avoids hydration
 * mismatches from toLocaleString, whose output can differ between the Node
 * server (limited ICU) and the browser.
 */
export function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const BUDGET_MIN = 300;
export const BUDGET_MAX = 6000;
export const BUDGET_STEP = 50;

export interface BudgetZone {
  i: number;
  label: string;
  sub: string;
}

export function budgetZone(v: number): BudgetZone {
  if (v < 600) return { i: 0, label: "Econòmic", sub: "Escapades curtes a Europa" };
  if (v < 1500) return { i: 1, label: "Equilibrat", sub: "5-7 dies a Europa" };
  if (v < 3000) return { i: 2, label: "Confortable", sub: "Intercontinental" };
  return { i: 3, label: "Premium", sub: "Sense compromís" };
}

/** Locale-aware version of budgetZone. */
export function getBudgetZone(v: number, t: Translations): BudgetZone {
  if (v < 600) return { i: 0, label: t.budgetEconomic, sub: t.budgetEconomicSub };
  if (v < 1500) return { i: 1, label: t.budgetBalanced, sub: t.budgetBalancedSub };
  if (v < 3000) return { i: 2, label: t.budgetComfortable, sub: t.budgetComfortableSub };
  return { i: 3, label: t.budgetPremium, sub: t.budgetPremiumSub };
}

const MONTHS_CA = [
  "gen", "feb", "març", "abr", "maig", "juny",
  "jul", "ago", "set", "oct", "nov", "des",
];

export function monthAbbr(d: Date): string {
  return MONTHS_CA[d.getMonth()] ?? "";
}

export function monthAbbrLocalized(d: Date, t: Translations): string {
  return t.months[d.getMonth()] ?? "";
}

/** Inclusive day count between two dates (min 1). */
export function daysBetween(start: Date, end: Date): number {
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
}

export function formatDateRange(
  start: Date | null | undefined,
  end: Date | null | undefined,
  days?: number,
): string | null {
  if (!start || !end) return null;
  const base = `${start.getDate()} ${monthAbbr(start)} – ${end.getDate()} ${monthAbbr(end)}`;
  return days ? `${base} · ${days} dies` : base;
}

/** Locale-aware version of formatDateRange. */
export function formatDateRangeLocalized(
  start: Date | null | undefined,
  end: Date | null | undefined,
  days: number | undefined,
  t: Translations,
): string | null {
  if (!start || !end) return null;
  const base = `${start.getDate()} ${monthAbbrLocalized(start, t)} – ${end.getDate()} ${monthAbbrLocalized(end, t)}`;
  return days ? `${base} · ${t.daysCount(days)}` : base;
}

/** Parse a YYYY-MM-DD input value to a local noon Date (avoids TZ drift). */
export function parseInputDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date as YYYY-MM-DD for <input type="date">. */
export function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
