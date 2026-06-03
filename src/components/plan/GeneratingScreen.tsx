"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plane, TrainFront, Bus, Car, Hotel, Sparkles, MapPin } from "lucide-react";

import { usePlan } from "@/components/plan/PlanProvider";
import { fetchOffers, buildMockOffers } from "@/lib/plan-flow";
import { getStoredCurrency } from "@/lib/currency";
import { useLocale } from "@/lib/i18n-client";
import { localizeCity } from "@/lib/i18n";

export function GeneratingScreen() {
  const plan = usePlan();
  const { locale, t } = useLocale();
  const { destination, dates, people, budget, origin } = plan;
  const reduce = useReducedMotion();
  const ran = React.useRef(false);
  const done = React.useRef(false);
  const [phase, setPhase] = React.useState(0);

  const transportKind = plan.transport?.id ?? "plane";
  const transportPhase = React.useMemo(() => {
    switch (transportKind) {
      case "train": return { icon: TrainFront, label: t.genSearchingTrains };
      case "bus":   return { icon: Bus,        label: t.genSearchingBuses };
      case "car":   return { icon: Car,        label: t.genSearchingRoute };
      default:      return { icon: Plane,      label: t.genSearchingFlights };
    }
  }, [transportKind, t]);

  const PHASES = React.useMemo(() => [
    transportPhase,
    { icon: Hotel, label: t.genComparingHotels },
    { icon: Sparkles, label: t.genDesigningPlan },
  ], [transportPhase, t]);

  const SAFETY_TIMEOUT_MS = 42_000;

  // Cycle the phase messages while loading.
  React.useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 1900);
    return () => clearInterval(id);
  }, [PHASES.length]);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!destination || !dates) {
      plan.setStep("search");
      return;
    }

    const userCurrency = getStoredCurrency();

    const advance = (offers: Parameters<typeof plan.setOffers>[0], error: string | null) => {
      if (done.current) return;
      done.current = true;
      plan.setOffers(offers);
      plan.setOffersError(error);
      plan.setOffersLoading(false);
      plan.setStep("picker");
    };

    // Hard safety net: never stuck and never empty — fall back to demo offers.
    const safety = setTimeout(() => {
      advance(
        buildMockOffers({
          destination,
          startDate: dates.start,
          endDate: dates.end,
          people,
          budget,
          origin,
          currency: userCurrency,
          transportId: plan.transport?.id,
        }),
        null,
      );
    }, SAFETY_TIMEOUT_MS);

    plan.setOffersLoading(true);
    plan.setOffersError(null);

    void fetchOffers({
      destination,
      startDate: dates.start,
      endDate: dates.end,
      people,
      budget,
      origin,
      currency: userCurrency,
      transportId: plan.transport?.id,
    }).then(({ offers, error }) => {
      clearTimeout(safety);
      advance(offers, error);
    });

    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Phase = PHASES[phase].icon;

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8 text-center text-white"
      style={{
        background:
          "linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 58%, #2D3561 100%)",
      }}
    >
      {/* Ambient floating orbs */}
      {!reduce ? (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute h-64 w-64 rounded-full bg-white/10 blur-2xl"
            style={{ top: "12%", left: "-10%" }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-black/10 blur-3xl"
            style={{ bottom: "8%", right: "-12%" }}
            animate={{ x: [0, -24, 0], y: [0, -18, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : null}

      {/* Pulsing concentric loader */}
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        {!reduce
          ? [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute rounded-full border border-white/40"
                style={{ width: 128, height: 128 }}
                animate={{ scale: [0.5, 1.25], opacity: [0.55, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.8,
                }}
              />
            ))
          : null}
        <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.6, rotate: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Phase size={34} strokeWidth={2} />
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Cycling message */}
      <div className="h-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="display text-xl font-extrabold tracking-[-0.02em]"
          >
            {PHASES[phase].label}
          </motion.div>
        </AnimatePresence>
      </div>

      {destination ? (
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80">
          <MapPin size={14} />
          {localizeCity(destination.id, locale)}
          {dates ? ` · ${t.daysCount(dates.days)} · ${t.peopleCount(people)}` : ""}
        </div>
      ) : null}

      {/* Progress shimmer bar */}
      {!reduce ? (
        <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full w-1/2 rounded-full bg-white/80"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ) : null}
    </div>
  );
}
