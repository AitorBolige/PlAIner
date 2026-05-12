"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { PageWrapper } from "@/components/layout/PageWrapper";

const navLinks = [
  { href: "/search", label: "Cercar" },
  { href: "/history", label: "Historial" },
  { href: "/profile", label: "Perfil" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 ease-[var(--ease-out-premium)]",
        scrolled
          ? "border-b border-[color:var(--color-border)] bg-[color:rgba(12,14,15,0.72)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <PageWrapper className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
          aria-label="PLAIner"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-white/5">
            <span className="font-display text-sm font-extrabold tracking-[0.14em]">
              P
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-sm font-extrabold tracking-[0.18em]">
              PLAINER
            </div>
            <div className="text-xs text-[color:var(--color-text-muted)]">
              planifica sense fricció
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-out-premium)] hover:bg-white/5 hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/auth/login" className="ml-2">
            <Button variant="secondary" size="sm">
              Inicia sessió
            </Button>
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white/5 text-[color:var(--color-text)] transition-colors duration-200 ease-[var(--ease-out-premium)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] md:hidden"
          aria-label={open ? "Tancar menú" : "Obrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </PageWrapper>

      {open ? (
        <div className="border-t border-[color:var(--color-border)] bg-[color:rgba(12,14,15,0.92)] backdrop-blur-xl md:hidden">
          <PageWrapper className="py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-[color:var(--color-text)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button className="w-full" variant="primary" size="md">
                  Inicia sessió
                </Button>
              </Link>
            </div>
          </PageWrapper>
        </div>
      ) : null}
    </header>
  );
}
