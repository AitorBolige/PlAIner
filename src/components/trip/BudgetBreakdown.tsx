"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface BudgetBreakdownProps {
  total: number;
  flight: number;
  hotel: number;
  activities: number;
  daily: number;
  budgetMax?: number;
  className?: string;
}

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function BudgetBreakdown({
  total,
  flight,
  hotel,
  activities,
  daily,
  budgetMax,
  className,
}: BudgetBreakdownProps) {
  const inRange = budgetMax ? total <= budgetMax : true;
  const badge = inRange ? (
    <Badge variant="success">Dins del teu rang</Badge>
  ) : (
    <Badge variant="warning">Pressupost ajustat</Badge>
  );

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            Cost total
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold tracking-wide">
            {euro(total)}
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-6 grid gap-2 text-sm">
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>Vol</span>
          <span className="text-[color:var(--color-text)]">{euro(flight)}</span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>Hotel</span>
          <span className="text-[color:var(--color-text)]">{euro(hotel)}</span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>Activitats</span>
          <span className="text-[color:var(--color-text)]">
            {euro(activities)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>Diaris estimats</span>
          <span className="text-[color:var(--color-text)]">
            {euro(daily)}/dia
          </span>
        </div>
      </div>
    </Card>
  );
}

