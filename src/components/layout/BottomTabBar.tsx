"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, Plane, User } from "lucide-react";

import { cn } from "@/lib/cn";

type Tab = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  matches?: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  {
    href: "/search",
    label: "Inici",
    Icon: Home,
    matches: (p) => p === "/search" || p === "/",
  },
  {
    href: "/explore",
    label: "Explorar",
    Icon: Compass,
    matches: (p) => p.startsWith("/explore"),
  },
  {
    href: "/history",
    label: "El meu viatge",
    Icon: Plane,
    matches: (p) => p.startsWith("/history") || p.startsWith("/trip"),
  },
  {
    href: "/favorites",
    label: "Favorits",
    Icon: Heart,
    matches: (p) => p.startsWith("/favorites"),
  },
  {
    href: "/profile",
    label: "Perfil",
    Icon: User,
    matches: (p) => p.startsWith("/profile"),
  },
];

export function BottomTabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-border)] bg-[color:rgba(246,244,239,0.9)] backdrop-blur-xl md:hidden"
      aria-label="Navegació principal"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),0px)] pt-2">
        {tabs.map((t) => {
          const active = t.matches ? t.matches(pathname) : pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]",
                active ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text-muted)]"
              )}
            >
              <t.Icon className={cn("h-5 w-5", active ? "" : "opacity-90")} />
              <span className={cn("text-[11px] font-medium", active ? "" : "")}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

