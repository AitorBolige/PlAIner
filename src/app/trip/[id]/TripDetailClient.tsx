"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ActivityCard } from "@/components/trip/ActivityCard";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import type { DayDTO } from "@/components/trip/DayAccordion";
import { DayMapMock } from "@/components/trip/DayMapMock";

type TripDetailDTO = {
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

export interface TripDetailClientProps {
  trip: TripDetailDTO;
}

function fmtRange(startDate: string, endDate: string) {
  return `${new Date(startDate).toLocaleDateString("ca-ES")} — ${new Date(
    endDate
  ).toLocaleDateString("ca-ES")}`;
}

export function TripDetailClient({ trip }: TripDetailClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") ?? "itinerary";

  const [optimistic, setOptimistic] = React.useState(trip);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [mapDay, setMapDay] = React.useState<number>(() => {
    const first = trip.days.slice().sort((a, b) => a.dayNumber - b.dayNumber)[0];
    return first?.dayNumber ?? 1;
  });

  async function onDelete(activityId: string) {
    setDeleting(activityId);
    const prev = optimistic;

    setOptimistic({
      ...optimistic,
      days: optimistic.days.map((d) => ({
        ...d,
        activities: d.activities.filter((a) => a.id !== activityId),
      })),
    });

    const res = await fetch(`/api/trips/${trip.id}/activities/${activityId}`, {
      method: "DELETE",
    }).catch(() => null);

    setDeleting(null);

    if (!res || !res.ok) {
      setOptimistic(prev);
    } else {
      router.refresh();
    }
  }

  async function onToggleFavorite() {
    await fetch(`/api/trips/${trip.id}/favorite`, { method: "POST" }).catch(
      () => null
    );
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md md:max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Tornar"
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-display text-lg font-extrabold tracking-wide">
            {trip.destination}
          </div>
          <div className="mt-0.5 truncate text-xs text-[color:var(--color-text-muted)]">
            {fmtRange(trip.startDate, trip.endDate)}
          </div>
        </div>
        <button
          type="button"
          aria-label="Favorit"
          onClick={onToggleFavorite}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
        >
          <Heart className="h-5 w-5 text-[color:var(--color-text-muted)]" />
        </button>
      </div>

      <Card className="mb-4 p-2">
        <div className="grid grid-cols-4 gap-2">
          <Link
            href={`/trip/${trip.id}?tab=map`}
            className={[
              "inline-flex h-10 items-center justify-center rounded-full text-sm font-semibold",
              tab === "map"
                ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
            ].join(" ")}
          >
            Mapa
          </Link>
          <Link
            href={`/trip/${trip.id}?tab=itinerary`}
            className={[
              "inline-flex h-10 items-center justify-center rounded-full text-sm font-semibold",
              tab === "itinerary"
                ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
            ].join(" ")}
          >
            Dia a dia
          </Link>
          <Link
            href={`/trip/${trip.id}?tab=budget`}
            className={[
              "inline-flex h-10 items-center justify-center rounded-full text-sm font-semibold",
              tab === "budget"
                ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
            ].join(" ")}
          >
            Pressupost
          </Link>
          <Link
            href={`/trip/${trip.id}?tab=book`}
            className={[
              "inline-flex h-10 items-center justify-center rounded-full text-sm font-semibold",
              tab === "book"
                ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
            ].join(" ")}
          >
            Reserva
          </Link>
        </div>
      </Card>

      {tab === "map" ? (
        <DayMapMock
          days={optimistic.days}
          dayNumber={mapDay}
          onDayChange={setMapDay}
        />
      ) : tab === "budget" ? (
        <BudgetBreakdown
          total={optimistic.totalCost}
          flight={optimistic.flightCost}
          hotel={optimistic.hotelCost}
          activities={optimistic.activitiesCost}
          daily={optimistic.dailyCost}
        />
      ) : tab === "book" ? (
        <Card className="p-6">
          <div className="font-display text-xl font-extrabold tracking-wide">
            Reserva amb un clic
          </div>
          <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
            Tens el viatge tancat. Aquí tens enllaços directes per reservar
            vols i hotel ràpidament.
          </div>
          <div className="mt-6">
            <div className="grid gap-3">
              <a
                className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 text-sm text-[color:var(--color-text)] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                target="_blank"
                rel="noreferrer"
                href={`https://www.skyscanner.net/transport/flights-to/${encodeURIComponent(
                  trip.destination.toLowerCase()
                )}/`}
              >
                Vols a {trip.destination} (Skyscanner)
              </a>
              <a
                className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 text-sm text-[color:var(--color-text)] hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                target="_blank"
                rel="noreferrer"
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
                  trip.destination
                )}&checkin=${trip.startDate.slice(
                  0,
                  10
                )}&checkout=${trip.endDate.slice(0, 10)}`}
              >
                Hotels a {trip.destination} (Booking.com)
              </a>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {optimistic.days.map((d) => (
            <div key={d.id} className="grid gap-3">
              <div className="font-display text-lg font-extrabold tracking-wide">
                Dia {d.dayNumber} — {d.title}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {d.activities.map((a) => (
                  <div key={a.id} className={deleting === a.id ? "opacity-60" : ""}>
                    <ActivityCard
                      id={a.id}
                      title={a.name}
                      description={a.description}
                      price={a.cost}
                      imageUrl={null}
                      onDelete={onDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

