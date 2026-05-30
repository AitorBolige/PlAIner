import * as React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin, Heart, Plane, Hotel, ExternalLink } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import type { DayDTO } from "@/components/trip/DayAccordion";
import { EditableItinerary } from "@/components/trip/EditableItinerary";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/motion/PageTransition";
import { getServerLocale } from "@/lib/i18n-server";
import { localizeCountryName, localizeCity } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = getServerLocale();
  return {
    title: `${t.tripDetailsTitle} - PlAIner`,
  };
}

function formatDateRange(start: Date, end: Date, locale: string) {
  const code = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "ca-ES";
  const fmt = new Intl.DateTimeFormat(code, {
    day: "numeric",
    month: "short",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function nightsBetween(start: Date, end: Date) {
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { locale, t } = getServerLocale();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!trip) notFound();
  if (trip.userId !== session.user.id) notFound();

  const days: DayDTO[] = trip.days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    activities: d.activities.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      startTime: a.startTime,
      duration: a.duration,
      cost: a.cost,
      category: a.category,
      order: a.order,
    })),
  }));

  const nights = nightsBetween(trip.startDate, trip.endDate);
  const localizedCity = localizeCity(trip.destination, locale);

  // Booking deep-links so the user can still pay for flights/hotels.
  const startIso = trip.startDate.toISOString().slice(0, 10);
  const endIso = trip.endDate.toISOString().slice(0, 10);
  const flightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    locale === "en" ? `flights to ${localizedCity}` : locale === "es" ? `vuelos a ${localizedCity}` : `vols a ${localizedCity}`,
  )}`;
  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    localizedCity,
  )}&checkin=${startIso}&checkout=${endIso}&group_adults=${trip.people}`;

  const nightsLabel = nights === 1 
    ? t.nightWord 
    : (locale === "en" ? "nights" : locale === "es" ? "noches" : "nits");

  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <PageTransition className="relative min-h-dvh w-full max-w-[480px] overflow-hidden border-x border-border bg-bg pb-24">
      <header className="relative h-[260px] overflow-hidden">
        {trip.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.imageUrl}
            alt={localizedCity}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(155deg, #0D9E7A 0%, #1a6b9a 56%, #2D3561 100%)",
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <Link
          href="/trips"
          aria-label={t.backWord}
          className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
        >
          <ArrowLeft size={18} />
        </Link>

        {trip.isFavorite ? (
          <span
            aria-label={t.markedFavorite}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md"
          >
            <Heart size={18} fill="currentColor" />
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 px-6 pb-5 text-white">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] opacity-90">
            <MapPin size={12} />
            <span>{localizeCountryName(trip.country, locale) || t.tripSingle}</span>
          </div>
          <h1 className="display mt-1 text-3xl font-extrabold tracking-[-0.02em]">
            {localizedCity}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-90">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDateRange(trip.startDate, trip.endDate, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} />
              {t.peopleCount(trip.people)}
            </span>
            <span className="opacity-80">
              {nights} {nightsLabel}
            </span>
            {trip.isSurprise ? (
              <Badge variant="warning">{t.surpriseBadge}</Badge>
            ) : null}
          </div>
        </div>
      </header>

      <main className="px-4 pt-5">
        <BudgetBreakdown
          total={trip.totalCost}
          flight={trip.flightCost}
          hotel={trip.hotelCost}
          activities={trip.activitiesCost}
          daily={trip.dailyCost}
          initialLocale={locale}
        />

        {/* Reserva — encara pots pagar vols i allotjament */}
        <section className="mt-6 overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface shadow-[var(--shadow-sm)]">
          <div className="border-b border-border px-4 py-3">
            <h2 className="display text-base font-extrabold tracking-[-0.02em] text-text">
              {t.bookYourTrip}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {t.notBookedYetSub}
            </p>
          </div>

          <a
            href={flightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-2)]"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[color:var(--coral-subtle)] text-[color:var(--coral)]">
              <Plane size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text">{t.bookFlights}</span>
              <span className="block text-xs text-muted">
                {t.towardsCity(trip.people, localizedCity)}
              </span>
            </span>
            <span className="inline-flex flex-none items-center gap-1 text-xs font-semibold text-[color:var(--green)]">
              {t.payWord} <ExternalLink size={13} />
            </span>
          </a>

          <a
            href={hotelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-t border-border px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-2)]"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[color:var(--green-subtle)] text-[color:var(--green)]">
              <Hotel size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text">{t.bookAccommodation}</span>
              <span className="block text-xs text-muted">
                {t.nightsInCity(nights, localizedCity)}
              </span>
            </span>
            <span className="inline-flex flex-none items-center gap-1 text-xs font-semibold text-[color:var(--green)]">
              {t.payWord} <ExternalLink size={13} />
            </span>
          </a>
        </section>

        {days.length > 0 ? (
          <section className="mt-6">
            <h2 className="display mb-3 px-1 text-xl font-extrabold tracking-[-0.02em] text-text">
              {t.itineraryWord}
            </h2>
            <EditableItinerary tripId={trip.id} initialDays={days} initialLocale={locale} />
          </section>
        ) : (
          <section className="mt-6 rounded-[var(--r-lg)] border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              {t.noActivitiesYet}
            </p>
          </section>
        )}
      </main>
      </PageTransition>
    </div>
  );
}
