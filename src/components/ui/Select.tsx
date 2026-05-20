"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
}

export function Select({
  className,
  label,
  error,
  id,
  children,
  ...props
}: SelectProps) {
  const autoId = React.useId();
  const selectId = id ?? autoId;
  const describedById = error ? `${selectId}-error` : undefined;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-2 block text-sm font-medium text-[color:var(--color-text)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "h-11 w-full appearance-none rounded-[var(--radius-md)] border bg-[color:var(--color-surface-2)] pl-4 pr-10 text-[16px] text-[color:var(--color-text)] transition-colors duration-200 ease-[var(--ease-out-premium)]",
            "border-[color:var(--color-border)] focus:border-[color:color-mix(in_srgb,var(--color-primary)_55%,white_10%)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)]",
            error
              ? "border-[color:rgba(255,120,120,0.35)] focus:border-[color:rgba(255,120,120,0.55)] focus:ring-[color:rgba(255,120,120,0.22)]"
              : "",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-faint)]"
        />
      </div>

      {error ? (
        <p
          id={describedById}
          className="mt-2 text-sm text-[color:rgba(255,150,150,0.95)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
