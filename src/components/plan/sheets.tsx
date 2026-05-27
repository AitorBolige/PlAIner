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
  budgetZone,
  daysBetween,
  formatDateRange,
  groupThousands,
  TRANSPORT_OPTIONS,
} from "@/lib/plan";
import { usePlan } from "@/components/plan/PlanProvider";

type SheetCommon = { open: boolean; onClose: () => void };

const ZONE_COLORS = ["#3B87E8", "#0D9E7A", "#C8860A", "#9747FF"];

// --- Destination -----------------------------------------------------------

export function DestinationSheet({ open, onClose }: SheetCommon) {
  const { setDestination } = usePlan();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q
    ? DESTINATIONS.filter(
        (d) =>
          d.city.toLowerCase().includes(q) || d.country.toLowerCase().includes(q),
      )
    : DESTINATIONS;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Tria la destinació">
      <div className="grid gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-[color:var(--surface-2)] px-4 py-2.5">
          <Search size={16} className="flex-none text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Barcelona, Tòquio, Bali…"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-faint"
          />
        </div>

        <div className="micro">DESTINS · {list.length}</div>

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
                alt={d.city}
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
                des de {d.priceFrom}€
              </span>
              {/* tag */}
              {d.tag ? (
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white"
                  style={{ background: d.tagColor }}
                >
                  {d.tag}
                </span>
              ) : null}
              <span className="absolute inset-x-3 bottom-2.5 block text-white">
                <span className="display block text-[15px] font-extrabold tracking-[-0.02em]">
                  {d.city}
                </span>
                <span className="block text-[11px] opacity-90">{d.country}</span>
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
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Quan vols viatjar?">
      <div className="grid gap-4">
        <Calendar value={range} onChange={setRange} />

        <div className="flex items-center justify-between rounded-[var(--r-md)] bg-[color:var(--surface-2)] px-4 py-3">
          <span className="text-sm text-muted">
            {range.start
              ? formatDateRange(range.start, range.end ?? range.start, valid ? days : undefined)
              : "Tria les dates al calendari"}
          </span>
          {valid ? (
            <span className="display text-sm font-bold text-[color:var(--green-deep)]">
              {days} {days === 1 ? "dia" : "dies"}
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
          Confirmar dates
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
  const [picked, setPicked] = React.useState(transport?.id ?? null);

  React.useEffect(() => {
    if (open) setPicked(transport?.id ?? null);
  }, [open, transport]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Com vols anar?">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          {TRANSPORT_OPTIONS.map((t) => {
            const sel = picked === t.id;
            const Icon = TRANSPORT_ICONS[t.id] ?? Plane;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPicked(t.id)}
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
                  {t.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{t.sub}</span>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          disabled={!picked}
          className="normal-case tracking-normal"
          onClick={() => {
            const t = TRANSPORT_OPTIONS.find((o) => o.id === picked);
            if (t) setTransport(t);
            onClose();
          }}
        >
          Confirmar transport
        </Button>
      </div>
    </Sheet>
  );
}

// --- Budget ----------------------------------------------------------------

const BUDGET_QUICK: { value: number; label: string }[] = [
  { value: 500, label: "500€" },
  { value: 1200, label: "1.2k€" },
  { value: 2500, label: "2.5k€" },
  { value: 5000, label: "5k€" },
];

export function BudgetSheet({ open, onClose }: SheetCommon) {
  const { budget, setBudget } = usePlan();
  const [v, setV] = React.useState(budget);

  React.useEffect(() => {
    if (open) setV(budget);
  }, [open, budget]);

  const zone = budgetZone(v);
  const zoneColor = ZONE_COLORS[zone.i];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Quin pressupost?">
      <div className="grid gap-5">
        {/* Big amount */}
        <div className="text-center">
          <div className="display text-5xl font-extrabold tracking-[-0.03em] text-text">
            {groupThousands(v)}{" "}
            <span className="text-3xl font-bold text-muted">€</span>
          </div>
          <div className="mt-1 text-sm text-muted">per persona · tot inclòs</div>
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
            <span>&lt; 600€</span>
            <span>600–1.500€</span>
            <span>1.500–3.000€</span>
            <span>&gt; 3.000€</span>
          </div>
        </div>

        {/* Quick picks */}
        <div className="grid grid-cols-4 gap-2">
          {BUDGET_QUICK.map((q) => {
            const active = v === q.value;
            return (
              <button
                key={q.value}
                type="button"
                onClick={() => setV(q.value)}
                className="rounded-full py-2.5 text-sm font-bold transition-colors"
                style={{
                  background: active ? "var(--text)" : "var(--surface-2)",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
              >
                {q.label}
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
          Confirmar · {groupThousands(v)} €
        </Button>
      </div>
    </Sheet>
  );
}

// --- Origin ----------------------------------------------------------------

export function OriginSheet({ open, onClose }: SheetCommon) {
  const { origin, setOrigin } = usePlan();
  const [v, setV] = React.useState(origin);

  React.useEffect(() => {
    if (open) setV(origin);
  }, [open, origin]);

  const clean = v.trim().toUpperCase().slice(0, 3);
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Origen del viatge">
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="micro">CODI D&apos;AEROPORT (IATA)</span>
          <input
            value={v}
            onChange={(e) => setV(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="Ex: BCN"
            maxLength={3}
            className="w-full rounded-[var(--r-md)] border border-border bg-surface px-3 py-2.5 text-sm uppercase tracking-[0.2em] text-text outline-none focus-visible:border-brand"
          />
        </label>
        <Button
          type="button"
          disabled={clean.length < 3}
          className="normal-case tracking-normal"
          onClick={() => {
            setOrigin(clean);
            onClose();
          }}
        >
          Confirmar origen
        </Button>
      </div>
    </Sheet>
  );
}
