"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  src?: string | null;
  size?: number;
}

export function Avatar({
  className,
  name,
  src,
  size = 40,
  ...props
}: AvatarProps) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ?? "U";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.04)]",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {src ? (
        <Image src={src} alt={name ?? "Avatar"} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[color:var(--color-text-muted)]">
          {initials}
        </div>
      )}
    </div>
  );
}
