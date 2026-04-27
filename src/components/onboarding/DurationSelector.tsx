"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { DurationPreset } from "@/store/useOnboardingStore";

const options: Array<{
  key: DurationPreset;
  title: string;
  description: string;
  icon: string;
}> = [
  { key: "2", title: "2 dies", description: "Fuga ràpida i intensa.", icon: "⚡" },
  { key: "3-4", title: "3–4 dies", description: "Cap de setmana llarg.", icon: "🗓️" },
  { key: "5-7", title: "5–7 dies", description: "Setmana completa.", icon: "🌍" },
  { key: "7-14", title: "7–14 dies", description: "Desconnexió real.", icon: "🏝️" },
  { key: "14+", title: "+14 dies", description: "Viatge a fons.", icon: "🧭" },
];

export interface DurationSelectorProps {
  value: DurationPreset | null;
  onChange: (v: DurationPreset) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="min-w-[210px] flex-shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] rounded-[var(--radius-xl)]"
          >
            <Card
              hover
              className={cn(
                "p-5",
                selected
                  ? "border-[color:color-mix(in_srgb,var(--color-primary)_45%,transparent)] bg-[color:rgba(232,160,74,0.10)]"
                  : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-extrabold tracking-wide">
                  {o.title}
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/5 text-lg"
                >
                  {o.icon}
                </div>
              </div>
              <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {o.description}
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

