"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface TripCardProps {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
  isFavorite?: boolean;
}

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ca-ES");
}

export function TripCard({
  id,
  destination,
  startDate,
  endDate,
  totalCost,
  status,
  isFavorite = false,
}: TripCardProps) {
  const router = useRouter();
  const badge: BadgeVariant =
    status === "confirmed"
      ? "success"
      : status === "completed"
        ? "neutral"
        : "warning";

  const onToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/trips/${id}/favorite`, { method: "POST" }).catch(() => null);
    router.refresh();
  };

  return (
    <Link
      href={`/trip/${id}`}
      className="rounded-[var(--radius-xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
    >
      <Card
        hover
        className={cn(
          "flex items-start justify-between gap-4 p-5",
          "bg-[radial-gradient(900px_circle_at_15%_20%,rgba(10,163,127,0.10),transparent_55%)]"
        )}
      >
        <div className="min-w-0">
          <div className="font-display text-xl font-extrabold tracking-wide">
            {destination}
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {fmt(startDate)} — {fmt(endDate)}
          </div>
          <div className="mt-3 text-sm">
            <span className="text-[color:var(--color-text-muted)]">Total</span>{" "}
            <span className="font-semibold text-[color:var(--color-text)]">
              {euro(totalCost)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isFavorite ? "Treure de favorits" : "Afegir a favorits"}
              onClick={onToggleFavorite}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite
                    ? "fill-[color:var(--color-primary)] text-[color:var(--color-primary)]"
                    : "text-[color:var(--color-text-muted)]"
                )}
              />
            </button>
            <Badge variant={badge}>
              {status === "confirmed"
                ? "Confirmat"
                : status === "completed"
                  ? "Completat"
                  : "Esborrany"}
            </Badge>
          </div>
          <ArrowRight className="h-5 w-5 text-[color:var(--color-text-muted)]" />
        </div>
      </Card>
    </Link>
  );
}

