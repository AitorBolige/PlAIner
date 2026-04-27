"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface SearchState {
  destination: string;
  dateRange: DateRange | null;
  people: number;
  budgetMax: number;

  setDestination: (v: string) => void;
  setDateRange: (v: DateRange | null) => void;
  setPeople: (v: number) => void;
  setBudgetMax: (v: number) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      destination: "",
      dateRange: null,
      people: 2,
      budgetMax: 1200,

      setDestination: (v) => set({ destination: v }),
      setDateRange: (v) => set({ dateRange: v }),
      setPeople: (v) => set({ people: v }),
      setBudgetMax: (v) => set({ budgetMax: v }),
    }),
    { name: "plainer_search_v1" }
  )
);

