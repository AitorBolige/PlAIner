"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { DayAccordion, type DayDTO } from "@/components/trip/DayAccordion";
import { useSearchStore } from "@/store/useSearchStore";

type TripDTO = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  flightCost: number;
  hotelCost: number;
  activitiesCost: number;
  dailyCost: number;
  days: DayDTO[];
};

export default function ResultsPage() {
  const router = useRouter();
  const search = useSearchStore();

  const [loading, setLoading] = React.useState(true);
  const [trip, setTrip] = React.useState<TripDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;

    async function run() {
      setLoading(true);
      setError(null);

      if (!search.destination || !search.dateRange?.start || !search.dateRange?.end) {
        setLoading(false);
        setError("Falten dades de cerca. Torna al cercador.");
        return;
      }

      const gen = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination: search.destination,
          startDate: search.dateRange.start,
          endDate: search.dateRange.end,
          people: search.people,
          budgetMax: search.budgetMax,
        }),
      }).catch(() => null);

      if (!gen || !gen.ok) {
        const data = (await gen?.json().catch(() => null)) as { error?: string } | null;
        if (!ignore) {
          setLoading(false);
          setError(data?.error ?? "No s’ha pogut generar el viatge.");
        }
        return;
      }

      const { tripId } = (await gen.json()) as { tripId: string };

      const detail = await fetch(`/api/trips/${tripId}`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      }).catch(() => null);

      if (!detail || !detail.ok) {
        if (!ignore) {
          setLoading(false);
          setError("Viatge creat, però no s’ha pogut carregar el detall.");
        }
        return;
      }

      const json = (await detail.json()) as { trip: TripDTO };
      if (!ignore) {
        setTrip(json.trip);
        setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [search.budgetMax, search.dateRange?.end, search.dateRange?.start, search.destination, search.people]);

  return (
    <PageWrapper className="py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide">
            El teu viatge
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
            Cost total visible, dia a dia, sense sorpreses.
          </p>
        </div>

        <Link href={trip ? `/trip/${trip.id}/surprise` : "/search"}>
          <Button variant="secondary" size="md" disabled={!trip}>
            Mode sorpresa
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card className="p-10">
          <div className="flex items-center gap-3">
            <Spinner />
            <div>
              <div className="font-display text-lg font-extrabold tracking-wide">
                Generant itinerari…
              </div>
              <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Estem tancant vol, hotel i activitats dins el teu pressupost.
              </div>
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-8">
          <div className="font-display text-xl font-extrabold tracking-wide">
            No ho hem pogut completar
          </div>
          <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
            {error}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => router.push("/search")}>
              Tornar al cercador
            </Button>
          </div>
        </Card>
      ) : trip ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <BudgetBreakdown
              total={trip.totalCost}
              flight={trip.flightCost}
              hotel={trip.hotelCost}
              activities={trip.activitiesCost}
              daily={trip.dailyCost}
              budgetMax={search.budgetMax}
            />
          </div>

          <div>
            <DayAccordion days={trip.days} />
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40">
        <PageWrapper>
          <div className="pointer-events-auto">
            <Button className="w-full" size="lg" disabled={!trip}>
              Reserva tot
            </Button>
          </div>
        </PageWrapper>
      </div>
    </PageWrapper>
  );
}

