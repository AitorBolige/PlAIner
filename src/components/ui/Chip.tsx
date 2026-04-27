"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  label,
  selected,
  onClick,
  disabled,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ease-[var(--ease-out-premium)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:opacity-50",
        selected
          ? "border-transparent bg-[color:rgba(232,160,74,0.18)] text-[color:var(--color-text)]"
          : "border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.03)] text-[color:var(--color-text-muted)] hover:bg-[color:rgba(255,255,255,0.06)]",
        className
      )}
    >
      {label}
    </button>
  );
}

