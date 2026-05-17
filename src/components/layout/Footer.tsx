"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";

const links = [
  { href: "/legal/privacy", label: "Privacitat" },
  { href: "/legal/terms", label: "Termes" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--color-border)]">
      <PageWrapper className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-sm font-extrabold tracking-[0.18em]">
            PLAINER
          </div>
          <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
            Pressupost clar. Experiència personalitzada.
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-[color:var(--color-text-muted)] transition-colors duration-200 ease-[var(--ease-out-premium)] hover:text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </PageWrapper>
    </footer>
  );
}
