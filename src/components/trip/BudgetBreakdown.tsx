"use client";

import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";
import { type Locale } from "@/lib/i18n";
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
  initialLocale?: Locale;
}

export function BudgetBreakdown({
  total,
  flight,
  hotel,
  activities,
  daily,
  budgetMax,
  className,
  initialLocale,
}: BudgetBreakdownProps) {
  const { locale, t } = useLocale(initialLocale);
  const displayMoney = useDisplayMoney();
  const inRange = budgetMax ? total <= budgetMax : true;
  const badge = inRange ? (
    <Badge variant="success">{t.inRangeBadge}</Badge>
  ) : (
    <Badge variant="warning">{t.tightBudgetBadge}</Badge>
  );

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            {t.costTotalLabel}
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold tracking-wide">
            {displayMoney(total)}
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-6 grid gap-2 text-sm">
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>{t.flightLabel}</span>
          <span className="text-[color:var(--color-text)]">{displayMoney(flight)}</span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>{t.hotelLabel}</span>
          <span className="text-[color:var(--color-text)]">{displayMoney(hotel)}</span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>{t.activitiesLabel}</span>
          <span className="text-[color:var(--color-text)]">
            {displayMoney(activities)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
          <span>{t.estimatedDailyLabel}</span>
          <span className="text-[color:var(--color-text)]">
            {displayMoney(daily)}{t.perDaySuffix}
          </span>
        </div>
      </div>
    </Card>
  );
}
