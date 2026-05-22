"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
  "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre",
];
const WEEKDAYS = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

/** Premium range calendar. Only today and future days are selectable. */
export function Calendar({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = React.useState<Date>(
    value.start ? new Date(value.start.getFullYear(), value.start.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const canGoPrev = view.getFullYear() > today.getFullYear() || view.getMonth() > today.getMonth();

  // Build the grid: leading blanks (Monday-first) + days of month.
  const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const jsDow = firstOfMonth.getDay(); // 0=Sun
  const lead = (jsDow + 6) % 7; // Monday-first offset
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  function pick(day: Date) {
    const { start, end } = value;
    if (!start || (start && end)) {
      onChange({ start: day, end: null });
      return;
    }
    if (day < start) {
      onChange({ start: day, end: null });
      return;
    }
    onChange({ start, end: day });
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setView((v) => addMonths(v, -1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text transition disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="display text-base font-bold text-text">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text transition"
          aria-label="Mes següent"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-faint">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} />;
          const disabled = day < today;
          const isStart = value.start ? sameDay(day, value.start) : false;
          const isEnd = value.end ? sameDay(day, value.end) : false;
          const inRange =
            value.start && value.end && day > value.start && day < value.end;
          const isEdge = isStart || isEnd;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => pick(day)}
              className="relative flex h-10 items-center justify-center text-sm transition-colors"
              style={{
                color: disabled
                  ? "var(--text-faint)"
                  : isEdge
                    ? "#fff"
                    : "var(--text)",
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {/* range highlight band */}
              {inRange ? (
                <span className="absolute inset-y-1 inset-x-0 bg-[color:var(--green-subtle)]" />
              ) : null}
              {isStart && value.end ? (
                <span className="absolute inset-y-1 right-0 w-1/2 bg-[color:var(--green-subtle)]" />
              ) : null}
              {isEnd ? (
                <span className="absolute inset-y-1 left-0 w-1/2 bg-[color:var(--green-subtle)]" />
              ) : null}
              {/* day chip */}
              <span
                className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform"
                style={{
                  background: isEdge ? "var(--green)" : "transparent",
                  fontWeight: isEdge ? 700 : 500,
                  boxShadow: isEdge ? "0 4px 12px rgba(13,158,122,0.35)" : "none",
                }}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
