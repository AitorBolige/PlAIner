"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

export function Input({
  className,
  label,
  error,
  id,
  rightSlot,
  ...props
}: InputProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const describedById = error ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-[color:var(--color-text)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] border bg-[color:var(--color-surface-2)] px-4 text-[16px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-faint)] transition-colors duration-200 ease-[var(--ease-out-premium)]",
            "border-[color:var(--color-border)] focus:border-[color:color-mix(in_srgb,var(--color-primary)_55%,white_10%)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)]",
            rightSlot ? "pr-11" : "",
            error
              ? "border-[color:rgba(255,120,120,0.35)] focus:border-[color:rgba(255,120,120,0.55)] focus:ring-[color:rgba(255,120,120,0.22)]"
              : "",
            className
          )}
          {...props}
        />

        {rightSlot ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {rightSlot}
          </div>
        ) : null}
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

