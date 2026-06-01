"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, Globe, Hotel, Lock, Plane, Sparkles, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";

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

import type { Translations } from "@/lib/i18n";

interface BookingCardProps {
  type: "flight" | "hotel";
  offer: OfferSnapshot | null;
  fallbackUrl: string;
  fallbackTitle: string;
  fallbackSub: string;
  initialBooked: boolean;
  tripId: string;
  field: "flightBooked" | "hotelBooked";
  nights?: number;
  t: Translations;
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
  nights = 1,
  t,
}: BookingCardProps) {
  const displayMoney = useDisplayMoney();
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
              <CheckCircle2 size={12} /> {t.bookedWord}
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
                {offer?.provider ?? (isHotel ? t.accommodation : t.flightLabel)}
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
                {displayMoney(offer.price)}
              </span>
              <span className="block text-[10px] text-muted">{type === "hotel" ? `× ${t.nightsSuffix(nights)}` : t.perPersonWord}</span>
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
              {t.bookedWord}
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
              {t.payNow} <ExternalLink size={14} />
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
  isPublic: boolean;
  isFromCommunity?: boolean;
  initialLocale?: import("@/lib/i18n").Locale;
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
  isPublic: initialPublic,
  isFromCommunity = false,
  initialLocale,
}: BookingSectionProps) {
  const { t } = useLocale(initialLocale);
  const allBooked = flightBooked && hotelBooked;
  const [isPublic, setIsPublic] = React.useState(initialPublic);
  const [toggling, setToggling] = React.useState(false);

  async function togglePublic() {
    setToggling(true);
    const next = !isPublic;
    setIsPublic(next);
    await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    }).catch(() => setIsPublic(!next));
    setToggling(false);
  }

  return (
    <>
    {isFromCommunity && (
      <div
        className="mt-6 flex items-center gap-3 rounded-[var(--r-xl)] border px-4 py-3"
        style={{
          background: "var(--green-subtle)",
          borderColor: "rgba(13,158,122,0.2)",
        }}
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full" style={{ background: "var(--green)", color: "#fff" }}>
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-text">{t.inspiredByCommunity}</p>
          <p className="text-[11px] text-muted">{t.inspiredByCommunityDesc}</p>
        </div>
      </div>
    )}
    <section className="mt-4 overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface shadow-[var(--shadow-sm)]">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-base font-extrabold tracking-[-0.02em] text-text">
              {t.bookYourTrip}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {allBooked
                ? t.allBooked
                : t.notBookedYetSub}
            </p>
          </div>
          {allBooked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--green-subtle)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--green)]">
              <CheckCircle2 size={12} /> {t.allReady}
            </span>
          )}
        </div>
      </div>

      <BookingCard
        type="flight"
        offer={flightOffer}
        fallbackUrl={flightFallbackUrl}
        fallbackTitle={t.flightToCity(destination)}
        fallbackSub={t.travelerSuffix(people)}
        initialBooked={flightBooked}
        tripId={tripId}
        field="flightBooked"
        t={t}
      />

      <BookingCard
        type="hotel"
        offer={hotelOffer}
        fallbackUrl={hotelFallbackUrl}
        fallbackTitle={t.accommodationInCity(destination)}
        fallbackSub={t.nightsSuffix(nights)}
        initialBooked={hotelBooked}
        tripId={tripId}
        field="hotelBooked"
        nights={nights}
        t={t}
      />

      {/* Share toggle */}
      <button
        type="button"
        disabled={toggling || isFromCommunity}
        onClick={togglePublic}
        className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-60"
        style={{ cursor: isFromCommunity ? "not-allowed" : "pointer" }}
      >
        <span
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full"
          style={{
            background: isFromCommunity ? "var(--surface-2)" : isPublic ? "var(--green-subtle)" : "var(--surface-2)",
            color: isFromCommunity ? "var(--text-faint)" : isPublic ? "var(--green)" : "var(--text-faint)",
          }}
        >
          {isFromCommunity ? <Lock size={16} /> : <Globe size={18} />}
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[14px] font-semibold text-text">
            {t.shareWithCommunity}
          </span>
          <span className="block text-[11px] text-muted">
            {isFromCommunity
              ? t.cantShareCommunityTrip
              : isPublic
              ? t.visibleOnDiscover
              : t.onlyYouCanSee}
          </span>
        </span>
        {isFromCommunity ? (
          <Lock size={16} className="flex-none text-[color:var(--text-faint)]" />
        ) : (
          <span
            className="relative inline-block h-6 w-11 flex-none overflow-hidden rounded-full transition-colors duration-200"
            style={{ background: isPublic ? "var(--green)" : "var(--border-md)" }}
          >
            <span
              className="absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: isPublic ? "translateX(19px)" : "translateX(0px)" }}
            />
          </span>
        )}
      </button>
    </section>
    </>
  );
}
