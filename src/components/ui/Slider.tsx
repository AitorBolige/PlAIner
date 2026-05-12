"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  ariaLabel,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel ?? "Slider"}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-11 w-full appearance-none bg-transparent",
          "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[color:rgba(0,0,0,0.10)]",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--green)] [&::-webkit-slider-thumb]:shadow-[0_10px_35px_rgba(13,158,122,0.18)] [&::-webkit-slider-thumb]:mt-[-6px]",
          "[&:focus-visible::-webkit-slider-thumb]:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-2",
          "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[color:rgba(0,0,0,0.10)]",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[color:var(--green)]",
        )}
        style={{
          background: `linear-gradient(to right, var(--green) 0%, var(--green) ${pct}%, rgba(0,0,0,0.10) ${pct}%, rgba(0,0,0,0.10) 100%)`,
          borderRadius: 9999,
        }}
      />
    </div>
  );
}
