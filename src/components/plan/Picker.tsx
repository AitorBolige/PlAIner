"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Plane,
  TrainFront,
  Bus,
  Car,
  Hotel,
  Star,
  Check,
  Heart,
  Loader2,
  Sparkles,
  ExternalLink,
  Sun,
  Utensils,
  MapPin,
  Moon,
  SearchX,
  RotateCw,
  Globe,
} from "lucide-react";

import { usePlan, type Offer } from "@/components/plan/PlanProvider";
import { TripTransitionOverlay } from "@/components/plan/TripTransitionOverlay";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useLocale } from "@/lib/i18n-client";
import { localizeCity, type Translations } from "@/lib/i18n";
import {
  computeCostBreakdown,
  generateItinerary,
  remainingActivitiesBudget,
  saveTrip,
  type Itinerary,
  type ItineraryDay,
  type ItinerarySlot,
} from "@/lib/plan-flow";
import { convertCurrency, formatMoney } from "@/lib/currency";
import { useCurrency } from "@/lib/use-currency";

/** Pick the right lucide icon for a transport offer based on `transportKind`. */
function transportIcon(kind?: string | null) {
  switch (kind) {
    case "train": return TrainFront;
    case "bus":   return Bus;
    case "car":   return Car;
    default:      return Plane;
  }
}

function displayMoney(
  value: number,
  locale: string,
  userCurrency: string,
  sourceCurrency = userCurrency,
) {
  const converted = convertCurrency(value, sourceCurrency, userCurrency);
  return formatMoney(converted, userCurrency, locale);
}

function SlotRow({
  icon,
  label,
  slot,
  locale,
  userCurrency,
}: {
  icon: React.ReactNode;
  label: string;
  slot?: ItinerarySlot;
  locale: string;
  userCurrency: string;
}) {
  if (!slot?.name) return null;
  const sub = slot.description ?? slot.cuisine;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex-none text-[color:var(--green)]">{icon}</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.06em] text-faint">{label}</div>
        <div className="truncate text-sm font-medium text-text">{slot.name}</div>
        {sub ? <div className="truncate text-xs text-muted">{sub}</div> : null}
      </div>
      {slot.estimated_cost_eur ? (
        <span className="tnum flex-none text-xs font-semibold text-text">
          {displayMoney(slot.estimated_cost_eur, locale, userCurrency, "EUR")}
        </span>
      ) : null}
    </div>
  );
}

function DaySection({
  day,
  index,
  locale,
  t,
  userCurrency,
}: {
  day: ItineraryDay;
  index: number;
  locale: string;
  t: Translations;
  userCurrency: string;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--r-md)] border border-border bg-[color:var(--surface-2)] p-3">
      <div className="mb-2.5 flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--green)] text-[11px] font-bold text-white">
          {day.day_number ?? index + 1}
        </span>
        <span className="display min-w-0 flex-1 truncate text-sm font-bold text-text">
          {day.theme ?? `${t.dayWord} ${index + 1}`}
        </span>
      </div>
      <div className="grid gap-2.5">
        <SlotRow icon={<Sun size={14} />} label={t.slotMorning} slot={day.morning_activity} locale={locale} userCurrency={userCurrency} />
        <SlotRow icon={<Utensils size={14} />} label={t.slotLunch} slot={day.lunch_restaurant} locale={locale} userCurrency={userCurrency} />
        <SlotRow icon={<MapPin size={14} />} label={t.slotAfternoon} slot={day.afternoon_activity} locale={locale} userCurrency={userCurrency} />
        <SlotRow icon={<Moon size={14} />} label={t.slotDinner} slot={day.dinner_restaurant} locale={locale} userCurrency={userCurrency} />
      </div>
    </div>
  );
}

function BookingCard({
  offer,
  label,
  locale,
  t,
  userCurrency,
}: {
  offer: Offer;
  label: string;
  locale: string;
  t: Translations;
  userCurrency: string;
}) {
  const isHotel = offer.type === "HOTEL";
  const Icon = isHotel ? Hotel : transportIcon(offer.transportKind);
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <span
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full"
        style={{
          background: isHotel ? "var(--green-subtle)" : "var(--coral-subtle)",
          color: isHotel ? "var(--green)" : "var(--coral)",
        }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.06em] text-faint">{label}</div>
        <div className="truncate text-sm font-semibold text-text">{offer.title}</div>
        <div className="text-xs text-muted">
          {offer.provider ? `${offer.provider} · ` : ""}
          {displayMoney(offer.price, locale, userCurrency, offer.currency)}
          {isHotel ? (locale === "en" ? " /night" : locale === "es" ? " /noche" : " /nit") : ""}
        </div>
      </div>
      {offer.bookingUrl ? (
        <a
          href={offer.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-none items-center gap-1 rounded-full bg-[color:var(--green)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          {t.reserve} <ExternalLink size={12} />
        </a>
      ) : null}
    </Card>
  );
}

type Step = "flights" | "hotels" | "summary";

// money helper is defined at the top

function PickerNotice({
  title,
  sub,
  onRetry,
  retryLabel,
}: {
  title: string;
  sub?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-faint">
        <SearchX size={26} />
      </span>
      <div>
        <div className="display text-base font-bold text-text">{title}</div>
        {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
      </div>
      {onRetry ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onRetry}
          className="normal-case tracking-normal"
        >
          <span className="inline-flex items-center gap-1.5">
            <RotateCw size={14} /> {retryLabel ?? "Tornar a cercar"}
          </span>
        </Button>
      ) : null}
    </Card>
  );
}

function SelectableOffer({
  offer,
  selected,
  onSelect,
  locale,
  userCurrency,
}: {
  offer: Offer;
  selected: boolean;
  onSelect: () => void;
  locale: string;
  userCurrency: string;
}) {
  const isHotel = offer.type === "HOTEL";
  const Icon = isHotel ? Hotel : transportIcon(offer.transportKind);
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="w-full text-left"
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <Card
        className="flex overflow-hidden p-0 transition-shadow"
        style={{
          borderColor: selected ? "var(--green)" : "var(--border)",
          borderWidth: 2,
          boxShadow: selected
            ? "0 10px 30px rgba(13,158,122,0.22)"
            : "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {offer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.imageUrl} alt="" className="h-28 w-28 flex-shrink-0 object-cover" />
        ) : (
          <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center bg-[color:var(--surface-2)] text-faint">
            <Icon size={26} />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] text-faint">{offer.provider}</span>
              {selected ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--green)]"
                >
                  <Check size={12} /> {locale === "en" ? "Chosen" : locale === "es" ? "Elegido" : "Triat"}
                </motion.span>
              ) : null}
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-text">{offer.title}</h3>
            {offer.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{offer.description}</p>
            ) : null}
            {offer.rating != null ? (
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                <Star size={12} className="text-[color:var(--gold)]" fill="currentColor" />
                <span className="font-semibold text-text">{offer.rating.toFixed(1)}</span>
                {offer.reviewCount ? <span>({offer.reviewCount})</span> : null}
              </div>
            ) : null}
          </div>
          <div className="display mt-2 text-lg font-extrabold tracking-[-0.02em] text-text">
            {displayMoney(offer.price, locale, userCurrency, offer.currency)}
            {isHotel ? <span className="text-xs font-normal text-muted"> {locale === "en" ? " /night" : locale === "es" ? " /noche" : " /nit"}</span> : null}
          </div>
        </div>
      </Card>
    </motion.button>
  );
}

export function Picker() {
  const router = useRouter();
  const plan = usePlan();
  const { locale, t } = useLocale();
  const [userCurrency] = useCurrency();
  const {
    offers,
    offersError,
    destination,
    dates,
    people,
    budget,
    preferences,
    travelerAgeGroups,
    selectedFlight,
    selectedHotel,
    origin,
    itinerary,
    itineraryLoading,
  } = plan;

  const [step, setStep] = React.useState<Step>("flights");
  const [fav, setFav] = React.useState(false);
  const [isPublic, setIsPublic] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // ─── Transition overlays ────────────────────────────────────────────────────
  const [showTransitionOverlay, setShowTransitionOverlay] = React.useState(false);
  const [destCoords, setDestCoords] = React.useState<[number, number] | null>(null);

  // Geocode destination once we have it
  React.useEffect(() => {
    if (!destination?.city) return;
    fetch(`/api/geocode?q=${encodeURIComponent(destination.city)}&dest=1`)
      .then((r) => r.json())
      .then((d: [number, number] | null) => {
        if (Array.isArray(d) && d.length === 2) setDestCoords(d);
      })
      .catch(() => null);
  }, [destination?.city]);
  const reduce = useReducedMotion();
  const stepAnim = reduce
    ? {}
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  const flights = React.useMemo(() => (offers ?? []).filter((o) => o.type === "TRANSPORT"), [offers]);
  const hotels = React.useMemo(() => (offers ?? []).filter((o) => o.type === "HOTEL"), [offers]);

  // Generate the itinerary once we reach the summary with both selections.
  React.useEffect(() => {
    if (step !== "summary" || !destination || !dates) return;
    if (itinerary || itineraryLoading) return;
    const remaining = remainingActivitiesBudget(budget, people, selectedFlight, selectedHotel, dates.days);
    plan.setItineraryLoading(true);
    void generateItinerary({
      destination: destination.city,
      startDate: dates.start,
      endDate: dates.end,
      people,
      remainingBudget: remaining,
      preferences,
      travelerAgeGroups,
      locale,
    }).then(({ itinerary: it, error }) => {
      plan.setItinerary(it);
      plan.setItineraryLoading(false);
      if (error) toast.error(error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function back() {
    if (step === "summary") setStep("hotels");
    else if (step === "hotels") setStep("flights");
    else plan.reset();
  }

  // Re-run the search (remounts GeneratingScreen → fresh fetch).
  function retry() {
    plan.setStep("generating");
  }

  const costs = computeCostBreakdown(
    selectedFlight,
    selectedHotel,
    itinerary as Itinerary | null,
    people,
    dates?.days ?? 1,
  );
  const totalBudget = Math.round(budget * people);
  const displayGrandTotal =
    convertCurrency(
      costs.flightCost,
      selectedFlight?.currency ?? userCurrency,
      userCurrency,
    ) +
    convertCurrency(
      costs.hotelCost,
      selectedHotel?.currency ?? userCurrency,
      userCurrency,
    ) +
    convertCurrency(costs.activitiesCost, "EUR", userCurrency);
  const displayTotalBudget = convertCurrency(totalBudget, "EUR", userCurrency);
  const usagePct =
    displayTotalBudget > 0
      ? Math.min(100, Math.round((displayGrandTotal / displayTotalBudget) * 100))
      : 0;
  const overBudget = displayGrandTotal > displayTotalBudget;

  async function onSave() {
    if (!destination || !dates) return;
    setSaving(true);
    const { id, error } = await saveTrip({
      destination,
      startDate: dates.start,
      endDate: dates.end,
      days: dates.days,
      people,
      costs,
      itinerary: itinerary as Itinerary | null,
      travelerAgeGroups,
      flightOffer: selectedFlight,
      hotelOffer: selectedHotel,
      isPublic,
    });
    if (!id) {
      toast.error(error ?? t.tripSaveFailed);
      setSaving(false);
      return;
    }
    if (fav) {
      await fetch(`/api/trips/${id}/favorite`, { method: "POST" }).catch(() => null);
    }
    toast.success(t.tripSaved);
    router.push("/trips");
  }

  const localizedDest = destination ? localizeCity(destination.city, locale) : "";

  return (
    <>
    {/* ── Unified flight + hotel transition overlay ── */}
    {showTransitionOverlay && destination && (
      <TripTransitionOverlay
        flightOffer={selectedFlight}
        originCode={origin}
        initialLocale={locale}
        transportKind={(plan.transport?.id as "plane" | "train" | "bus" | "car" | undefined) ?? "plane"}
        destCity={localizedDest}
        destCoords={destCoords}
        hotels={hotels}
        onHotelSelected={(hotel) => {
          plan.setSelectedHotel(hotel);
          setStep("summary");
        }}
        onComplete={() => {
          setShowTransitionOverlay(false);
        }}
      />
    )}

    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-14">
        <button
          type="button"
          onClick={back}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-[color:var(--surface-2)] text-text"
          aria-label={t.backWord}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="display truncate text-[19px] font-extrabold tracking-[-0.02em] text-text">
            {destination ? localizeCity(destination.id, locale) : (locale === "en" ? "Your Trip" : locale === "es" ? "Tu Viaje" : "El teu viatge")}
          </div>
          <div className="truncate text-xs text-muted">
            {dates
              ? `${dates.days} ${dates.days === 1 ? t.day : t.days} · ${people} ${t.peopleCount(people).toLowerCase()} · ${displayMoney(budget, locale, userCurrency, "EUR")}/${t.perPersonWord}`
              : ""}
          </div>
        </div>
      </div>

      {/* Step label */}
      <div className="px-5 pt-4">
        <div className="micro text-[color:var(--green)]">
          {step === "flights" ? t.stepTransport : step === "hotels" ? t.stepAccommodation : t.stepSummary}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
        {offersError && step !== "summary" ? (
          <PickerNotice
            title={locale === "en" ? "No offers found" : locale === "es" ? "No hemos encontrado ofertas" : "No hem trobat ofertes"}
            sub={offersError}
            onRetry={retry}
            retryLabel={t.searchAgain}
          />
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div key={step} {...stepAnim}>
        {step === "flights" ? (
          <motion.div
            className="grid gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {flights.length === 0 && !offersError ? (
              <PickerNotice
                title={t.noTransportTitle}
                sub={t.noTransportSub}
                onRetry={retry}
                retryLabel={t.searchAgain}
              />
            ) : null}
            {flights.map((o) => (
              <SelectableOffer
                key={o.id}
                offer={o}
                selected={selectedFlight?.id === o.id}
                onSelect={() => {
                  plan.setSelectedFlight(o);
                  setShowTransitionOverlay(true);
                }}
                locale={locale}
                userCurrency={userCurrency}
              />
            ))}
          </motion.div>
        ) : null}

        {step === "hotels" ? (
          <motion.div
            className="grid gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {hotels.length === 0 && !offersError ? (
              <PickerNotice
                title={t.noHotelTitle}
                sub={t.noHotelSub}
                onRetry={retry}
                retryLabel={t.searchAgain}
              />
            ) : null}
            {hotels.map((o) => (
              <SelectableOffer
                key={o.id}
                offer={o}
                selected={selectedHotel?.id === o.id}
                onSelect={() => {
                  plan.setSelectedHotel(o);
                  setStep("summary");
                }}
                locale={locale}
                userCurrency={userCurrency}
              />
            ))}
          </motion.div>
        ) : null}

        {step === "summary" ? (
          <div className="grid gap-4">
            {/* Cost breakdown */}
            <Card className="p-4">
              <div className="micro text-[color:var(--green)]">{t.costSummary}</div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">{t.transport} ({people} {locale === "en" ? "people" : "pers."})</span>
                  <span className="tnum font-semibold text-text">
                    {displayMoney(
                      costs.flightCost,
                      locale,
                      userCurrency,
                      selectedFlight?.currency ?? userCurrency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t.accommodation}</span>
                  <span className="tnum font-semibold text-text">
                    {displayMoney(
                      costs.hotelCost,
                      locale,
                      userCurrency,
                      selectedHotel?.currency ?? userCurrency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t.activitiesGastronomy}</span>
                  <span className="tnum font-semibold text-text">
                    {itineraryLoading
                      ? "…"
                      : displayMoney(costs.activitiesCost, locale, userCurrency, "EUR")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2">
                  <span className="display font-extrabold text-text">{t.tripTotal}</span>
                  <span className="display tnum text-lg font-extrabold text-[color:var(--green-deep)]">
                    {itineraryLoading
                      ? "…"
                      : formatMoney(displayGrandTotal, userCurrency, locale)}
                  </span>
                </div>
              </div>

              {/* Budget usage bar */}
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: overBudget ? "#DC2626" : "var(--green)" }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${usagePct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px]">
                  <span className="text-faint">
                    {t.budgetLabel}{" "}
                    {formatMoney(displayTotalBudget, userCurrency, locale)}
                  </span>
                  <span
                    className="tnum font-semibold"
                    style={{ color: overBudget ? "#DC2626" : "var(--text-muted)" }}
                  >
                    {overBudget ? `${t.exceeded} · ` : ""}
                    {usagePct}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Selected flight & hotel — reservable */}
            {selectedFlight ? (
              <BookingCard offer={selectedFlight} label={locale === "en" ? "YOUR TRANSPORT" : locale === "es" ? "TU TRANSPORTE" : "EL TEU TRANSPORT"} locale={locale} t={t} userCurrency={userCurrency} />
            ) : null}
            {selectedHotel ? (
              <BookingCard offer={selectedHotel} label={locale === "en" ? "YOUR ACCOMMODATION" : locale === "es" ? "TU ALOJAMIENTO" : "EL TEU ALLOTJAMENT"} locale={locale} t={t} userCurrency={userCurrency} />
            ) : null}

            {/* Day-by-day itinerary */}
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[color:var(--green)]" />
                <span className="display text-base font-bold text-text">{t.dayByDayItinerary}</span>
              </div>
              {itineraryLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Loader2 size={16} className="animate-spin" /> {t.preparingItinerary}
                </div>
              ) : itinerary && (itinerary as Itinerary).days?.length ? (
                <div className="mt-3 grid gap-3">
                  {(itinerary as Itinerary).trip_title ? (
                    <p className="text-sm font-medium text-muted">
                      {(itinerary as Itinerary).trip_title}
                    </p>
                  ) : null}
                  {(itinerary as Itinerary).days!.map((d, i) => (
                    <DaySection key={i} day={d} index={i} locale={locale} t={t} userCurrency={userCurrency} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">{t.noItinerary}</p>
              )}
            </Card>

            {/* Action Toggles */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFav((f) => !f)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text transition-colors"
              >
                <Heart
                  size={16}
                  className={fav ? "text-[color:#E85D3A]" : "text-muted"}
                  fill={fav ? "#E85D3A" : "none"}
                />
                {fav ? t.markedFavorite : t.markFavorite}
              </button>

              <button
                type="button"
                onClick={() => setIsPublic((p) => !p)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text transition-colors"
              >
                <Globe
                  size={16}
                  className={isPublic ? "text-[color:var(--green)]" : "text-muted"}
                />
                {isPublic ? t.shareWithCommunity : t.shareWithCommunity}
              </button>
            </div>
          </div>
        ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save bar (summary only) */}
      {step === "summary" ? (
        <motion.div
          initial={reduce ? false : { y: 90 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="safe-bottom fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] border-t border-border bg-surface p-4 shadow-[var(--shadow-lg)]">
          <Button
            type="button"
            className="w-full normal-case tracking-normal"
            isLoading={saving}
            disabled={itineraryLoading || saving}
            onClick={onSave}
          >
            {saving ? t.savingLabel : t.saveTripLabel}
          </Button>
        </motion.div>
      ) : null}
    </div>
    </>
  );
}
