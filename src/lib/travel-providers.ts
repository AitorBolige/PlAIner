import { TravelOfferInput, TravelOfferQuery } from "./travel-offers";

type DuffelFlightParams = {
  originIata: string;
  destinationIata: string;
  departureDate?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional)
  passengers?: number;
};

type FlightRouteContext = {
  originIata: string;
  destinationIata: string;
  routeLabel: string;
};

/**
 * Search hotels via a RapidAPI hotel endpoint.
 * Requires RAPIDAPI_HOST and RAPIDAPI_KEY environment variables.
 * The mapping attempts to normalize common fields from popular RapidAPI hotel providers.
 */
export async function searchHotelsRapidAPI(query: TravelOfferQuery): Promise<TravelOfferInput[]> {
  const host = process.env.RAPIDAPI_HOST;
  const key = process.env.RAPIDAPI_KEY;
  if (!host || !key) throw new Error("RapidAPI host/key not configured (RAPIDAPI_HOST / RAPIDAPI_KEY)");

  const location = (query.city || query.destination).trim();
  const destIds = resolveBookingDestIds(query);
  const params = new URLSearchParams();
  params.set("offset", "0");
  params.set("guest_qty", String(query.people ?? 2));
  params.set("children_qty", "0");
  params.set("children_age", "");
  params.set("dest_ids", destIds);
  params.set("room_qty", "1");
  params.set("search_type", "city");
  params.set("price_filter_currencycode", String((query.currency || "EUR").toUpperCase()).slice(0, 3));
  params.set("order_by", "popularity");
  params.set("languagecode", "en-us");
  params.set("units", "metric");
  params.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  if (query.startDate) params.set("arrival_date", query.startDate.toISOString().slice(0, 10));
  if (query.endDate) params.set("departure_date", query.endDate.toISOString().slice(0, 10));

  const url = `https://${host}/properties/v2/list?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RapidAPI hotel search responded ${res.status}: ${text}`);
  }

  const payload = await res.json().catch(() => null);
  const list = extractBookingProperties(payload);

  const offers: TravelOfferInput[] = (Array.isArray(list) ? list : []).map((item: any, idx: number) => {
    const title =
      item.hotel_name ||
      item.name ||
      item.title ||
      item.property_name ||
      item.propertyName ||
      String(item.id ?? `Hotel ${idx}`);
    const priceRaw =
      item.price ||
      item.min_price ||
      item.price_current ||
      item.min_total_price ||
      item.total_price ||
      item.price_breakdown?.grossPrice?.value ||
      item.priceBreakdown?.grossPrice?.value ||
      item.price_breakdown?.gross_price?.value ||
      null;
    const price = priceRaw ? Number(String(priceRaw).replace(/[€,]/g, "")) : 0;
    const currency =
      item.currency ||
      item.currency_code ||
      item.price_currency ||
      item.priceBreakdown?.grossPrice?.currency ||
      item.price_breakdown?.grossPrice?.currency ||
      "EUR";
    const bookingUrl =
      item.url ||
      item.url_original ||
      item.product_url ||
      item.hotel_url ||
      item.link ||
      item.canonicalUrl ||
      null;
    const imageUrl =
      item.thumbnail ||
      item.image ||
      item.photo ||
      item.photoMainUrl ||
      item.mainPhotoUrl ||
      (Array.isArray(item.images) ? item.images[0] : null) ||
      null;
    const rating = item.review_score || item.reviewScore || item.rating || (item.score && Number(item.score)) || undefined;
    const reviewCount = item.review_count || item.reviewCount || item.reviews || item.reviewNr || undefined;
    const availabilityText =
      item.availability ||
      item.rooms_description ||
      item.unit_configuration_label ||
      item.label ||
      item.location?.label ||
      undefined;

    return {
      type: "hotel",
      provider: "RapidAPI Booking",
      title: String(title),
      description:
        item.description ||
        item.location?.label ||
        item.distance_to_cc ||
        item.accessibilityLabel ||
        undefined,
      price: Number.isFinite(Number(price)) ? Number(price) : 0,
      currency: String((currency || "EUR").toUpperCase()).slice(0, 3),
      bookingUrl:
        bookingUrl ||
        `https://www.booking.com/hotel/${encodeURIComponent(String(item.id || title))}`,
      sourceUrl: bookingUrl || undefined,
      imageUrl: imageUrl || undefined,
      rating: typeof rating === "number" ? rating : undefined,
      reviewCount: typeof reviewCount === "number" ? reviewCount : undefined,
      availabilityText,
      metadata: item,
      rank: idx,
    };
  });

  // Apply max price filter if provided (prefer `maxPrice`, fallback to `budgetMax`)
  const effectiveMax = query.maxPrice ?? query.budgetMax;
  if (effectiveMax && Number.isFinite(Number(effectiveMax))) {
    return offers.filter((o) => Number(o.price) <= Number(effectiveMax));
  }

  return offers;
}

export function resolveDuffelFlightRoute(query: TravelOfferQuery): FlightRouteContext {
  const destinationIata = resolveDuffelDestinationIata(query);
  // Prefer explicit query.origin (IATA or city). If it's a 3-letter code, treat as IATA.
  let originIata = undefined;
  if (query.origin && typeof query.origin === 'string' && query.origin.trim().length === 3) {
    originIata = query.origin.trim().toUpperCase();
  }
  originIata = originIata || process.env.DUFFEL_ORIGIN_IATA?.trim().toUpperCase() || resolveDefaultOriginIata(query) || "BCN";

  return {
    originIata,
    destinationIata,
    routeLabel: `${originIata} → ${destinationIata}`,
  };
}

function resolveBookingDestIds(query: TravelOfferQuery) {
  const explicit = process.env.RAPIDAPI_BOOKING_DEST_IDS?.trim();
  if (explicit) return explicit;

  const city = (query.city || query.destination).trim().toLowerCase();
  const cityMap: Record<string, string> = {
    lisbon: "-3712125",
  };

  const resolved = cityMap[city];
  if (!resolved) {
    throw new Error(
      `No Booking dest_ids mapping found for "${query.city || query.destination}". Set RAPIDAPI_BOOKING_DEST_IDS in .env.local.`,
    );
  }

  return resolved;
}

function extractBookingProperties(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];

  const value = payload as Record<string, unknown>;
  const candidates = [
    value.result,
    value.results,
    value.data,
    value.properties,
    value.hotels,
    value.list,
    value.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      const nestedList = [nested.result, nested.results, nested.properties, nested.hotels, nested.items];
      for (const nestedCandidate of nestedList) {
        if (Array.isArray(nestedCandidate)) return nestedCandidate;
      }
    }
  }

  return [];
}

/**
 * Search flights via Duffel. This helper will attempt to use the @duffel/api SDK if available,
 * otherwise falls back to the HTTP endpoints. Provide origin/destination as IATA codes.
 * Maps Duffel offers into the TravelOfferInput shape with type `transport`.
 */
export async function searchFlightsDuffel(params: DuffelFlightParams): Promise<TravelOfferInput[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new Error("Duffel access token not configured (DUFFEL_ACCESS_TOKEN)");

  const { originIata, destinationIata, departureDate, returnDate, passengers = 1 } = params;

  // Try SDK first (if installed)
  try {
    // Dynamic import so the project doesn't break if the package isn't installed yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Duffel } = require("@duffel/api");
    const client = new Duffel({ token });

    // Create an offer request
    const slices: any[] = [
      { origin: originIata, destination: destinationIata, departure_date: departureDate },
    ];
    if (returnDate) slices.push({ origin: destinationIata, destination: originIata, departure_date: returnDate });

    const passengersArr = Array.from({ length: passengers }).map(() => ({ type: "adult" }));

    // Offer Requests API: create a request and then list offers for it
    const req = await client.offerRequests.create({
      slices,
      passengers: passengersArr,
    });

    const offerRequestId = req?.data?.id || req?.id;
    if (!offerRequestId) throw new Error("Duffel: failed to create offer request");

    const offersRes = await client.offers.list({ offer_request_id: offerRequestId });
    const offersList = offersRes?.data || offersRes || [];

    return (Array.isArray(offersList) ? offersList : []).map((offer: any, idx: number) => {
      const price = Number(offer.total_amount || (offer.total && offer.total.amount) || 0);
      const currency = offer.total_currency || (offer.total && offer.total.currency) || "EUR";
      const title = `${originIata} → ${destinationIata}`;
      const bookingUrl = offer.links?.self || `https://duffel.com/offers/${offer.id}`;

      return {
        type: "transport",
        provider: "Duffel",
        title,
        description: offer.slices ? `${offer.slices.length} segment(s)` : undefined,
        price: Number.isFinite(price) ? price : 0,
        currency: String(currency).toUpperCase(),
        bookingUrl,
        sourceUrl: bookingUrl,
        imageUrl: undefined,
        rating: undefined,
        reviewCount: undefined,
        availabilityText: undefined,
        metadata: offer,
        rank: idx,
      };
    });
  } catch (sdkErr) {
    // Fallback to raw HTTP calls to the Duffel REST API
    const offerRequestBody: any = {
      slices: [{ origin: originIata, destination: destinationIata, departure_date: departureDate }],
      passengers: Array.from({ length: passengers }).map(() => ({ type: "adult" })),
    };
    if (returnDate) offerRequestBody.slices.push({ origin: destinationIata, destination: originIata, departure_date: returnDate });

    const createRes = await fetch("https://api.duffel.com/air/offer_requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(offerRequestBody),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => "");
      throw new Error(`Duffel offer_request failed: ${createRes.status} ${text}`);
    }

    const created = await createRes.json();
    const offerRequestId = created?.data?.id || created?.id;
    if (!offerRequestId) throw new Error("Duffel: failed to create offer request (fallback)");

    const offersRes = await fetch(`https://api.duffel.com/air/offers?offer_request_id=${offerRequestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!offersRes.ok) {
      const text = await offersRes.text().catch(() => "");
      throw new Error(`Duffel offers list failed: ${offersRes.status} ${text}`);
    }

    const offersPayload = await offersRes.json().catch(() => null);
    const offersList = (offersPayload && (offersPayload.data || offersPayload.offers)) || [];

    return (Array.isArray(offersList) ? offersList : []).map((offer: any, idx: number) => {
      const price = Number(offer.total_amount || (offer.total && offer.total.amount) || 0);
      const currency = offer.total_currency || (offer.total && offer.total.currency) || "EUR";
      const title = `${originIata} → ${destinationIata}`;
      const bookingUrl = offer.links?.self || `https://duffel.com/offers/${offer.id}`;

      return {
        type: "transport",
        provider: "Duffel",
        title,
        description: offer.slices ? `${offer.slices.length} segment(s)` : undefined,
        price: Number.isFinite(price) ? price : 0,
        currency: String(currency).toUpperCase(),
        bookingUrl,
        sourceUrl: bookingUrl,
        imageUrl: undefined,
        rating: undefined,
        reviewCount: undefined,
        availabilityText: undefined,
        metadata: offer,
        rank: idx,
      };
    });
  }
}

// Helper to filter flights by max price
function filterOffersByMaxPrice(offers: TravelOfferInput[], query?: TravelOfferQuery) {
  const effectiveMax = query?.maxPrice ?? query?.budgetMax;
  if (effectiveMax && Number.isFinite(Number(effectiveMax))) {
    return offers.filter((o) => Number(o.price) <= Number(effectiveMax));
  }
  return offers;
}

export async function searchFlightsDuffelForQuery(query: TravelOfferQuery): Promise<TravelOfferInput[]> {
  const route = resolveDuffelFlightRoute(query);
  const offers = await searchFlightsDuffel({
    originIata: route.originIata,
    destinationIata: route.destinationIata,
    departureDate: query.startDate ? query.startDate.toISOString().slice(0, 10) : undefined,
    returnDate: query.endDate ? query.endDate.toISOString().slice(0, 10) : undefined,
    passengers: query.people ?? 1,
  });

  return filterOffersByMaxPrice(offers, query);
}

function resolveDefaultOriginIata(query: TravelOfferQuery) {
  const city = (query.city || query.destination).trim().toLowerCase();
  const fallbackMap: Record<string, string> = {
    lisbon: "BCN",
    lisboa: "BCN",
    madrid: "BCN",
    barcelona: "LIS",
    paris: "BCN",
    rome: "BCN",
    roma: "BCN",
  };

  return fallbackMap[city] ?? null;
}

function resolveDuffelDestinationIata(query: TravelOfferQuery) {
  const city = (query.city || query.destination).trim().toLowerCase();
  const cityMap: Record<string, string> = {
    lisbon: "LIS",
    lisboa: "LIS",
    madrid: "MAD",
    barcelona: "BCN",
    paris: "CDG",
    rome: "FCO",
    roma: "FCO",
    tokyo: "HND",
    marraqueix: "RAK",
    marrakech: "RAK",
    bali: "DPS",
    "new york": "JFK",
    santorini: "JTR",
  };

  const resolved = cityMap[city];
  if (!resolved) {
    throw new Error(
      `No Duffel destination IATA mapping found for "${query.city || query.destination}". Set DUFFEL_DESTINATION_IATA or extend the city map.`,
    );
  }

  return resolved;
}

export default {
  searchHotelsRapidAPI,
  searchFlightsDuffel,
};
