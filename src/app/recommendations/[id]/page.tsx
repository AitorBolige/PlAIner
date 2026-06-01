import * as React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import type { DayDTO } from "@/components/trip/DayAccordion";
import { EditableItinerary } from "@/components/trip/EditableItinerary";
import { PageTransition } from "@/components/motion/PageTransition";
import { getServerLocale } from "@/lib/i18n-server";
import { localizeCountryName, localizeCity } from "@/lib/i18n";
import { NATIONALITIES } from "@/lib/nationalities";

export async function generateMetadata() {
  const { t } = getServerLocale();
  return {
    title: `${t.recommendationsTitle} - PlAIner`,
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

export default async function RecommendationDetailPage({
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
      user: {
        select: {
          nickname: true,
          nationality: true,
          image: true,
        },
      },
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!trip) notFound();
  if (!trip.isPublic) notFound();
  // Optional: could block the user's own public trips, but it's fine to let them view it here.

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
  const nightsLabel = nights === 1 ? t.nightWord : (locale === "en" ? "nights" : locale === "es" ? "noches" : "nits");

  const flag = trip.user.nationality
    ? NATIONALITIES.find((n) => n.code === trip.user.nationality)?.flag || "🌍"
    : "🌍";
  const authorName = trip.user.nickname || "Anonymous";

  return (
    <PageTransition>
      <div className="flex min-h-[100dvh] flex-col bg-[var(--bg)] pb-[120px]">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-[var(--bg)]/90 px-4 py-4 backdrop-blur-md">
          <Link
            href="/recommendations"
            className="pl-tap flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text)] transition-colors hover:bg-[var(--border-md)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <h1 className="font-display text-lg font-bold tracking-tight text-[var(--text)]">
              {t.communityTrip}
            </h1>
          </div>
          <div className="w-10" />
        </header>

        <main className="mx-auto w-full max-w-[480px] px-4 pt-2">
          {/* Destination Hero */}
          <div className="relative mb-6 overflow-hidden rounded-[var(--r-xl)] bg-[var(--surface)] p-5 shadow-sm border border-[var(--border)]">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text)]">
                {localizedCity}
                {trip.country && (
                  <span className="ml-2 font-display text-lg font-medium text-[var(--text-muted)]">
                    {localizeCountryName(trip.country, locale)}
                  </span>
                )}
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-sunken)] px-3 py-1.5 border border-[var(--border)] shadow-sm">
                <Calendar size={14} className="text-[var(--green)]" />
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {formatDateRange(trip.startDate, trip.endDate, locale)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-sunken)] px-3 py-1.5 border border-[var(--border)] shadow-sm">
                <MapPin size={14} className="text-[var(--green)]" />
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {nights} {nightsLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-sunken)] px-3 py-1.5 border border-[var(--border)] shadow-sm">
                <Users size={14} className="text-[var(--green)]" />
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {trip.people} {t.people}
                </span>
              </div>
            </div>

            {/* Author info inside header */}
            <div className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-4">
              {trip.user.image ? (
                <img
                  src={trip.user.image}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--green-subtle)] text-sm font-bold text-[var(--green)]">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                {t.authorLabel} <span className="font-bold text-[var(--text)]">{authorName}</span> {flag}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <BudgetBreakdown
              total={trip.totalCost}
              flight={trip.flightCost}
              hotel={trip.hotelCost}
              activities={trip.activitiesCost}
              daily={trip.dailyCost}
            />
          </div>

          {days.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 ml-1 font-display text-xl font-bold text-[var(--text)]">
                Itinerari
              </h2>
              <EditableItinerary 
                tripId={trip.id} 
                initialDays={days} 
                readonly 
              />
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
