"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface SurpriseRevealProps {
  destination: string;
  days: Array<{ dayNumber: number; title: string }>;
  onSeeBudget: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export function SurpriseReveal({ destination, days, onSeeBudget }: SurpriseRevealProps) {
  const [phase, setPhase] = React.useState<"countdown" | "reveal" | "done">(
    "countdown"
  );
  const [count, setCount] = React.useState(3);
  const [revealIndex, setRevealIndex] = React.useState(0);

  React.useEffect(() => {
    if (phase !== "countdown") return;
    const t = window.setInterval(() => {
      setCount((c) => c - 1);
    }, 900);
    return () => window.clearInterval(t);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) setPhase("reveal");
  }, [count, phase]);

  React.useEffect(() => {
    if (phase !== "reveal") return;
    const t = window.setInterval(() => {
      setRevealIndex((i) => i + 1);
    }, 700);
    return () => window.clearInterval(t);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== "reveal") return;
    const max = 1 + Math.min(days.length, 3);
    if (revealIndex >= max) setPhase("done");
  }, [days.length, phase, revealIndex]);

  const revealedDays = days.slice(0, Math.max(0, Math.min(revealIndex - 1, 3)));

  return (
    <Card className="relative overflow-hidden p-8 md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_20%,rgba(232,160,74,0.16),transparent_55%),radial-gradient(900px_circle_at_80%_40%,rgba(74,144,184,0.14),transparent_60%)]" />
      <div className="relative">
        <AnimatePresence mode="wait">
          {phase === "countdown" ? (
            <motion.div key="countdown" {...fadeUp}>
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Mode sorpresa
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold tracking-wide md:text-4xl">
                Preparant el teu viatge perfecte…
              </div>
              <div className="mt-8 flex items-baseline gap-3">
                <div className="font-display text-6xl font-extrabold tracking-wide">
                  {Math.max(0, count)}
                </div>
                <div className="text-sm text-[color:var(--color-text-muted)]">
                  segons
                </div>
              </div>
            </motion.div>
          ) : phase === "reveal" ? (
            <motion.div key="reveal" {...fadeUp}>
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Revelant…
              </div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-wide md:text-5xl">
                {revealIndex >= 1 ? destination : "—"}
              </div>
              <div className="mt-6 grid gap-2">
                {revealedDays.map((d) => (
                  <div
                    key={d.dayNumber}
                    className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/3 px-4 py-3 text-sm"
                  >
                    <span className="text-[color:var(--color-text-muted)]">
                      Dia {d.dayNumber}
                    </span>{" "}
                    <span className="text-[color:var(--color-text)]">
                      — {d.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" {...fadeUp}>
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Fet
              </div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-wide md:text-5xl">
                {destination}
              </div>
              <div className="mt-3 text-sm text-[color:var(--color-text-muted)]">
                Ja ho tens tot a punt. Mira el pressupost i reserva quan vulguis.
              </div>
              <div className="mt-8">
                <Button size="lg" onClick={onSeeBudget}>
                  Veure pressupost
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

