"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SegmentSelector } from "@/components/onboarding/SegmentSelector";
import { StyleChips } from "@/components/onboarding/StyleChips";
import { BudgetSlider } from "@/components/onboarding/BudgetSlider";
import { DurationSelector } from "@/components/onboarding/DurationSelector";
import { useOnboardingStore } from "@/store/useOnboardingStore";

const steps = [
  { key: "segment", title: "Qui ets?" },
  { key: "styles", title: "Com viatges?" },
  { key: "budget", title: "Quin és el teu pressupost?" },
  { key: "duration", title: "Quina durada vols?" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export function OnboardingWizard() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { ageGroup, travelStyles, budget, duration, setAgeGroup, toggleStyle, setBudget, setDuration } =
    useOnboardingStore();

  const step = steps[index];
  const progressPct = ((index + 1) / steps.length) * 100;

  function canContinue() {
    if (step.key === "segment") return !!ageGroup;
    if (step.key === "styles") return travelStyles.length > 0;
    if (step.key === "budget") return budget >= 200;
    if (step.key === "duration") return !!duration;
    return false;
  }

  async function onContinue() {
    setError(null);
    if (!canContinue()) return;

    if (index < steps.length - 1) {
      setIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ageGroup,
        travelStyles,
        budgetMin: 0,
        budgetMax: budget,
        duration,
      }),
    }).catch(() => null);

    setSubmitting(false);

    if (!res || !res.ok) {
      setError("No hem pogut guardar el teu perfil. Torna-ho a provar.");
      return;
    }

    router.replace("/search");
  }

  return (
    <PageWrapper className="py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-wide">
                Perfil ràpid
              </h1>
              <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                4 passos per personalitzar el teu viatge.
              </p>
            </div>
            <div className="text-sm text-[color:var(--color-text-muted)]">
              {index + 1}/{steps.length}
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[color:var(--color-primary)] transition-all duration-300 ease-[var(--ease-out-premium)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-extrabold tracking-wide">
              {step.title}
            </h2>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0 || submitting}
              className="rounded-full px-4 py-2 text-sm text-[color:var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
            >
              Enrere
            </button>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div key={step.key as StepKey} {...slide}>
                {step.key === "segment" ? (
                  <SegmentSelector value={ageGroup} onChange={setAgeGroup} />
                ) : null}

                {step.key === "styles" ? (
                  <StyleChips value={travelStyles} onToggle={toggleStyle} />
                ) : null}

                {step.key === "budget" ? (
                  <BudgetSlider value={budget} onChange={setBudget} />
                ) : null}

                {step.key === "duration" ? (
                  <DurationSelector value={duration} onChange={setDuration} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {error ? (
            <p className="mt-6 text-sm text-[color:rgba(255,150,150,0.95)]">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-end">
            <Button
              size="lg"
              isLoading={submitting}
              disabled={!canContinue()}
              onClick={onContinue}
            >
              Continuar
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

