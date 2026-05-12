"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AgeGroup = "youth" | "adult" | "senior";

export type TravelStyle =
  | "Cultura"
  | "Natura"
  | "Gastronomia"
  | "Platja"
  | "Aventura"
  | "Relax"
  | "Urbà"
  | "Luxe";

export type DurationPreset = "2" | "3-4" | "5-7" | "7-14" | "14+";

export interface OnboardingState {
  ageGroup: AgeGroup | null;
  travelStyles: TravelStyle[];
  budget: number;
  duration: DurationPreset | null;

  setAgeGroup: (v: AgeGroup) => void;
  toggleStyle: (v: TravelStyle) => void;
  setBudget: (v: number) => void;
  setDuration: (v: DurationPreset) => void;
  reset: () => void;
}

const defaultBudget = 1200;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ageGroup: null,
      travelStyles: [],
      budget: defaultBudget,
      duration: null,

      setAgeGroup: (v) => set({ ageGroup: v }),
      toggleStyle: (v) => {
        const styles = get().travelStyles;
        set({
          travelStyles: styles.includes(v)
            ? styles.filter((s) => s !== v)
            : [...styles, v],
        });
      },
      setBudget: (v) => set({ budget: v }),
      setDuration: (v) => set({ duration: v }),
      reset: () =>
        set({
          ageGroup: null,
          travelStyles: [],
          budget: defaultBudget,
          duration: null,
        }),
    }),
    { name: "plainer_onboarding_v1" },
  ),
);
