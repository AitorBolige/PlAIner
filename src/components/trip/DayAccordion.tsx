"use client";

import * as React from "react";
import { ChevronDown, Pencil } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n-client";

export interface ActivityDTO {
  id: string;
  name: string;
  description: string | null;
  startTime: string | null;
  duration: number | null;
  cost: number;
  category: string | null;
  order: number;
}

export interface DayDTO {
  id: string;
  dayNumber: number;
  title: string;
  activities: ActivityDTO[];
}

export interface DayAccordionProps {
  days: DayDTO[];
}

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function getLocalizedStartTime(val: string | null, targetLocale: string): string {
  if (!val) return "";
  const name = val.trim().toLowerCase();
  const timesMap: Record<string, Record<string, string>> = {
    "matí": { ca: "Matí", es: "Mañana", en: "Morning" },
    "morning": { ca: "Matí", es: "Mañana", en: "Morning" },
    "mañana": { ca: "Matí", es: "Mañana", en: "Morning" },

    "dinar": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },
    "lunch": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },
    "almuerzo": { ca: "Dinar", es: "Almuerzo", en: "Lunch" },

    "tarda": { ca: "Tarda", es: "Tarde", en: "Afternoon" },
    "afternoon": { ca: "Tarda", es: "Tarde", en: "Afternoon" },
    "tarde": { ca: "Tarda", es: "Tarde", en: "Afternoon" },

    "sopar": { ca: "Sopar", es: "Cena", en: "Dinner" },
    "dinner": { ca: "Sopar", es: "Cena", en: "Dinner" },
    "cena": { ca: "Sopar", es: "Cena", en: "Dinner" },
  };
  return timesMap[name]?.[targetLocale] ?? val;
}

export function DayAccordion({ days }: DayAccordionProps) {
  const [open, setOpen] = React.useState<number>(1);
  const { locale } = useLocale();

  const dayLabel = locale === "en" ? "Day" : locale === "es" ? "Día" : "Dia";
  const activitiesLabel = locale === "en" ? "activities" : locale === "es" ? "actividades" : "activitats";

  return (
    <div className="grid gap-3">
      {days
        .slice()
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((d) => {
          const isOpen = open === d.dayNumber;
          const total = d.activities.reduce((sum, a) => sum + a.cost, 0);

          return (
            <Card key={d.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : d.dayNumber)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg font-extrabold tracking-wide">
                    {dayLabel} {d.dayNumber} — {d.title}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    {d.activities.length} {activitiesLabel} · {euro(total)}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-[var(--ease-out-premium)]",
                    isOpen ? "rotate-180" : "",
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen ? (
                <div className="border-t border-[color:var(--color-border)] px-5 py-4">
                  <div className="grid gap-3">
                    {d.activities
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/3 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">
                                {a.startTime ? `${getLocalizedStartTime(a.startTime, locale)} · ` : ""}
                                {a.name}
                              </div>
                              {a.description ? (
                                <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                                  {a.description}
                                </div>
                              ) : null}
                              <div className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                                {a.duration ? `${a.duration} min · ` : ""}
                                {euro(a.cost)}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label="Editar activitat"
                              onClick={() => {}}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
    </div>
  );
}
