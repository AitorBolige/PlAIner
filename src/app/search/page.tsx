"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Slider } from "@/components/ui/Slider";
import { Badge } from "@/components/ui/Badge";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useSearchStore } from "@/store/useSearchStore";
import { cn } from "@/lib/cn";

const destinations = [
  "Barcelona",
  "Lisboa",
  "Roma",
  "París",
  "Amsterdam",
  "Praga",
  "Atenes",
  "Budapest",
  "Copenhaguen",
  "Edimburg",
  "Florència",
  "Berlín",
  "Porto",
  "Dublín",
  "València",
] as const;

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function SearchPage() {
  const router = useRouter();
  const onboarding = useOnboardingStore();
  const search = useSearchStore();

  const [openBudget, setOpenBudget] = React.useState(false);
  const [query, setQuery] = React.useState(search.destination);
  const [showSuggest, setShowSuggest] = React.useState(false);

  React.useEffect(() => {
    if (!search.budgetMax && onboarding.budget) {
      search.setBudgetMax(onboarding.budget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestions = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return destinations.slice(0, 6);
    return destinations
      .filter((d) => d.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query]);

  function setDestination(v: string) {
    setQuery(v);
    search.setDestination(v);
    setShowSuggest(false);
  }

  const canGenerate =
    search.destination.trim().length > 0 &&
    !!search.dateRange?.start &&
    !!search.dateRange?.end &&
    search.people >= 1;

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

    return bias.slice(0, 4).map((d, i) => ({
      destination: d,
      priceHint:
        i % 2 === 0 ? euro(Math.round(search.budgetMax * 0.75)) : euro(Math.round(search.budgetMax * 0.6)),
      tag: i % 2 === 0 ? "Dins del teu rang" : "Bona relació",
    }));
  }, [onboarding.ageGroup, onboarding.travelStyles, search.budgetMax]);

  return (
    <PageWrapper className="py-6 md:py-14">
      <div className="mx-auto w-full max-w-md md:max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-[color:var(--color-text-muted)]">
              Bon dia
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide">
              On anem?
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Configura el teu viatge i deixa que la IA faci la resta.
            </p>
          </div>
        </div>

        <Card className="p-4 md:p-6">
          <div className="grid gap-3">
            <div className="relative">
              <Input
                label=""
                value={query}
                placeholder="Quina destinació?"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                rightSlot={
                  <ChevronRight className="h-4 w-4 text-[color:var(--color-text-faint)]" />
                }
              />
              {showSuggest && suggestions.length ? (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
                  {suggestions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[color:var(--color-text)] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                      onClick={() => setDestination(d)}
                    >
                      <span>{d}</span>
                      <span className="text-xs text-[color:var(--color-text-muted)]">
                        Europa
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("plainer-dates");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="flex h-12 items-center justify-between rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-left text-sm text-[color:var(--color-text-muted)]"
            >
              <span>Quan?</span>
              <span className="rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)] px-3 py-1 text-xs font-medium text-[color:var(--color-primary)]">
                {search.dateRange?.start && search.dateRange?.end
                  ? `${Math.max(
                      1,
                      Math.round(
                        (new Date(search.dateRange.end).getTime() -
                          new Date(search.dateRange.start).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )} dies`
                  : "triar"}
              </span>
            </button>

            <div id="plainer-dates" className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                  Inici
                </label>
                <input
                  type="date"
                  value={search.dateRange?.start ?? ""}
                  onChange={(e) =>
                    search.setDateRange({
                      start: e.target.value,
                      end: search.dateRange?.end ?? "",
                    })
                  }
                  className="h-12 w-full rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-[16px] text-[color:var(--color-text)]"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                  Final
                </label>
                <input
                  type="date"
                  value={search.dateRange?.end ?? ""}
                  onChange={(e) =>
                    search.setDateRange({
                      start: search.dateRange?.start ?? "",
                      end: e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-[16px] text-[color:var(--color-text)]"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex h-12 items-center justify-between rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4">
                <span className="text-sm text-[color:var(--color-text-muted)]">
                  Quantes persones?
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Reduir persones"
                    onClick={() => search.setPeople(Math.max(1, search.people - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]"
                  >
                    −
                  </button>
                  <div className="min-w-6 text-center text-sm font-semibold text-[color:var(--color-text)]">
                    {search.people}
                  </div>
                  <button
                    type="button"
                    aria-label="Augmentar persones"
                    onClick={() => search.setPeople(Math.min(12, search.people + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenBudget(true)}
                className="flex h-12 items-center justify-between rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 text-left"
              >
                <span className="text-sm text-[color:var(--color-text-muted)]">
                  Pressupost
                </span>
                <span className="text-sm font-semibold text-[color:var(--color-primary)]">
                  {euro(search.budgetMax)}
                </span>
              </button>
            </div>

            <Button
              size="lg"
              className="mt-2 w-full"
              disabled={!canGenerate}
              onClick={() => router.push("/results")}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Genera el meu viatge →
              </span>
            </Button>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="neutral">Pressupost visible</Badge>
              <Badge variant="neutral">Sense sorpreses</Badge>
              <Badge variant="neutral">Personalitzat</Badge>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Recomanat per a tu
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {recommended.map((r, idx) => (
              <button
                key={r.destination}
                type="button"
                onClick={() => setDestination(r.destination)}
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
                    <Badge variant="neutral">{r.tag}</Badge>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={openBudget}
        onClose={() => setOpenBudget(false)}
        title="Pressupost"
      >
        <div className="grid gap-6">
          <div className="flex items-end justify-between">
            <div className="font-display text-2xl font-extrabold tracking-wide">
              {euro(search.budgetMax)}
            </div>
            <div className="text-sm text-[color:var(--color-text-muted)]">
              total màxim
            </div>
          </div>
          <Slider
            value={search.budgetMax}
            min={200}
            max={5000}
            step={50}
            ariaLabel="Pressupost"
            onChange={(v) => search.setBudgetMax(v)}
          />
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setOpenBudget(false)}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

