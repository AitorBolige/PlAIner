import type { Offer } from "@/components/plan/PlanProvider";
import type { Destination } from "@/lib/destinations";

const ITIN_SLOT_KEYS = [
  "morning_activity",
  "lunch_restaurant",
  "afternoon_activity",
  "dinner_restaurant",
] as const;

export interface ItinerarySlot {
  name?: string;
  description?: string;
  cuisine?: string;
  estimated_cost_eur?: number;
  Maps_url?: string;
}
export interface ItineraryDay {
  day_number?: number;
  theme?: string;
  morning_activity?: ItinerarySlot;
  lunch_restaurant?: ItinerarySlot;
  afternoon_activity?: ItinerarySlot;
  dinner_restaurant?: ItinerarySlot;
}
export interface Itinerary {
  trip_title?: string;
  days?: ItineraryDay[];
}

/** Sum of all activity/restaurant estimated costs across the itinerary. */
export function sumItineraryActivities(itinerary: Itinerary | null): number {
  if (!itinerary?.days) return 0;
  let total = 0;
  for (const day of itinerary.days) {
    for (const key of ITIN_SLOT_KEYS) {
      const slot = day[key];
      if (slot && typeof slot.estimated_cost_eur === "number" && slot.estimated_cost_eur > 0) {
        total += slot.estimated_cost_eur;
      }
    }
  }
  return Math.round(total);
}

export interface CostBreakdown {
  flightCost: number;
  hotelCost: number;
  activitiesCost: number;
  grandTotal: number;
}

export function computeCostBreakdown(
  flight: Offer | null,
  hotel: Offer | null,
  itinerary: Itinerary | null,
  people: number,
  nights = 1,
): CostBreakdown {
  const flightCost = flight ? Math.round((flight.price || 0) * (people || 1)) : 0;
  const hotelCost = hotel ? Math.round((hotel.price || 0) * Math.max(1, nights)) : 0;
  const activitiesCost = sumItineraryActivities(itinerary);
  return {
    flightCost,
    hotelCost,
    activitiesCost,
    grandTotal: flightCost + hotelCost + activitiesCost,
  };
}

/** Budget left for activities once flight + hotel are paid (budget is per person). */
export function remainingActivitiesBudget(
  budgetPerPerson: number,
  people: number,
  flight: Offer | null,
  hotel: Offer | null,
  nights = 1,
): number {
  const totalBudget = Math.round((budgetPerPerson || 0) * (people || 1));
  const flightCost = flight ? Math.round((flight.price || 0) * (people || 1)) : 0;
  const hotelCost = hotel ? Math.round((hotel.price || 0) * Math.max(1, nights)) : 0;
  return Math.max(0, totalBudget - flightCost - hotelCost);
}

export interface OfferQueryParams {
  destination: Destination;
  startDate: Date;
  endDate: Date;
  people: number;
  budget: number; // per person
  origin: string;
  currency?: string;
  transportId?: string;
}

/**
 * Demo/fallback offers so the flow always works when the live travel APIs
 * (RapidAPI) return nothing or aren't configured. Mirrors the legacy mocks.
 */
export function buildMockOffers(params: OfferQueryParams): Offer[] {
  const city = params.destination.city;
  const origin = (params.origin || "BCN").toUpperCase().slice(0, 3);
  const dest = city.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, "X");
  const route = `${origin} → ${dest}`;
  const tid = params.transportId || "plane";

  const transportMocks: Record<string, Offer[]> = {
    plane: [
      { id: "mk-fl-1", type: "TRANSPORT", transportKind: "plane", title: `${route} · Vueling`, description: "2h 05m · Directe", price: 89, currency: "EUR", provider: "Vueling", availabilityText: "Directe" },
      { id: "mk-fl-2", type: "TRANSPORT", transportKind: "plane", title: `${route} · Ryanair`, description: "2h 10m · Directe", price: 72, currency: "EUR", provider: "Ryanair", availabilityText: "Directe" },
      { id: "mk-fl-3", type: "TRANSPORT", transportKind: "plane", title: `${route} · Iberia`, description: "3h 20m · 1 escala", price: 105, currency: "EUR", provider: "Iberia", availabilityText: "1 escala" },
    ],
    train: [
      { id: "mk-tr-1", type: "TRANSPORT", transportKind: "train", title: `${route} · Renfe AVE`, description: "6h 30m · Directe", price: 79, currency: "EUR", provider: "Renfe", availabilityText: "Directe" },
      { id: "mk-tr-2", type: "TRANSPORT", transportKind: "train", title: `${route} · TGV InOui`, description: "6h 55m · Directe", price: 95, currency: "EUR", provider: "TGV InOui", availabilityText: "Directe" },
    ],
    bus: [
      { id: "mk-bs-1", type: "TRANSPORT", transportKind: "bus", title: `${route} · FlixBus`, description: "14h 20m · Directe", price: 39, currency: "EUR", provider: "FlixBus", availabilityText: "Directe" },
      { id: "mk-bs-2", type: "TRANSPORT", transportKind: "bus", title: `${route} · ALSA`, description: "15h 05m · 1 parada", price: 34, currency: "EUR", provider: "ALSA", availabilityText: "1 parada" },
    ],
    car: [
      { id: "mk-cr-1", type: "TRANSPORT", transportKind: "car", title: `${route} · Cotxe propi`, description: "Ruta flexible · peatges a part", price: 60, currency: "EUR", provider: "El teu cotxe", availabilityText: "Flexible" },
    ],
  };

  const flights = transportMocks[tid] ?? transportMocks.plane;

  const hotels: Offer[] = [
    { id: "mk-ht-1", type: "HOTEL", title: `Hotel ${city} Centro ★★★★`, description: "Habitació doble · Esmorzar inclòs · Centre històric", price: 110, currency: "EUR", provider: "Booking.com", rating: 8.7, reviewCount: 1240, imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=75&fit=crop" },
    { id: "mk-ht-2", type: "HOTEL", title: `Boutique Hotel ${city} ★★★`, description: "Habitació doble · Barri històric · Wifi gratuït", price: 85, currency: "EUR", provider: "Booking.com", rating: 8.2, reviewCount: 860, imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=75&fit=crop" },
    { id: "mk-ht-3", type: "HOTEL", title: `${city} Luxury Suites ★★★★★`, description: "Suite deluxe · Vistes panoràmiques · Spa inclòs", price: 220, currency: "EUR", provider: "Booking.com", rating: 9.4, reviewCount: 530, imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=75&fit=crop" },
  ];

  const flightUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(`vols a ${city}`)}`;
  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`;
  return [...flights, ...hotels].map((o) => ({
    ...o,
    bookingUrl: o.type === "HOTEL" ? hotelUrl : flightUrl,
  }));
}

/**
 * Load offers: try the cached GET, and fall back to a refresh POST when the
 * cache is empty. Mirrors the legacy loadLiveOffers flow.
 */
/** fetch with an abort timeout so a slow upstream never hangs the UI. */
async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  ms = 20_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchOffers(
  params: OfferQueryParams,
): Promise<{ offers: Offer[]; error: string | null }> {
  const city = params.destination.city;
  const countryCode = params.destination.countryCode || undefined;
  const currency = (params.currency || "EUR").toUpperCase().slice(0, 3);
  const startDate = params.startDate.toISOString().slice(0, 10);
  const endDate = params.endDate.toISOString().slice(0, 10);

  const refreshQuery = {
    destination: city,
    city,
    countryCode,
    startDate,
    endDate,
    people: params.people || 2,
    budgetMax: params.budget || 1200,
    maxPrice: params.budget || 1200,
    currency,
    origin: params.origin || undefined,
    transportId: params.transportId || "plane",
  };

  const url = new URL("/api/travel-offers", window.location.origin);
  url.searchParams.set("destination", city);
  url.searchParams.set("city", city);
  if (countryCode) url.searchParams.set("countryCode", countryCode);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("people", String(params.people || 2));
  if (params.origin) url.searchParams.set("origin", params.origin);
  url.searchParams.set("budgetMax", String(params.budget || 1200));
  url.searchParams.set("maxPrice", String(params.budget || 1200));
  url.searchParams.set("currency", currency);
  url.searchParams.set("transportId", params.transportId || "plane");

  async function refresh(): Promise<{ offers: Offer[]; error: string | null }> {
    const res = await fetchWithTimeout(
      "/api/travel-offers/refresh",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: refreshQuery }),
      },
      35_000,
    );
    const payload = await res.json().catch(() => null);
    if (res.ok && Array.isArray(payload?.cache?.offers) && payload.cache.offers.length > 0) {
      return { offers: payload.cache.offers as Offer[], error: null };
    }
    // No live offers → fall back to demo data so the flow never dead-ends.
    return { offers: buildMockOffers(params), error: null };
  }

  try {
    const res = await fetchWithTimeout(url.toString(), {}, 8_000);
    const payload = await res.json().catch(() => null);
    if (res.ok && Array.isArray(payload?.cache?.offers) && payload.cache.offers.length > 0) {
      return { offers: payload.cache.offers as Offer[], error: null };
    }
    return await refresh();
  } catch {
    try {
      return await refresh();
    } catch {
      // Total failure → still hand back demo offers so the user can continue.
      return { offers: buildMockOffers(params), error: null };
    }
  }
}

export interface GenerateItineraryParams {
  destination: string;
  startDate: Date;
  endDate: Date;
  people: number;
  remainingBudget: number;
  preferences: string;
  travelerAgeGroups?: string[];
  locale?: string;
}

export async function generateItinerary(
  p: GenerateItineraryParams,
): Promise<{ itinerary: Itinerary | null; error: string | null }> {
  try {
    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: p.destination,
        startDate: p.startDate.toISOString().slice(0, 10),
        endDate: p.endDate.toISOString().slice(0, 10),
        people: p.people,
        remainingBudget: p.remainingBudget,
        preferences: p.preferences,
        travelerAgeGroups: p.travelerAgeGroups,
        locale: p.locale,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.days) return { itinerary: data as Itinerary, error: null };
    return { itinerary: null, error: data?.error ?? "No s'ha pogut generar l'itinerari." };
  } catch {
    return { itinerary: null, error: "Error de connexió en generar l'itinerari." };
  }
}

export interface SaveTripParams {
  destination: Destination;
  startDate: Date;
  endDate: Date;
  days: number;
  people: number;
  costs: CostBreakdown;
  itinerary: Itinerary | null;
  travelerAgeGroups?: string[];
  flightOffer?: unknown | null;
  hotelOffer?: unknown | null;
  isPublic?: boolean;
}

export async function saveTrip(
  p: SaveTripParams,
): Promise<{ id: string | null; error: string | null }> {
  const body = {
    destination: p.destination.city,
    country: p.destination.country || undefined,
    imageUrl: p.destination.cardImage || undefined,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    people: p.people,
    travelerAgeGroups: p.travelerAgeGroups,
    totalCost: p.costs.grandTotal,
    flightCost: p.costs.flightCost,
    hotelCost: p.costs.hotelCost,
    activitiesCost: p.costs.activitiesCost,
    dailyCost: Math.round(p.costs.grandTotal / Math.max(1, p.days)),
    status: "confirmed",
    isSurprise: false,
    isPublic: p.isPublic ?? false,
    itinerary: p.itinerary || undefined,
    flightOffer: p.flightOffer ?? undefined,
    hotelOffer: p.hotelOffer ?? undefined,
  };
  try {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && data?.trip?.id) return { id: data.trip.id, error: null };
    return { id: null, error: data?.error ?? "No s'ha pogut desar el viatge." };
  } catch {
    return { id: null, error: "Error de connexió en desar el viatge." };
  }
}
