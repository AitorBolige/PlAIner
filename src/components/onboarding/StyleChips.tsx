"use client";

import type { TravelStyle } from "@/store/useOnboardingStore";
import { Chip } from "@/components/ui/Chip";

const styles: TravelStyle[] = [
  "Cultura",
  "Natura",
  "Gastronomia",
  "Platja",
  "Aventura",
  "Relax",
  "Urbà",
  "Luxe",
];

export interface StyleChipsProps {
  value: TravelStyle[];
  onToggle: (v: TravelStyle) => void;
}

export function StyleChips({ value, onToggle }: StyleChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((s) => (
        <Chip
          key={s}
          label={s}
          selected={value.includes(s)}
          onClick={() => onToggle(s)}
        />
      ))}
    </div>
  );
}
