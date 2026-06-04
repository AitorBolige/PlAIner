import * as React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import type { DayDTO } from "@/components/trip/DayAccordion";
import { TripItineraryView } from "@/components/trip/TripItineraryView";
import { PageTransition } from "@/components/motion/PageTransition";
import { getServerLocale } from "@/lib/i18n-server";
import { localizeCountryName, localizeCity } from "@/lib/i18n";
import { NATIONALITIES } from "@/lib/nationalities";
import { AddToMyTripsButton } from "@/components/recommendations/AddToMyTripsButton";

export async function generateMetadata() {
  const { t } = getServerLocale();
  return { title: `${t.recommendationsTitle} - PlAIner` };
}

function formatDateRange(start: Date, end: Date, locale: string) {
  const code = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "ca-ES";
  const fmt = new Intl.DateTimeFormat(code, { day: "numeric", month: "short" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function nightsBetween(start: Date, end: Date) {
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default async function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const { locale, t } = getServerLocale();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      user: { select: { nickname: true, nationality: true, image: true } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!trip) notFound();
  if (!trip.isPublic) notFound();

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
      mapsUrl: a.mapsUrl,
      menuUrl: a.menuUrl,
    })),
  }));

  const nights = nightsBetween(trip.startDate, trip.endDate);
  const localizedCity = localizeCity(trip.destination, locale);
  const nightsLabel =
    nights === 1
      ? t.nightWord
      : locale === "en"
        ? "nights"
        : locale === "es"
          ? "noches"
          : "nits";

  const flag = trip.user.nationality
    ? NATIONALITIES.find((n) => n.code === trip.user.nationality)?.flag || "🌍"
    : "🌍";
  const authorName = trip.user.nickname || "Anonymous";

  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <PageTransition className="relative min-h-dvh w-full max-w-[480px] overflow-hidden border-x border-border bg-bg pb-24">
        {/* Hero image header */}
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
            href="/recommendations"
            aria-label={t.backWord}
            className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
          >
            <ArrowLeft size={18} />
          </Link>

          {/* Author badge top-right */}
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md">
            {trip.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trip.user.image}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-[11px] font-semibold text-white">
              {authorName} {flag}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 pb-5 text-white">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] opacity-90">
              <MapPin size={12} />
              <span>
                {localizeCountryName(trip.country, locale) || t.tripSingle}
              </span>
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
          />

          {days.length > 0 ? (
            <section className="mt-6">
              <h2 className="display mb-3 px-1 text-xl font-extrabold tracking-[-0.02em] text-text">
                {t.itineraryWord}
              </h2>
              <TripItineraryView
                days={days}
                destination={localizedCity}
                initialLocale={locale}
              />
            </section>
          ) : (
            <section className="mt-6 rounded-[var(--r-lg)] border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted">{t.noActivitiesYet}</p>
            </section>
          )}
        </main>

        {/* Floating CTA */}
        <AddToMyTripsButton
          tripId={trip.id}
          destination={localizedCity}
          isOwn={trip.userId === session.user.id}
          initialLocale={locale}
        />
      </PageTransition>
    </div>
  );
}
