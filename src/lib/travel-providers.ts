import { TravelOfferInput, TravelOfferQuery } from "./travel-offers";

type MetasearchFlightParams = {
  originIata: string;
  destinationIata: string;
  departureDate?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional)
  passengers?: number;
  maxPrice?: number;
  currency?: string;
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

export function resolveMetasearchFlightRoute(query: TravelOfferQuery): FlightRouteContext {
  const destinationIata = resolveFlightDestinationIata(query);
  const originIata = resolveFlightOriginIata(query);

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

function getRapidApiFlightConfig() {
  const host = process.env.RAPIDAPI_FLIGHTS_HOST?.trim() || process.env.RAPIDAPI_HOST?.trim();
  const key = process.env.RAPIDAPI_FLIGHTS_KEY?.trim() || process.env.RAPIDAPI_KEY?.trim();
  const path = process.env.RAPIDAPI_FLIGHTS_PATH?.trim() || "/flights/search-roundtrip";
  if (!host || !key) {
    throw new Error("RapidAPI flight metasearch not configured (RAPIDAPI_FLIGHTS_HOST / RAPIDAPI_FLIGHTS_KEY)");
  }
  return { host, key, path: path.startsWith("/") ? path : `/${path}` };
}

function buildRapidApiFlightSearchUrl(params: MetasearchFlightParams) {
  const { host, path } = getRapidApiFlightConfig();
  const searchParams = new URLSearchParams();
  const currency = String((params.currency || "EUR").toUpperCase()).slice(0, 3);

  searchParams.set("origin", params.originIata);
  searchParams.set("destination", params.destinationIata);
  searchParams.set("fly_from", params.originIata);
  searchParams.set("fly_to", params.destinationIata);
  searchParams.set("originIataCode", params.originIata);
  searchParams.set("destinationIataCode", params.destinationIata);
  searchParams.set("date_from", params.departureDate ?? "");
  searchParams.set("dateFrom", params.departureDate ?? "");
  searchParams.set("departureDate", params.departureDate ?? "");
  if (params.returnDate) {
    searchParams.set("returnDate", params.returnDate);
    searchParams.set("return_date", params.returnDate);
  }
  searchParams.set("adults", String(params.passengers ?? 1));
  searchParams.set("passengers", String(params.passengers ?? 1));
  searchParams.set("currency", currency);
  searchParams.set("curr", currency);
  searchParams.set("limit", "20");
  searchParams.set("sort", "price");
  searchParams.set("sortBy", "price");
  if (typeof params.maxPrice === "number" && Number.isFinite(params.maxPrice)) {
    searchParams.set("price_to", String(params.maxPrice));
    searchParams.set("priceTo", String(params.maxPrice));
  }

  return `https://${host}${path}?${searchParams.toString()}`;
}

  async function getEntityIdFromAutoComplete(iataCode: string, searchType: "departure" | "arrival"): Promise<string | null> {
  const { host, key } = getRapidApiFlightConfig();
  
  // 1. HARDCODED FALLBACKS
  // This ensures your debug route works even if the API is acting up!
    const fallbacks: Record<string, string> = {
    'LHR': 'LOND', // Or 'LHR'
    'JFK': 'JFK',
    'PARI': 'PARI',
    'BCN': 'BCN'
    };

  const url = `https://${host}/flights/auto-complete?query=${encodeURIComponent(iataCode)}`;

  try {
    console.log(`[getEntityIdFromAutoComplete] Fetching for ${iataCode}...`);
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": host,
        accept: "application/json",
      },
    });

    if (!response.ok) return fallbacks[iataCode.toUpperCase()] || null;

    const payload = await response.json();
    
    /**
     * SKY SCRAPER API STRUCTURE:
     * The ID is usually located at: data[0].navigation.entityId
     * OR: data[0].skyId
     */
    // Look for this section in getEntityIdFromAutoComplete
    // Inside getEntityIdFromAutoComplete
    const results = payload.data || [];
    if (Array.isArray(results) && results.length > 0) {
    const bestMatch = results[0];
    
    // Try to get skyId first, as many "EntityId" fields actually want the SkyId string
    const idToUse = bestMatch.skyId || bestMatch.navigation?.entityId || bestMatch.entityId;
    
    if (idToUse) {
        console.log(`[getEntityIdFromAutoComplete] Using ID: ${idToUse}`);
        return String(idToUse);
    }
    }

    console.warn(`[getEntityIdFromAutoComplete] Using fallback for ${iataCode}`);
    return fallbacks[iataCode.toUpperCase()] || null;
  } catch (error) {
    console.error(`[getEntityIdFromAutoComplete] Error:`, error);
    return fallbacks[iataCode.toUpperCase()] || null;
  }
}

  function buildRapidApiFlightSearchUrlWithEntityIds(
    fromEntityId: string,
    toEntityId: string,
    departureDate?: string,
    returnDate?: string,
    passengers: number = 1,
    maxPrice?: number,
    currency: string = "EUR",
  ) {
    const { host, path } = getRapidApiFlightConfig();
    const searchParams = new URLSearchParams();
    const curr = String(currency.toUpperCase()).slice(0, 3);

    searchParams.set("fromEntityId", fromEntityId);
    searchParams.set("toEntityId", toEntityId);
    searchParams.set("departDate", departureDate ?? "");
    if (returnDate) {
      searchParams.set("returnDate", returnDate);
    }
    searchParams.set("adults", String(passengers));
    searchParams.set("currency", curr);
    searchParams.set("limit", "20");
    searchParams.set("sort", "price");

    return `https://${host}${path}?${searchParams.toString()}`;
  }
function extractRapidApiFlightOffers(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];

  const value = payload as Record<string, unknown>;
  const candidates = [
    value.data,
    value.result,
    value.results,
    value.itineraries,
    value.flights,
    value.offers,
    value.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      const nestedCandidates = [nested.data, nested.itineraries, nested.flights, nested.offers, nested.items];
      for (const nestedCandidate of nestedCandidates) {
        if (Array.isArray(nestedCandidate)) return nestedCandidate;
      }
    }
  }

  return [];
}

function resolveFlightOriginIata(query: TravelOfferQuery) {
  const explicit = query.origin?.trim().toUpperCase();
  if (explicit && explicit.length === 3) return explicit;

  const envOrigin = process.env.RAPIDAPI_FLIGHTS_ORIGIN_IATA?.trim().toUpperCase();
  if (envOrigin && envOrigin.length === 3) return envOrigin;

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

  return fallbackMap[city] ?? "BCN";
}

function resolveFlightDestinationIata(query: TravelOfferQuery) {
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
      `No flight destination IATA mapping found for "${query.city || query.destination}". Set RAPIDAPI_FLIGHTS_DESTINATION_IATA or extend the city map.`,
    );
  }

  return resolved;
}

function normalizeRapidApiBookingUrl(offer: Record<string, unknown>, fallbackUrl: string) {
  const directUrl =
    offer.deep_link ||
    offer.deepLink ||
    offer.bookingLink ||
    offer.booking_link ||
    offer.redirectUrl ||
    offer.redirect_url ||
    offer.url ||
    offer.link ||
    offer.canonicalUrl;

  if (typeof directUrl === "string" && directUrl.trim()) {
    return directUrl.trim();
  }

  return fallbackUrl;
}

function mapRapidApiFlightOffer(
  offer: Record<string, unknown>,
  route: FlightRouteContext,
  index: number,
  maxPrice?: number,
  currency = "EUR",
): TravelOfferInput | null {
  const effectiveMaxPrice = typeof maxPrice === "number" && Number.isFinite(maxPrice) ? maxPrice : undefined;
  const priceRaw =
    offer.price ??
    offer.minPrice ??
    offer.min_price ??
    offer.totalPrice ??
    offer.total_price ??
    offer.amount ??
    offer.fare ??
    offer.pricePerAdult ??
    offer.price_per_adult ??
    null;
  const price = Number(String(priceRaw ?? "0").replace(/[€,]/g, ""));
  if (typeof effectiveMaxPrice === "number" && effectiveMaxPrice > 0 && Number.isFinite(price) && price > effectiveMaxPrice) {
    return null;
  }

  const title =
    (typeof offer.title === "string" && offer.title) ||
    (typeof offer.name === "string" && offer.name) ||
    `${route.originIata} → ${route.destinationIata}`;

  const deepLinkFallback = `https://www.skyscanner.com/transport/flights/${route.originIata}/${route.destinationIata}/${
    route.routeLabel
  }`;
  const bookingUrl = normalizeRapidApiBookingUrl(offer, deepLinkFallback);

  const descriptionParts = [
    typeof offer.airline === "string" ? offer.airline : undefined,
    typeof offer.duration === "string" ? offer.duration : undefined,
    typeof offer.stops === "number" ? `${offer.stops} stop(s)` : undefined,
    typeof offer.segments === "number" ? `${offer.segments} segment(s)` : undefined,
  ].filter(Boolean);

  return {
    type: "transport",
    provider: "RapidAPI Metasearch",
    title: String(title),
    description: descriptionParts.length > 0 ? descriptionParts.join(" · ") : undefined,
    price: Number.isFinite(price) ? price : 0,
    currency: String(
      (typeof offer.currency === "string" && offer.currency) ||
        (typeof offer.currencyCode === "string" && offer.currencyCode) ||
        currency,
    )
      .toUpperCase()
      .slice(0, 3),
    bookingUrl,
    sourceUrl: bookingUrl,
    imageUrl: undefined,
    rating: undefined,
    reviewCount: undefined,
    availabilityText:
      (typeof offer.availabilityText === "string" && offer.availabilityText) ||
      (typeof offer.availableSeats === "number" ? `${offer.availableSeats} seats` : undefined) ||
      (typeof offer.duration === "string" ? offer.duration : undefined),
    metadata: offer,
    rank: index,
  };
}

/**
 * Search flights via RapidAPI metasearch.
 * The provider host/path are configurable via `RAPIDAPI_FLIGHTS_HOST` and `RAPIDAPI_FLIGHTS_PATH`.
 * `RAPIDAPI_FLIGHTS_KEY` is preferred, with `RAPIDAPI_KEY` as fallback.
 */
export async function searchFlightsMetasearch(params: MetasearchFlightParams): Promise<TravelOfferInput[]> {
  // Step 1: Get entity IDs from auto-complete for origin and destination
  const fromEntityId = await getEntityIdFromAutoComplete(params.originIata, "departure");
  const toEntityId = await getEntityIdFromAutoComplete(params.destinationIata, "arrival");

  if (!fromEntityId || !toEntityId) {
    console.warn(`[searchFlightsMetasearch] Could not resolve entity IDs: fromEntityId=${fromEntityId}, toEntityId=${toEntityId}`);
    return [];
  }

  // Step 2: Build search URL with entity IDs
  const url = buildRapidApiFlightSearchUrlWithEntityIds(
    fromEntityId,
    toEntityId,
    params.departureDate,
    params.returnDate,
    params.passengers ?? 1,
    params.maxPrice,
    params.currency,
  );

  const { host, key } = getRapidApiFlightConfig();
  console.log(`[searchFlightsMetasearch] Fetching from: ${url}`);

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host,
      accept: "application/json",
    },
  });

  console.log(`[searchFlightsMetasearch] Response status: ${response.status}`);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[searchFlightsMetasearch] Error response: ${text}`);
    throw new Error(`RapidAPI flight search responded ${response.status}: ${text}`);
  }

  const payload = await response.json().catch(() => null);
  if (payload && typeof payload === "object") {
    const payloadObject = payload as Record<string, unknown>;
    console.log(`[searchFlightsMetasearch] Raw payload keys: ${Object.keys(payloadObject).join(", ")}`);
    console.log(`[searchFlightsMetasearch] Raw payload preview:`, JSON.stringify(payloadObject).slice(0, 1500));
  } else {
    console.log(`[searchFlightsMetasearch] Raw payload is not an object:`, payload);
  }
  const list = extractRapidApiFlightOffers(payload);
  const route = {
    originIata: params.originIata,
    destinationIata: params.destinationIata,
    routeLabel: `${params.originIata} → ${params.destinationIata}`,
  } satisfies FlightRouteContext;
  const maxPrice = params.maxPrice ?? undefined;
  const currency = params.currency || "EUR";

  console.log(`[searchFlightsMetasearch] Found ${list.length} flight offers`);

  return (Array.isArray(list) ? list : [])
    .map((offer: any, idx: number) => {
      if (!offer || typeof offer !== "object") return null;
      return mapRapidApiFlightOffer(offer as Record<string, unknown>, route, idx, maxPrice, currency);
    })
    .filter((offer): offer is TravelOfferInput => Boolean(offer));
}


export async function searchFlightsMetasearchForQuery(query: TravelOfferQuery): Promise<TravelOfferInput[]> {
  const route = resolveMetasearchFlightRoute(query);
  const offers = await searchFlightsMetasearch({
    originIata: route.originIata,
    destinationIata: route.destinationIata,
    departureDate: query.startDate ? query.startDate.toISOString().slice(0, 10) : undefined,
    returnDate: query.endDate ? query.endDate.toISOString().slice(0, 10) : undefined,
    passengers: query.people ?? 1,
    maxPrice: query.maxPrice ?? query.budgetMax ?? undefined,
    currency: query.currency,
  });

  return filterOffersByMaxPrice(offers, query);
}

// Helper to filter flights by max price
function filterOffersByMaxPrice(offers: TravelOfferInput[], query?: TravelOfferQuery) {
  const effectiveMax = query?.maxPrice ?? query?.budgetMax;
  if (effectiveMax && Number.isFinite(Number(effectiveMax))) {
    return offers.filter((o) => Number(o.price) <= Number(effectiveMax));
  }
  return offers;
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

export default {
  searchHotelsRapidAPI,
  searchFlightsMetasearch,
};
