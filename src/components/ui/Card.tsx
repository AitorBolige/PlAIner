"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-[var(--radius-xl)]",
        hover
          ? "transition-transform duration-300 ease-[var(--ease-out-premium)] hover:-translate-y-0.5"
          : "",
        className,
      )}
      {...props}
    />
  );
}
