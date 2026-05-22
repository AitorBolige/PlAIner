"use client";

import * as React from "react";

import { usePlan } from "@/components/plan/PlanProvider";
import { fetchOffers } from "@/lib/plan-flow";

export function GeneratingScreen() {
  const plan = usePlan();
  const { destination, dates, people, budget, origin } = plan;
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!destination || !dates) {
      plan.setStep("search");
      return;
    }

    let cancelled = false;
    plan.setOffersLoading(true);
    plan.setOffersError(null);

    void fetchOffers({
      destination,
      startDate: dates.start,
      endDate: dates.end,
      people,
      budget,
      origin,
    }).then(({ offers, error }) => {
      if (cancelled) return;
      plan.setOffers(offers);
      plan.setOffersError(error);
      plan.setOffersLoading(false);
      plan.setStep("picker");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center text-white"
      style={{
        background: "linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 60%, #2D3561 100%)",
      }}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
      <div>
        <div className="display text-2xl font-extrabold tracking-[-0.02em]">
          Buscant les millors ofertes…
        </div>
        <p className="mt-2 text-sm text-white/85">
          {destination ? `Vols i hotels per a ${destination.city}` : "Preparant el teu viatge"}
        </p>
      </div>
    </div>
  );
}
