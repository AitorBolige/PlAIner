"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Plane, Hotel, Star, Check, Heart, Loader2, Sparkles } from "lucide-react";

import { usePlan, type Offer } from "@/components/plan/PlanProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  computeCostBreakdown,
  generateItinerary,
  remainingActivitiesBudget,
  saveTrip,
  type Itinerary,
} from "@/lib/plan-flow";

type Step = "flights" | "hotels" | "summary";

function money(value: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function SelectableOffer({
  offer,
  selected,
  onSelect,
}: {
  offer: Offer;
  selected: boolean;
  onSelect: () => void;
}) {
  const isHotel = offer.type === "HOTEL";
  const Icon = isHotel ? Hotel : Plane;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="w-full text-left"
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
                  <Check size={12} /> Triat
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
            {money(offer.price, offer.currency)}
            {isHotel ? <span className="text-xs font-normal text-muted"> /nit</span> : null}
          </div>
        </div>
      </Card>
    </motion.button>
  );
}

export function Picker() {
  const router = useRouter();
  const plan = usePlan();
  const {
    offers,
    offersError,
    destination,
    dates,
    people,
    budget,
    preferences,
    selectedFlight,
    selectedHotel,
    itinerary,
    itineraryLoading,
  } = plan;

  const [step, setStep] = React.useState<Step>("flights");
  const [fav, setFav] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
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
    const remaining = remainingActivitiesBudget(budget, people, selectedFlight, selectedHotel);
    plan.setItineraryLoading(true);
    void generateItinerary({
      destination: destination.city,
      startDate: dates.start,
      endDate: dates.end,
      people,
      remainingBudget: remaining,
      preferences,
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

  const costs = computeCostBreakdown(
    selectedFlight,
    selectedHotel,
    itinerary as Itinerary | null,
    people,
  );

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
    });
    if (!id) {
      toast.error(error ?? "No s'ha pogut desar el viatge.");
      setSaving(false);
      return;
    }
    if (fav) {
      await fetch(`/api/trips/${id}/favorite`, { method: "POST" }).catch(() => null);
    }
    toast.success("Viatge desat!");
    router.push("/trips");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-14">
        <button
          type="button"
          onClick={back}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-[color:var(--surface-2)] text-text"
          aria-label="Enrere"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="display truncate text-[19px] font-extrabold tracking-[-0.02em] text-text">
            {destination?.city ?? "El teu viatge"}
          </div>
          <div className="truncate text-xs text-muted">
            {dates ? `${dates.days} dies · ${people} persones · ${budget} €/p.` : ""}
          </div>
        </div>
      </div>

      {/* Step label */}
      <div className="px-5 pt-4">
        <div className="micro text-[color:var(--green)]">
          {step === "flights" ? "PAS 1 · TRANSPORT" : step === "hotels" ? "PAS 2 · ALLOTJAMENT" : "PAS 3 · RESUM"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
        {offersError && step !== "summary" ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted">{offersError}</p>
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div key={step} {...stepAnim}>
        {step === "flights" ? (
          <div className="grid gap-3">
            {flights.length === 0 && !offersError ? (
              <Card className="p-6 text-center text-sm text-muted">Cap transport disponible.</Card>
            ) : null}
            {flights.map((o) => (
              <SelectableOffer
                key={o.id}
                offer={o}
                selected={selectedFlight?.id === o.id}
                onSelect={() => {
                  plan.setSelectedFlight(o);
                  setStep("hotels");
                }}
              />
            ))}
          </div>
        ) : null}

        {step === "hotels" ? (
          <div className="grid gap-3">
            {hotels.length === 0 && !offersError ? (
              <Card className="p-6 text-center text-sm text-muted">Cap allotjament disponible.</Card>
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
              />
            ))}
          </div>
        ) : null}

        {step === "summary" ? (
          <div className="grid gap-4">
            {/* Cost breakdown */}
            <Card className="p-4">
              <div className="micro text-[color:var(--green)]">RESUM DE COSTOS</div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Transport ({people} pers.)</span>
                  <span className="font-semibold text-text">{money(costs.flightCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Allotjament</span>
                  <span className="font-semibold text-text">{money(costs.hotelCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Activitats i gastronomia</span>
                  <span className="font-semibold text-text">
                    {itineraryLoading ? "…" : money(costs.activitiesCost)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2">
                  <span className="display font-extrabold text-text">Total del viatge</span>
                  <span className="display text-lg font-extrabold text-[color:var(--green-deep)]">
                    {itineraryLoading ? "…" : money(costs.grandTotal)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Itinerary preview */}
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[color:var(--green)]" />
                <span className="display text-base font-bold text-text">Itinerari</span>
              </div>
              {itineraryLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Loader2 size={16} className="animate-spin" /> Preparant el teu itinerari…
                </div>
              ) : itinerary && (itinerary as Itinerary).days?.length ? (
                <p className="mt-2 text-sm text-muted">
                  {(itinerary as Itinerary).trip_title
                    ? `${(itinerary as Itinerary).trip_title} · `
                    : ""}
                  {(itinerary as Itinerary).days!.length} dies planificats.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">No s&apos;ha pogut generar l&apos;itinerari.</p>
              )}
            </Card>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => setFav((f) => !f)}
              className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-4 py-2 text-sm text-text"
            >
              <Heart
                size={16}
                className={fav ? "text-[color:#E85D3A]" : "text-muted"}
                fill={fav ? "#E85D3A" : "none"}
              />
              {fav ? "Marcat com a favorit" : "Marcar com a favorit"}
            </button>
          </div>
        ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save bar (summary only) */}
      {step === "summary" ? (
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] border-t border-border bg-surface p-4">
          <Button
            type="button"
            className="w-full normal-case tracking-normal"
            isLoading={saving}
            disabled={itineraryLoading || saving}
            onClick={onSave}
          >
            {saving ? "Desant…" : "Desar viatge"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
