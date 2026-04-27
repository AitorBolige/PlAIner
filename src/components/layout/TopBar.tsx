"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import { cn } from "@/lib/cn";

const HIDE_ON_PREFIXES = ["/auth/"] as const;

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const hidden = HIDE_ON_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:rgba(244,241,236,0.88)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <div className="text-sm font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          PLAIner
        </div>
        <Link
          href="/search"
          aria-label="Anar a inici"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white/70",
            "border-[color:var(--border-md)] text-[color:var(--text)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--green)]"
          )}
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

