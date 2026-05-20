import * as React from "react";
import { Plane, Hotel, Star, ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface OfferCardProps {
  type: "flight" | "hotel" | string;
  provider: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  bookingUrl: string;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  availabilityText?: string | null;
  className?: string;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OfferCard({
  type,
  provider,
  title,
  description,
  price,
  currency,
  bookingUrl,
  imageUrl,
  rating,
  reviewCount,
  availabilityText,
  className,
}: OfferCardProps) {
  const Icon = type === "hotel" ? Hotel : Plane;

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="flex">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-32 w-32 flex-shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center bg-[color:var(--surface-2)] text-[color:var(--text-faint)]">
            <Icon size={28} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">
                <span className="inline-flex items-center gap-1">
                  <Icon size={11} />
                  {type === "hotel" ? "Hotel" : type === "flight" ? "Vol" : type}
                </span>
              </Badge>
              <span className="truncate text-xs text-[color:var(--text-faint)]">
                {provider}
              </span>
            </div>

            <h3 className="mt-2 truncate text-sm font-semibold text-[color:var(--text)]">
              {title}
            </h3>

            {description ? (
              <p className="mt-1 line-clamp-2 text-xs text-[color:var(--text-muted)]">
                {description}
              </p>
            ) : null}

            {rating != null ? (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
                <Star
                  size={12}
                  className="text-[color:var(--gold)]"
                  fill="currentColor"
                />
                <span className="font-semibold text-[color:var(--text)]">
                  {rating.toFixed(1)}
                </span>
                {reviewCount ? <span>({reviewCount})</span> : null}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <div className="display text-lg font-extrabold tracking-[-0.02em] text-[color:var(--text)]">
                {money(price, currency)}
              </div>
              {availabilityText ? (
                <div className="text-[10px] uppercase tracking-[0.08em] text-[color:var(--text-faint)]">
                  {availabilityText}
                </div>
              ) : null}
            </div>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-[color:var(--green)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Veure
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
