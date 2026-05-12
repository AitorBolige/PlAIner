"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { AgeGroup } from "@/store/useOnboardingStore";

interface Segment {
  key: AgeGroup;
  title: string;
  description: string;
  icon: string;
}

const segments: Segment[] = [
  {
    key: "youth",
    title: "Jove explorador",
    description:
      "Ritme intens, experiències memorables, pressupost optimitzat.",
    icon: "🧳",
  },
  {
    key: "adult",
    title: "Viatger experimentat",
    description: "Equilibri perfecte entre confort, temps i descobriment.",
    icon: "🗺️",
  },
  {
    key: "senior",
    title: "Viatge amb calma",
    description: "Ritme tranquil, seguretat, descans i logística clara.",
    icon: "✈️",
  },
];

export interface SegmentSelectorProps {
  value: AgeGroup | null;
  onChange: (v: AgeGroup) => void;
}

export function SegmentSelector({ value, onChange }: SegmentSelectorProps) {
  return (
    <div className="grid gap-3">
      {segments.map((s) => {
        const selected = value === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] rounded-[var(--radius-xl)]"
          >
            <Card
              hover
              className={cn(
                "flex items-start gap-4 p-5",
                selected
                  ? "border-[color:color-mix(in_srgb,var(--color-primary)_45%,transparent)] bg-[color:rgba(232,160,74,0.10)]"
                  : "",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/5 text-xl">
                <span aria-hidden="true">{s.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-extrabold tracking-wide">
                  {s.title}
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {s.description}
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
