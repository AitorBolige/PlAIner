"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  neutral:
    "border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.04)] text-[color:var(--color-text-muted)]",
  success:
    "border-[color:color-mix(in_srgb,var(--color-success)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] text-[color:color-mix(in_srgb,var(--color-success)_80%,white_10%)]",
  warning:
    "border-[color:color-mix(in_srgb,var(--color-primary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[color:color-mix(in_srgb,var(--color-primary)_85%,white_5%)]",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
