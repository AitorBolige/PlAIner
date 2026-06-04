import type { Offer } from "@/components/plan/PlanProvider";
import type { Destination } from "@/lib/destinations";
import { fromEur, normalizeCurrency } from "@/lib/currency";

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
      if (
        slot &&
        typeof slot.estimated_cost_eur === "number" &&
        slot.estimated_cost_eur > 0
      ) {
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
  const flightCost = flight
    ? Math.round((flight.price || 0) * (people || 1))
    : 0;
  const hotelCost = hotel
    ? Math.round((hotel.price || 0) * Math.max(1, nights))
    : 0;
  const activitiesCost = sumItineraryActivities(itinerary);
  return {
    flightCost,
    hotelCost,
    activitiesCost,
    grandTotal: flightCost + hotelCost + activitiesCost,
  };
}

/**
 * How the per-person budget is split across the trip's components. Used to
 * derive per-component price caps so a single flight or hotel can't swallow the
 * whole budget — keeping the per-person total within budget with high probability.
 */
export const BUDGET_SPLIT = {
  flight: 0.35,
  hotel: 0.45,
  activities: 0.2,
} as const;

/** Per-component price caps derived from the PER-PERSON budget. */
export function computeBudgetCaps(
  budgetPerPerson: number,
  people: number,
  nights: number,
) {
  const B = Math.max(0, budgetPerPerson || 0);
  const P = Math.max(1, people || 1);
  const N = Math.max(1, nights || 1);
  return {
    // Flight prices are per person → cap is per person.
    flightCap: Math.round(B * BUDGET_SPLIT.flight),
    // Hotel prices are per night (whole room) → stay total = perNight × N ≤ 0.45·B·P.
    hotelCapPerNight: Math.round((B * BUDGET_SPLIT.hotel * P) / N),
    activitiesBudget: Math.round(B * BUDGET_SPLIT.activities * P),
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
  const flightCost = flight
    ? Math.round((flight.price || 0) * (people || 1))
    : 0;
  const hotelCost = hotel
    ? Math.round((hotel.price || 0) * Math.max(1, nights))
    : 0;
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
  const dest = city
    .toUpperCase()
    .slice(0, 3)
    .replace(/[^A-Z]/g, "X");
  const route = `${origin} → ${dest}`;
  const tid = params.transportId || "plane";
  const currency = normalizeCurrency(params.currency);
  const p = (eur: number) => fromEur(eur, currency);

  const transportMocks: Record<string, Offer[]> = {
    plane: [
      {
        id: "mk-fl-1",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Ryanair`,
        description: "06:40 → 08:50 · Tornada 21:10 → 23:15",
        price: p(72),
        currency,
        provider: "Ryanair",
        availabilityText: "2h 10m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 130,
          baggage: "Motxilla petita inclosa",
        },
      },
      {
        id: "mk-fl-2",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Vueling`,
        description: "08:30 → 10:35 · Tornada 19:05 → 21:10",
        price: p(89),
        currency,
        provider: "Vueling",
        availabilityText: "2h 05m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 125,
          baggage: "Equipatge de mà 10 kg inclòs",
        },
      },
      {
        id: "mk-fl-3",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · easyJet`,
        description: "13:15 → 15:25 · Tornada 16:40 → 18:50",
        price: p(96),
        currency,
        provider: "easyJet",
        availabilityText: "2h 10m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 130,
          baggage: "Motxilla petita inclosa",
        },
      },
      {
        id: "mk-fl-4",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Iberia`,
        description: "10:00 → 13:20 · Tornada 14:10 → 17:30",
        price: p(105),
        currency,
        provider: "Iberia",
        availabilityText: "3h 20m · 1 escala",
        metadata: {
          stops: 1,
          durationMinutes: 200,
          baggage: "Maleta 23 kg inclosa",
        },
      },
      {
        id: "mk-fl-5",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Lufthansa`,
        description: "07:55 → 11:45 · Tornada 18:25 → 22:05",
        price: p(128),
        currency,
        provider: "Lufthansa",
        availabilityText: "3h 50m · 1 escala",
        metadata: {
          stops: 1,
          durationMinutes: 230,
          baggage: "Maleta 23 kg inclosa",
        },
      },
      {
        id: "mk-fl-6",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Air France`,
        description: "16:20 → 18:30 · Tornada 09:15 → 11:25",
        price: p(142),
        currency,
        provider: "Air France",
        availabilityText: "2h 10m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 130,
          baggage: "Maleta 23 kg inclosa",
        },
      },
      {
        id: "mk-fl-7",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · KLM`,
        description: "11:40 → 15:05 · Tornada 16:50 → 20:15",
        price: p(156),
        currency,
        provider: "KLM",
        availabilityText: "3h 25m · 1 escala",
        metadata: {
          stops: 1,
          durationMinutes: 205,
          baggage: "Maleta 23 kg inclosa",
        },
      },
      {
        id: "mk-fl-8",
        type: "TRANSPORT",
        transportKind: "plane",
        title: `${route} · Swiss`,
        description: "06:15 → 10:35 · Tornada 19:40 → 23:55",
        price: p(178),
        currency,
        provider: "Swiss",
        availabilityText: "4h 20m · 1 escala",
        metadata: {
          stops: 1,
          durationMinutes: 260,
          baggage: "Maleta 23 kg + esport inclòs",
        },
      },
    ],
    train: [
      {
        id: "mk-tr-1",
        type: "TRANSPORT",
        transportKind: "train",
        title: `${route} · Renfe AVE`,
        description: "08:00 → 14:30 · Tornada 17:10 → 23:40",
        price: p(79),
        currency,
        provider: "Renfe",
        availabilityText: "6h 30m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 390,
          baggage: "2 maletes incloses",
        },
      },
      {
        id: "mk-tr-2",
        type: "TRANSPORT",
        transportKind: "train",
        title: `${route} · TGV InOui`,
        description: "09:15 → 16:10 · Tornada 18:05 → 00:55",
        price: p(95),
        currency,
        provider: "TGV InOui",
        availabilityText: "6h 55m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 415,
          baggage: "2 maletes incloses",
        },
      },
      {
        id: "mk-tr-3",
        type: "TRANSPORT",
        transportKind: "train",
        title: `${route} · Trenitalia`,
        description: "07:40 → 15:05 · Tornada 16:20 → 23:50",
        price: p(110),
        currency,
        provider: "Trenitalia",
        availabilityText: "7h 25m · 1 transbord",
        metadata: {
          stops: 1,
          durationMinutes: 445,
          baggage: "2 maletes incloses",
        },
      },
    ],
    bus: [
      {
        id: "mk-bs-1",
        type: "TRANSPORT",
        transportKind: "bus",
        title: `${route} · FlixBus`,
        description: "21:30 → 11:50 · Tornada 22:00 → 12:20",
        price: p(34),
        currency,
        provider: "FlixBus",
        availabilityText: "14h 20m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 860,
          baggage: "1 maleta + 1 motxilla",
        },
      },
      {
        id: "mk-bs-2",
        type: "TRANSPORT",
        transportKind: "bus",
        title: `${route} · ALSA`,
        description: "20:15 → 11:20 · Tornada 21:40 → 12:45",
        price: p(39),
        currency,
        provider: "ALSA",
        availabilityText: "15h 05m · 1 parada",
        metadata: {
          stops: 1,
          durationMinutes: 905,
          baggage: "1 maleta + 1 motxilla",
        },
      },
      {
        id: "mk-bs-3",
        type: "TRANSPORT",
        transportKind: "bus",
        title: `${route} · BlaBlaCar Bus`,
        description: "22:00 → 12:10 · Tornada 23:15 → 13:30",
        price: p(29),
        currency,
        provider: "BlaBlaCar Bus",
        availabilityText: "14h 10m · Directe",
        metadata: {
          stops: 0,
          durationMinutes: 850,
          baggage: "1 maleta inclosa",
        },
      },
    ],
    car: [
      {
        id: "mk-cr-1",
        type: "TRANSPORT",
        transportKind: "car",
        title: `${route} · Cotxe propi`,
        description: "Ruta flexible · peatges a part",
        price: p(60),
        currency,
        provider: "El teu cotxe",
        availabilityText: "Flexible · Sortida quan vulguis",
        metadata: { stops: 0, baggage: "Sense límit d'equipatge" },
      },
    ],
  };

  const flights = transportMocks[tid] ?? transportMocks.plane;

  const hotels: Offer[] = [
    {
      id: "mk-ht-1",
      type: "HOTEL",
      title: `Hostal ${city} Centre ★★`,
      description: "Habitació doble · Wifi gratuït · A 5 min del centre",
      price: p(58),
      currency,
      provider: "Booking.com",
      rating: 7.9,
      reviewCount: 640,
      imageUrl:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-2",
      type: "HOTEL",
      title: `Boutique Hotel ${city} ★★★`,
      description: "Habitació doble · Barri històric · Wifi gratuït",
      price: p(85),
      currency,
      provider: "Booking.com",
      rating: 8.2,
      reviewCount: 860,
      imageUrl:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-3",
      type: "HOTEL",
      title: `Hotel ${city} Centro ★★★★`,
      description: "Habitació doble · Esmorzar inclòs · Centre històric",
      price: p(110),
      currency,
      provider: "Booking.com",
      rating: 8.7,
      reviewCount: 1240,
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-4",
      type: "HOTEL",
      title: `${city} Riverside Hotel ★★★★`,
      description: "Habitació superior · Vistes al riu · Gimnàs i bar",
      price: p(145),
      currency,
      provider: "Booking.com",
      rating: 9.0,
      reviewCount: 720,
      imageUrl:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-5",
      type: "HOTEL",
      title: `${city} Luxury Suites ★★★★★`,
      description: "Suite deluxe · Vistes panoràmiques · Spa inclòs",
      price: p(220),
      currency,
      provider: "Booking.com",
      rating: 9.4,
      reviewCount: 530,
      imageUrl:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-6",
      type: "HOTEL",
      title: `${city} Backpackers Hostel ★`,
      description: "Llit en habitació compartida · Cuina comuna · Cèntric",
      price: p(32),
      currency,
      provider: "Hostelworld",
      rating: 7.5,
      reviewCount: 1480,
      imageUrl:
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-7",
      type: "HOTEL",
      title: `Aparthotel ${city} ★★★`,
      description: "Apartament amb cuina · Ideal estades llargues · Wifi",
      price: p(98),
      currency,
      provider: "Booking.com",
      rating: 8.4,
      reviewCount: 910,
      imageUrl:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-8",
      type: "HOTEL",
      title: `${city} Design Hotel ★★★★`,
      description: "Habitació de disseny · Terrassa · Esmorzar buffet",
      price: p(132),
      currency,
      provider: "Booking.com",
      rating: 8.9,
      reviewCount: 670,
      imageUrl:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-9",
      type: "HOTEL",
      title: `Gran Hotel ${city} ★★★★★`,
      description: "Habitació premium · Piscina i spa · Servei 24h",
      price: p(185),
      currency,
      provider: "Booking.com",
      rating: 9.2,
      reviewCount: 1020,
      imageUrl:
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=75&fit=crop",
    },
    {
      id: "mk-ht-10",
      type: "HOTEL",
      title: `${city} Palace Resort ★★★★★`,
      description: "Suite amb vistes · Restaurant gourmet · Spa de luxe",
      price: p(280),
      currency,
      provider: "Booking.com",
      rating: 9.6,
      reviewCount: 410,
      imageUrl:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=75&fit=crop",
    },
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
      45_000,
    );
    const payload = await res.json().catch(() => null);
    if (
      res.ok &&
      Array.isArray(payload?.cache?.offers) &&
      payload.cache.offers.length > 0
    ) {
      return { offers: payload.cache.offers as Offer[], error: null };
    }
    // No live offers → fall back to demo data so the flow never dead-ends.
    return { offers: buildMockOffers(params), error: null };
  }

  try {
    const res = await fetchWithTimeout(url.toString(), {}, 8_000);
    const payload = await res.json().catch(() => null);
    if (
      res.ok &&
      Array.isArray(payload?.cache?.offers) &&
      payload.cache.offers.length > 0
    ) {
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
    if (res.ok && data?.days)
      return { itinerary: data as Itinerary, error: null };
    return {
      itinerary: null,
      error: data?.error ?? "No s'ha pogut generar l'itinerari.",
    };
  } catch {
    return {
      itinerary: null,
      error: "Error de connexió en generar l'itinerari.",
    };
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
    if (res.ok && data?.ok && data?.trip?.id)
      return { id: data.trip.id, error: null };
    return { id: null, error: data?.error ?? "No s'ha pogut desar el viatge." };
  } catch {
    return { id: null, error: "Error de connexió en desar el viatge." };
  }
}
