"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useSearchStore } from "@/store/useSearchStore";
import { cn } from "@/lib/cn";

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function ExplorePage() {
  const router = useRouter();
  const onboarding = useOnboardingStore();
  const search = useSearchStore();

  const recommended = React.useMemo(() => {
    const styles = onboarding.travelStyles;
    const age = onboarding.ageGroup;

    const pool =
      styles.includes("Platja") || styles.includes("Relax")
        ? ["Lisboa", "Porto", "Atenes", "València"]
        : styles.includes("Cultura")
          ? ["Roma", "París", "Praga", "Budapest"]
          : styles.includes("Natura") || styles.includes("Aventura")
            ? ["Edimburg", "Copenhaguen", "Amsterdam", "Berlín"]
            : ["Barcelona", "Roma", "Lisboa", "París"];

    const bias =
      age === "senior"
        ? pool
        : age === "youth"
          ? [...pool].reverse()
          : pool;

    return bias.slice(0, 8).map((d, i) => ({
      destination: d,
      priceHint:
        i % 2 === 0
          ? euro(Math.round((search.budgetMax || 1200) * 0.75))
          : euro(Math.round((search.budgetMax || 1200) * 0.6)),
      tag: i % 2 === 0 ? "Cultura" : "Gastro",
    }));
  }, [onboarding.ageGroup, onboarding.travelStyles, search.budgetMax]);

  function pick(destination: string) {
    search.setDestination(destination);
    router.push("/search");
  }

  return (
    <PageWrapper className="py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5">
          <div className="text-sm text-[color:var(--color-text-muted)]">
            Descobreix idees
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide">
            Explorar
          </h1>
        </div>

        <div className="grid gap-3">
          {recommended.map((r, idx) => (
            <button
              key={r.destination}
              type="button"
              onClick={() => pick(r.destination)}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] rounded-[var(--radius-xl)]"
            >
              <Card
                hover
                className={cn(
                  "relative overflow-hidden p-4",
                  idx % 2 === 0
                    ? "bg-[radial-gradient(900px_circle_at_15%_10%,rgba(10,163,127,0.16),transparent_55%)]"
                    : "bg-[radial-gradient(900px_circle_at_15%_10%,rgba(47,125,179,0.14),transparent_55%)]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-xl font-extrabold tracking-wide">
                      {r.destination}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                      des de {r.priceHint}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="neutral">{r.tag}</Badge>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

