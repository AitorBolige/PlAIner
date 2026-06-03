"use client";

import * as React from "react";
import Image from "next/image";
import { Plane, TrainFront, Bus, Car, Search, type LucideIcon } from "lucide-react";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Calendar, type RangeValue } from "@/components/plan/Calendar";
import { DESTINATIONS, BLUR_DATA_URL } from "@/lib/destinations";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  getBudgetZone,
  daysBetween,
  formatDateRangeLocalized,
  groupThousands,
  getTransportOptions,
} from "@/lib/plan";
import { usePlan } from "@/components/plan/PlanProvider";
import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";
import { localizeTag, localizeCountry, localizeCity } from "@/lib/i18n";

type SheetCommon = { open: boolean; onClose: () => void };

const ZONE_COLORS = ["#3B87E8", "#0D9E7A", "#C8860A", "#9747FF"];

// --- Destination -----------------------------------------------------------

export function DestinationSheet({ open, onClose }: SheetCommon) {
  const { setDestination } = usePlan();
  const { locale, t } = useLocale();
  const displayMoney = useDisplayMoney();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q
    ? DESTINATIONS.filter(
        (d) =>
          localizeCity(d.id, locale).toLowerCase().includes(q) ||
          localizeCountry(d.countryCode, locale).toLowerCase().includes(q),
      )
    : DESTINATIONS;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={t.chooseDestination}>
      <div className="grid gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-[color:var(--surface-2)] px-4 py-2.5">
          <Search size={16} className="flex-none text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Barcelona, Tokyo, Bali…"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-faint"
          />
        </div>

        <div className="micro">{t.destinations} · {list.length}</div>

        <div className="grid grid-cols-2 gap-3">
          {list.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDestination(d);
                onClose();
              }}
              className="group relative h-[150px] overflow-hidden rounded-[var(--r-lg)] border border-border text-left shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
            >
              <Image
                src={d.cardImage}
                alt={localizeCity(d.id, locale)}
                fill
                sizes="240px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.78) 100%)",
                }}
              />
              {/* price */}
              <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {t.fromPrice} {displayMoney(d.priceFrom)}
              </span>
              {/* tag */}
              {d.tag ? (
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white"
                  style={{ background: d.tagColor }}
                >
                  {localizeTag(d.tag, t)}
                </span>
              ) : null}
              <span className="absolute inset-x-3 bottom-2.5 block text-white">
                <span className="display block text-[15px] font-extrabold tracking-[-0.02em]">
                  {localizeCity(d.id, locale)}
                </span>
                <span className="block text-[11px] opacity-90">{localizeCountry(d.countryCode, locale)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

// --- Dates -----------------------------------------------------------------

export function DatesSheet({ open, onClose }: SheetCommon) {
  const { dates, setDates } = usePlan();
  const { t } = useLocale();
  const [range, setRange] = React.useState<RangeValue>({
    start: dates?.start ?? null,
    end: dates?.end ?? null,
  });

  React.useEffect(() => {
    if (open) setRange({ start: dates?.start ?? null, end: dates?.end ?? null });
  }, [open, dates]);

  const valid = Boolean(range.start && range.end);
  const days = valid ? daysBetween(range.start!, range.end!) : range.start ? 1 : 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={t.whenDoYouTravel}>
      <div className="grid gap-4">
        <Calendar value={range} onChange={setRange} />

        <div className="flex items-center justify-between rounded-[var(--r-md)] bg-[color:var(--surface-2)] px-4 py-3">
          <span className="text-sm text-muted">
            {range.start
              ? formatDateRangeLocalized(range.start, range.end ?? range.start, valid ? days : undefined, t)
              : t.chooseDatesInCalendar}
          </span>
          {valid ? (
            <span className="display text-sm font-bold text-[color:var(--green-deep)]">
              {t.daysCount(days)}
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          disabled={!valid}
          className="normal-case tracking-normal"
          onClick={() => {
            if (range.start && range.end) {
              setDates({ start: range.start, end: range.end, days });
              onClose();
            }
          }}
        >
          {t.confirmDates}
        </Button>
      </div>
    </Sheet>
  );
}

// --- Transport -------------------------------------------------------------

const TRANSPORT_ICONS: Record<string, LucideIcon> = {
  plane: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
};

export function TransportSheet({ open, onClose }: SheetCommon) {
  const { transport, setTransport } = usePlan();
  const { t } = useLocale();
  const [picked, setPicked] = React.useState(transport?.id ?? null);
  const options = getTransportOptions(t);

  React.useEffect(() => {
    if (open) setPicked(transport?.id ?? null);
  }, [open, transport]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={t.howDoYouTravel}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const sel = picked === opt.id;
            const Icon = TRANSPORT_ICONS[opt.id] ?? Plane;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPicked(opt.id)}
                className="rounded-[var(--r-lg)] border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: sel ? "var(--green)" : "var(--border)",
                  background: sel ? "var(--green-subtle)" : "var(--surface)",
                  boxShadow: sel
                    ? "0 8px 22px rgba(13,158,122,0.16)"
                    : "0 2px 10px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: sel ? "var(--green)" : "var(--surface-2)",
                    color: sel ? "#fff" : "var(--green)",
                  }}
                >
                  <Icon size={20} />
                </span>
                <span
                  className="display block text-base font-bold"
                  style={{ color: sel ? "var(--green-deep)" : "var(--text)" }}
                >
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{opt.sub}</span>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          disabled={!picked}
          className="normal-case tracking-normal"
          onClick={() => {
            const opt = options.find((o) => o.id === picked);
            if (opt) setTransport(opt);
            onClose();
          }}
        >
          {t.confirmTransport}
        </Button>
      </div>
    </Sheet>
  );
}

// --- Budget ----------------------------------------------------------------

const BUDGET_QUICK_VALUES = [500, 1200, 2500, 5000] as const;

export function BudgetSheet({ open, onClose }: SheetCommon) {
  const { budget, setBudget } = usePlan();
  const { t } = useLocale();
  const displayMoney = useDisplayMoney();
  const [v, setV] = React.useState(budget);

  React.useEffect(() => {
    if (open) setV(budget);
  }, [open, budget]);

  const zone = getBudgetZone(v, t);
  const zoneColor = ZONE_COLORS[zone.i];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={t.whatBudget}>
      <div className="grid gap-5">
        {/* Big amount */}
        <div className="text-center">
          <div className="display text-5xl font-extrabold tracking-[-0.03em] text-text">
            {displayMoney(v)}
          </div>
          <div className="mt-1 text-sm text-muted">{t.perPersonAllInclusive}</div>
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold"
            style={{ background: "var(--green-subtle)", color: zoneColor }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: zoneColor }} />
            {zone.label.toUpperCase()}
            <span className="font-medium text-muted">· {zone.sub}</span>
          </div>
        </div>

        {/* Slider */}
        <div>
          <input
            type="range"
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: zoneColor }}
          />
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>&lt; {displayMoney(600)}</span>
            <span>
              {displayMoney(600)}–{displayMoney(1500)}
            </span>
            <span>
              {displayMoney(1500)}–{displayMoney(3000)}
            </span>
            <span>&gt; {displayMoney(3000)}</span>
          </div>
        </div>

        {/* Quick picks */}
        <div className="grid grid-cols-4 gap-2">
          {BUDGET_QUICK_VALUES.map((amount) => {
            const active = v === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setV(amount)}
                className="rounded-full py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: active ? "var(--text)" : "var(--surface-2)",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
              >
                {displayMoney(amount)}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          className="normal-case tracking-normal"
          onClick={() => {
            setBudget(v);
            onClose();
          }}
        >
          {t.confirmBudget} · {displayMoney(v)}
        </Button>
      </div>
    </Sheet>
  );
}

// --- Origin ----------------------------------------------------------------

const ORIGIN_AIRPORTS = [
  { code: "BCN", city: "Barcelona", airport: "El Prat", flag: "🇪🇸" },
  { code: "MAD", city: "Madrid", airport: "Barajas", flag: "🇪🇸" },
  { code: "VLC", city: "València", airport: "Manises", flag: "🇪🇸" },
  { code: "PMI", city: "Palma", airport: "Son Sant Joan", flag: "🇪🇸" },
  { code: "AGP", city: "Màlaga", airport: "Costa del Sol", flag: "🇪🇸" },
  { code: "ALC", city: "Alacant", airport: "L'Altet", flag: "🇪🇸" },
  { code: "BIO", city: "Bilbao", airport: "Loiu", flag: "🇪🇸" },
  { code: "SVQ", city: "Sevilla", airport: "San Pablo", flag: "🇪🇸" },
  { code: "SCQ", city: "Santiago", airport: "Rosalía de Castro", flag: "🇪🇸" },
  { code: "TFS", city: "Tenerife", airport: "Tenerife Sur", flag: "🇪🇸" },
  { code: "LPA", city: "Gran Canària", airport: "Las Palmas", flag: "🇪🇸" },
  { code: "ZAZ", city: "Saragossa", airport: "Zaragoza", flag: "🇪🇸" },
  { code: "CDG", city: "París", airport: "Charles de Gaulle", flag: "🇫🇷" },
  { code: "LHR", city: "Londres", airport: "Heathrow", flag: "🇬🇧" },
  { code: "AMS", city: "Amsterdam", airport: "Schiphol", flag: "🇳🇱" },
  { code: "FCO", city: "Roma", airport: "Fiumicino", flag: "🇮🇹" },
  { code: "MXP", city: "Milà", airport: "Malpensa", flag: "🇮🇹" },
  { code: "FRA", city: "Frankfurt", airport: "Frankfurt am Main", flag: "🇩🇪" },
  { code: "LIS", city: "Lisboa", airport: "Humberto Delgado", flag: "🇵🇹" },
  { code: "ZRH", city: "Zurich", airport: "Kloten", flag: "🇨🇭" },
];

export function OriginSheet({ open, onClose }: SheetCommon) {
  const { origin, setOrigin } = usePlan();
  const { t } = useLocale();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const filtered = query.trim().length === 0
    ? ORIGIN_AIRPORTS
    : ORIGIN_AIRPORTS.filter((a) =>
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.airport.toLowerCase().includes(query.toLowerCase())
      );

  const currentAirport = ORIGIN_AIRPORTS.find((a) => a.code === origin);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={t.tripOrigin}>
      <div className="grid gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Barcelona, MAD, Lisboa..."
            className="w-full rounded-[var(--r-xl)] border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text outline-none focus-visible:border-[color:var(--green)]"
          />
        </div>

        {/* Airport list */}
        <div className="max-h-[320px] overflow-y-auto rounded-[var(--r-xl)] border border-border bg-surface">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Sense resultats</p>
          ) : (
            filtered.map((a, i) => {
              const active = a.code === origin;
              return (
                <button
                  key={a.code}
                  type="button"
                  onClick={() => { setOrigin(a.code); onClose(); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    background: active ? "var(--green-subtle)" : undefined,
                  }}
                >
                  <span className="text-xl leading-none">{a.flag}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-semibold text-text">{a.city}</span>
                    <span className="block text-[11px] text-muted truncate">{a.airport}</span>
                  </span>
                  <span
                    className="flex-none rounded-md px-2 py-0.5 text-[11px] font-bold tracking-[0.1em]"
                    style={{
                      background: active ? "var(--green)" : "var(--surface-2)",
                      color: active ? "#fff" : "var(--text-faint)",
                    }}
                  >
                    {a.code}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {currentAirport && (
          <p className="text-center text-xs text-muted">
            Origen actual: <span className="font-semibold text-text">{currentAirport.flag} {currentAirport.city} ({currentAirport.code})</span>
          </p>
        )}
      </div>
    </Sheet>
  );
}
