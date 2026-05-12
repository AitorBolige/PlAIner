"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const dims = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      role="status"
      aria-label="Carregant"
      className={cn(
        dims,
        "animate-spin rounded-full border border-white/20 border-t-white/70",
        className,
      )}
      {...props}
    />
  );
}
