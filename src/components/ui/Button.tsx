"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium uppercase tracking-[0.08em] transition-colors duration-200 ease-[var(--ease-out-premium)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-hover)] active:bg-[color:var(--color-primary-active)] shadow-[0_14px_35px_rgba(10,163,127,0.25)]",
  secondary:
    "bg-[color:var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:bg-[color:color-mix(in_srgb,var(--color-surface)_90%,black_2%)]",
  ghost:
    "bg-transparent text-[color:var(--color-text)] hover:bg-[color:rgba(20,24,24,0.06)]",
  danger:
    "bg-[color:rgba(255,120,120,0.18)] text-[color:var(--color-text)] border border-[color:rgba(255,120,120,0.25)] hover:bg-[color:rgba(255,120,120,0.24)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[13px]",
  lg: "h-12 px-7 text-[14px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border border-white/40 border-t-white"
          />
          <span className="normal-case tracking-normal">Carregant</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
