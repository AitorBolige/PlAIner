"use client";

import * as React from "react";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";

function labelForBudget(v: number) {
  if (v < 700) return "Econòmic";
  if (v < 1400) return "Equilibrat";
  if (v < 2600) return "Confortable";
  return "Premium";
}

export interface BudgetSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function BudgetSlider({ value, onChange }: BudgetSliderProps) {
  const label = labelForBudget(value);

  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl font-extrabold tracking-wide">
            {formatted}
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {label}
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Input
            label="Editable"
            inputMode="numeric"
            value={String(value)}
            onChange={(e) => {
              const next = Number(e.target.value.replaceAll(".", ""));
              if (Number.isFinite(next))
                onChange(Math.min(5000, Math.max(200, next)));
            }}
          />
        </div>
      </div>

      <Slider
        value={value}
        min={200}
        max={5000}
        step={50}
        ariaLabel="Pressupost"
        onChange={onChange}
      />

      <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
        <span>Econòmic</span>
        <span>Equilibrat</span>
        <span>Confortable</span>
        <span>Premium</span>
      </div>
    </div>
  );
}
