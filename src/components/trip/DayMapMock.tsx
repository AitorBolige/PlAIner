"use client";

import * as React from "react";

import type { ActivityDTO, DayDTO } from "@/components/trip/DayAccordion";
import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pointsForActivities(activities: ActivityDTO[]) {
  const count = clamp(activities.length, 1, 7);
  const startX = 88;
  const startY = 72;
  const stepY = 52;

  return Array.from({ length: count }).map((_, i) => {
    const x = startX + (i % 2 === 0 ? 26 : -22);
    const y = startY + i * stepY;
    return { x, y, n: i + 1 };
  });
}

export interface DayMapMockProps {
  days: DayDTO[];
  dayNumber: number;
  onDayChange: (dayNumber: number) => void;
  className?: string;
}

export function DayMapMock({
  days,
  dayNumber,
  onDayChange,
  className,
}: DayMapMockProps) {
  const day = React.useMemo(
    () =>
      days
        .slice()
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .find((d) => d.dayNumber === dayNumber) ?? days[0],
    [days, dayNumber],
  );

  const pts = React.useMemo(
    () => pointsForActivities(day.activities),
    [day.activities],
  );

  const path = React.useMemo(() => {
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    return pts
      .map((p, idx) =>
        idx === 0 ? `M ${p.x} ${p.y}` : `Q ${p.x} ${p.y - 18} ${p.x} ${p.y}`,
      )
      .join(" ");
  }, [pts]);

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days
          .slice()
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((d) => {
            const active = d.dayNumber === dayNumber;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDayChange(d.dayNumber)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
                  active
                    ? "border-transparent bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
                )}
              >
                Dia {d.dayNumber}
              </button>
            );
          })}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.65)]">
        <div className="relative h-[340px] w-full">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 220 360"
            preserveAspectRatio="xMidYMid slice"
            aria-label="Mapa (mock)"
            role="img"
          >
            <defs>
              <pattern
                id="grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="rgba(20,24,24,0.06)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect x="0" y="0" width="220" height="360" fill="url(#grid)" />

            <path
              d="M 170 0 C 154 42 172 92 160 140 C 150 180 168 224 156 268 C 148 298 154 330 144 360"
              fill="none"
              stroke="rgba(47,125,179,0.14)"
              strokeWidth="10"
              strokeLinecap="round"
            />

            <path
              d={path}
              fill="none"
              stroke="rgba(10,163,127,0.75)"
              strokeWidth="3"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {pts.map((p) => (
              <g key={p.n}>
                <ellipse
                  cx={p.x}
                  cy={p.y + 14}
                  rx="13"
                  ry="5"
                  fill="rgba(20,24,24,0.12)"
                />
                <path
                  d={`M ${p.x} ${p.y} c 0 -10 16 -10 16 0 c 0 12 -16 26 -16 26 c 0 0 -16 -14 -16 -26 c 0 -10 16 -10 16 0 z`}
                  fill={
                    p.n === 2 ? "rgba(255,94,86,0.92)" : "rgba(10,163,127,0.92)"
                  }
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill="rgba(255,255,255,0.85)"
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="rgba(20,24,24,0.78)"
                >
                  {p.n}
                </text>
              </g>
            ))}
          </svg>

          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]">
            {day.title}
          </div>
        </div>

        <div className="border-t border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.75)] p-4">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            Dia {day.dayNumber} — {day.activities.length} activitats
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Ruta aproximada (mock) basada en l’ordre de les activitats.
          </div>
        </div>
      </div>
    </div>
  );
}
