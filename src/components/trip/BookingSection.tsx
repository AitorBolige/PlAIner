"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, Hotel, Plane, Star } from "lucide-react";

export interface OfferSnapshot {
  id?: string;
  provider: string;
  title: string;
  description?: string | null;
  price: number;
  bookingUrl: string;
  imageUrl?: string | null;
  rating?: number | null;
}

interface BookingCardProps {
  type: "flight" | "hotel";
  offer: OfferSnapshot | null;
  fallbackUrl: string;
  fallbackTitle: string;
  fallbackSub: string;
  initialBooked: boolean;
  tripId: string;
  field: "flightBooked" | "hotelBooked";
}

function euro(v: number) {
  return `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;
}

function BookingCard({
  type,
  offer,
  fallbackUrl,
  fallbackTitle,
  fallbackSub,
  initialBooked,
  tripId,
  field,
}: BookingCardProps) {
  const [booked, setBooked] = React.useState(initialBooked);
  const [marking, setMarking] = React.useState(false);

  const isHotel = type === "hotel";
  const icon = isHotel ? (
    <Hotel size={20} />
  ) : (
    <Plane size={20} />
  );
  const iconColor = isHotel ? "var(--green)" : "var(--coral)";
  const iconBg = isHotel ? "var(--green-subtle)" : "var(--coral-subtle)";

  const url = offer?.bookingUrl ?? fallbackUrl;
  const title = offer?.title ?? fallbackTitle;
  const sub = offer?.description ?? fallbackSub;

  async function markBooked() {
    setMarking(true);
    const next = !booked;
    setBooked(next);
    await fetch(`/api/trips/${tripId}/booking`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    }).catch(() => null);
    setMarking(false);
  }

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Offer image strip (if available) */}
      {offer?.imageUrl ? (
        <div className="relative h-[120px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 100%)",
            }}
          />
          {booked && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--green)] px-2.5 py-1 text-[11px] font-bold text-white">
              <CheckCircle2 size={12} /> Reservat
            </span>
          )}
        </div>
      ) : null}

      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <span
            className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full"
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </span>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--text-faint)]">
                {offer?.provider ?? (isHotel ? "Allotjament" : "Vol")}
              </span>
              {offer?.rating ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-[color:var(--gold)]">
                  <Star size={10} fill="currentColor" />
                  {offer.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[15px] font-semibold leading-snug text-text line-clamp-2">
              {title}
            </p>
            {sub && !offer?.imageUrl ? (
              <p className="mt-0.5 text-xs text-muted line-clamp-1">{sub}</p>
            ) : null}
          </div>

          {/* Price */}
          {offer ? (
            <span className="flex-none text-right">
              <span className="block font-display text-[17px] font-extrabold text-text">
                {euro(offer.price)}
              </span>
              <span className="block text-[10px] text-muted">per persona</span>
            </span>
          ) : null}
        </div>

        {/* Action row */}
        <div className="mt-3 flex items-center gap-2">
          {booked ? (
            <button
              type="button"
              disabled={marking}
              onClick={markBooked}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--green)] py-2.5 text-sm font-bold text-[color:var(--green)] transition-colors hover:bg-[color:var(--green-subtle)] disabled:opacity-60"
            >
              <CheckCircle2 size={15} />
              Reservat
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markBooked}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold text-white transition-all"
              style={{
                background: "var(--green)",
                boxShadow: "var(--shadow-cta)",
              }}
            >
              Pagar ara <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface BookingSectionProps {
  tripId: string;
  flightOffer: OfferSnapshot | null;
  hotelOffer: OfferSnapshot | null;
  flightBooked: boolean;
  hotelBooked: boolean;
  flightFallbackUrl: string;
  hotelFallbackUrl: string;
  destination: string;
  people: number;
  nights: number;
}

export function BookingSection({
  tripId,
  flightOffer,
  hotelOffer,
  flightBooked,
  hotelBooked,
  flightFallbackUrl,
  hotelFallbackUrl,
  destination,
  people,
  nights,
}: BookingSectionProps) {
  const allBooked = flightBooked && hotelBooked;

  return (
    <section className="mt-6 overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface shadow-[var(--shadow-sm)]">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-base font-extrabold tracking-[-0.02em] text-text">
              Reserva el teu viatge
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {allBooked
                ? "Tot reservat — bon viatge! 🎉"
                : "Assegura vols i allotjament ara."}
            </p>
          </div>
          {allBooked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--green-subtle)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--green)]">
              <CheckCircle2 size={12} /> Tot llest
            </span>
          )}
        </div>
      </div>

      <BookingCard
        type="flight"
        offer={flightOffer}
        fallbackUrl={flightFallbackUrl}
        fallbackTitle={`Vol cap a ${destination}`}
        fallbackSub={`${people} ${people === 1 ? "viatger" : "viatgers"}`}
        initialBooked={flightBooked}
        tripId={tripId}
        field="flightBooked"
      />

      <BookingCard
        type="hotel"
        offer={hotelOffer}
        fallbackUrl={hotelFallbackUrl}
        fallbackTitle={`Allotjament a ${destination}`}
        fallbackSub={`${nights} ${nights === 1 ? "nit" : "nits"}`}
        initialBooked={hotelBooked}
        tripId={tripId}
        field="hotelBooked"
      />
    </section>
  );
}
