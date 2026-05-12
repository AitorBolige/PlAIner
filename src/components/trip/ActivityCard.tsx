"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface ActivityCardProps {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  onDelete?: (id: string) => void;
}

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function ActivityCard({
  id,
  title,
  description,
  price,
  imageUrl,
  onDelete,
}: ActivityCardProps) {
  return (
    <Card className="overflow-hidden">
      {imageUrl ? (
        <div className="relative h-40 w-full">
          <Image src={imageUrl} alt={title} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            {description ? (
              <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {description}
              </div>
            ) : null}
          </div>
          <div className="text-sm font-semibold">{euro(price)}</div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Eliminar activitat"
            onClick={() => onDelete?.(id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
