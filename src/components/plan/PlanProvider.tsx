"use client";

import * as React from "react";
import type { Destination } from "@/lib/destinations";

// --- Domain types ----------------------------------------------------------

export type TransportId = "plane" | "train" | "bus" | "car";

export interface TransportOption {
  id: TransportId;
  label: string;
  sub: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  days: number;
}

/** A flight/hotel offer as returned by /api/travel-offers. */
export interface Offer {
  id: string;
  type: "TRANSPORT" | "HOTEL";
  transportKind?: string | null;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  provider?: string | null;
  imageUrl?: string | null;
  bookingUrl?: string | null;
  availabilityText?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

export type FlowStep = "search" | "generating" | "picker";

// --- Context shape ---------------------------------------------------------

interface PlanState {
  // search form
  destination: Destination | null;
  dates: DateRange | null;
  transport: TransportOption | null;
  origin: string;
  people: number;
  budget: number; // per person, EUR
  preferences: string;

  // flow
  step: FlowStep;

  // generation / offers
  offers: Offer[] | null;
  offersLoading: boolean;
  offersError: string | null;
  selectedFlight: Offer | null;
  selectedHotel: Offer | null;
  itinerary: unknown | null;
  itineraryLoading: boolean;
}

interface PlanContextValue extends PlanState {
  setDestination: (d: Destination | null) => void;
  setDates: (d: DateRange | null) => void;
  setTransport: (t: TransportOption | null) => void;
  setOrigin: (o: string) => void;
  setPeople: (n: number) => void;
  setBudget: (n: number) => void;
  setPreferences: (s: string) => void;
  setStep: (s: FlowStep) => void;
  setOffers: (o: Offer[] | null) => void;
  setOffersLoading: (b: boolean) => void;
  setOffersError: (s: string | null) => void;
  setSelectedFlight: (o: Offer | null) => void;
  setSelectedHotel: (o: Offer | null) => void;
  setItinerary: (i: unknown | null) => void;
  setItineraryLoading: (b: boolean) => void;
  /** True when the form has the minimum required to generate. */
  ready: boolean;
  reset: () => void;
}

const PlanContext = React.createContext<PlanContextValue | null>(null);

export function usePlan(): PlanContextValue {
  const ctx = React.useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within <PlanProvider>");
  return ctx;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [destination, setDestination] = React.useState<Destination | null>(null);
  const [dates, setDates] = React.useState<DateRange | null>(null);
  const [transport, setTransport] = React.useState<TransportOption | null>(null);
  const [origin, setOrigin] = React.useState("BCN");
  const [people, setPeople] = React.useState(2);
  const [budget, setBudget] = React.useState(1200);
  const [preferences, setPreferences] = React.useState("");
  const [step, setStep] = React.useState<FlowStep>("search");
  const [offers, setOffers] = React.useState<Offer[] | null>(null);
  const [offersLoading, setOffersLoading] = React.useState(false);
  const [offersError, setOffersError] = React.useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = React.useState<Offer | null>(null);
  const [selectedHotel, setSelectedHotel] = React.useState<Offer | null>(null);
  const [itinerary, setItinerary] = React.useState<unknown | null>(null);
  const [itineraryLoading, setItineraryLoading] = React.useState(false);

  const ready = Boolean(destination && dates);

  const reset = React.useCallback(() => {
    setStep("search");
    setOffers(null);
    setOffersError(null);
    setSelectedFlight(null);
    setSelectedHotel(null);
    setItinerary(null);
  }, []);

  const value: PlanContextValue = {
    destination,
    dates,
    transport,
    origin,
    people,
    budget,
    preferences,
    step,
    offers,
    offersLoading,
    offersError,
    selectedFlight,
    selectedHotel,
    itinerary,
    itineraryLoading,
    setDestination,
    setDates,
    setTransport,
    setOrigin,
    setPeople,
    setBudget,
    setPreferences,
    setStep,
    setOffers,
    setOffersLoading,
    setOffersError,
    setSelectedFlight,
    setSelectedHotel,
    setItinerary,
    setItineraryLoading,
    ready,
    reset,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
