import * as React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";

import { authOptions } from "@/lib/auth";
import {
  travelOfferQuerySchema,
  getTravelSearchSnapshot,
} from "@/lib/travel-offers";
import { OfferCard } from "@/components/trip/OfferCard";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata = {
  title: "Resultats - PlAIner",
};

function formatDateRange(start: Date | null, end: Date | null) {
  if (!start || !end) return "";
  const fmt = new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const sp = await searchParams;
  const parsed = travelOfferQuerySchema.safeParse({
    destination: first(sp.destination) ?? "",
    city: first(sp.city) ?? undefined,
    countryCode: first(sp.countryCode) ?? undefined,
    startDate: first(sp.startDate) ?? undefined,
    endDate: first(sp.endDate) ?? undefined,
    people: first(sp.people) ?? undefined,
    budgetMax: first(sp.budgetMax) ?? undefined,
    currency: first(sp.currency) ?? undefined,
  });

  if (!parsed.success) {
    return (
      <PageTransition className="mx-auto min-h-dvh max-w-[480px] bg-bg p-6">
        <Link
          href="/plainer-mvp.html"
          className="inline-flex items-center gap-2 text-sm text-muted"
        >
          <ArrowLeft size={16} /> Tornar
        </Link>
        <div className="mt-8 rounded-[var(--r-lg)] border border-border bg-surface p-6 text-center">
          <h1 className="display text-xl font-extrabold text-text">
            Paràmetres no vàlids
          </h1>
          <p className="mt-2 text-sm text-muted">
            Falten dades de cerca o estan mal formades.
          </p>
        </div>
      </PageTransition>
    );
  }

  const query = parsed.data;
  const snapshot = await getTravelSearchSnapshot(query);

  const offers = snapshot.offers;
  const flights = offers.filter((o) => o.type === "TRANSPORT");
  const hotels = offers.filter((o) => o.type === "HOTEL");
  const isEmpty = offers.length === 0;
  const isStale = snapshot.search?.isStale ?? false;

  return (
    <PageTransition className="mx-auto min-h-dvh max-w-[480px] bg-bg pb-24">
      <header
        className="relative px-6 pt-12 pb-6 text-white"
        style={{
          background:
            "linear-gradient(155deg, #0D9E7A 0%, #1a6b9a 56%, #2D3561 100%)",
        }}
      >
        <Link
          href="/plainer-mvp.html"
          aria-label="Tornar"
          className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-white/25"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] opacity-90">
            <MapPin size={12} />
            <span>Resultats</span>
          </div>
          <h1 className="display mt-1 text-3xl font-extrabold tracking-[-0.02em]">
            {query.destination}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-90">
            {snapshot.search?.startDate && snapshot.search?.endDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDateRange(
                  snapshot.search.startDate,
                  snapshot.search.endDate,
                )}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} />
              {query.people}{" "}
              {query.people === 1 ? "viatger" : "viatgers"}
            </span>
            {query.budgetMax ? (
              <span className="opacity-80">
                Pressupost: {query.budgetMax} {query.currency ?? "EUR"}
              </span>
            ) : null}
            {isStale ? <Badge variant="warning">Caché expirada</Badge> : null}
          </div>
        </div>
      </header>

      <main className="px-4 pt-5">
        {isEmpty ? (
          <div className="rounded-[var(--r-lg)] border border-border bg-surface p-8 text-center">
            <h2 className="display text-lg font-extrabold text-text">
              Encara no tenim ofertes
            </h2>
            <p className="mt-2 text-sm text-muted">
              Torna al cercador i prem &quot;Generar viatge&quot; per buscar
              vols i hotels.
            </p>
          </div>
        ) : (
          <>
            {flights.length > 0 ? (
              <section className="mb-6">
                <h2 className="display mb-3 px-1 text-xl font-extrabold tracking-[-0.02em] text-text">
                  Vols ({flights.length})
                </h2>
                <div className="grid gap-3">
                  {flights.map((o) => (
                    <OfferCard
                      key={o.id}
                      type="flight"
                      provider={o.provider}
                      title={o.title}
                      description={o.description}
                      price={o.price}
                      currency={o.currency}
                      bookingUrl={o.bookingUrl}
                      imageUrl={o.imageUrl}
                      availabilityText={o.availabilityText}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {hotels.length > 0 ? (
              <section>
                <h2 className="display mb-3 px-1 text-xl font-extrabold tracking-[-0.02em] text-text">
                  Hotels ({hotels.length})
                </h2>
                <div className="grid gap-3">
                  {hotels.map((o) => (
                    <OfferCard
                      key={o.id}
                      type="hotel"
                      provider={o.provider}
                      title={o.title}
                      description={o.description}
                      price={o.price}
                      currency={o.currency}
                      bookingUrl={o.bookingUrl}
                      imageUrl={o.imageUrl}
                      rating={o.rating}
                      reviewCount={o.reviewCount}
                      availabilityText={o.availabilityText}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </PageTransition>
  );
}
