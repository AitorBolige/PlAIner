import { TravelOfferInput, TravelOfferQuery } from "./travel-offers";

// Approximate exchange rates to EUR (updated 2025). Used when the API returns prices
// in a currency other than EUR so the UI always shows a consistent currency.
const EUR_RATES: Record<string, number> = {
  EUR: 1,
  DKK: 1 / 7.46,
  SEK: 1 / 10.55,
  NOK: 1 / 11.75,
  GBP: 1.18,
  USD: 0.92,
  CHF: 1.06,
  PLN: 1 / 4.27,
  CZK: 1 / 25.3,
  HUF: 1 / 390,
  RON: 1 / 4.97,
  TRY: 1 / 36,
  JPY: 1 / 163,
  AUD: 0.61,
  CAD: 0.68,
  SGD: 0.70,
  MXN: 1 / 20,
  BRL: 1 / 6,
  ISK: 1 / 150,
};

function toEur(amount: number, currency: string): number {
  const rate = EUR_RATES[currency.toUpperCase().trim()];
  if (!rate) return amount; // unknown currency: leave as-is
  return Math.round(amount * rate);
}

type MetasearchFlightParams = {
  originIata: string;
  destinationIata: string;
  departureDate?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional)
  passengers?: number;
  maxPrice?: number;
  currency?: string;
};

export type ApiDojoHotelParams = {
  query: string;
  checkin?: string; // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
  adults?: number;
  rooms?: number;
  currency?: string;
  maxPrice?: number;
};

type FlightRouteContext = {
  originIata: string;
  destinationIata: string;
  routeLabel: string;
};

export function resolveMetasearchFlightRoute(query: TravelOfferQuery): FlightRouteContext {
  const destinationIata = resolveFlightDestinationIata(query);
  const originIata = resolveFlightOriginIata(query);

  return {
    originIata,
    destinationIata,
    routeLabel: `${originIata} → ${destinationIata}`,
  };
}

/**
 * APIDojo Booking-v1 hotel search.
 *
 * This is the live hotel pipeline. Sky Scraper's `/hotels/search` repeatedly
 * returns `total: 0` for non-anglophone cities (Lisbon, Bali, Marrakech …),
 * while APIDojo Booking has full Booking.com inventory and gives us direct
 * `https://www.booking.com/hotel/…` deep links (no captcha wall).
 *
 * Reads `RAPIDAPI_HOST` (must be `apidojo-booking-v1.p.rapidapi.com`) and
 * `RAPIDAPI_KEY`.
 */
export async function searchHotelsApiDojo(
  params: ApiDojoHotelParams,
): Promise<TravelOfferInput[]> {
  const host = process.env.RAPIDAPI_HOST?.trim();
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!host || !key) {
    throw new Error("APIDojo hotel search not configured (RAPIDAPI_HOST / RAPIDAPI_KEY)");
  }

  const fallbackCurrency = String((params.currency || "EUR").toUpperCase()).slice(0, 3);
  const headers = {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host,
      accept: "application/json",
  };

  // Step 1: locations/auto-complete → dest_id + dest_type
  const acUrl = `https://${host}/locations/auto-complete?text=${encodeURIComponent(params.query)}&languagecode=en-us`;
  console.log(`[searchHotelsApiDojo] Auto-complete URL: ${acUrl}`);

  const acRes = await fetch(acUrl, { headers });
  console.log(`[searchHotelsApiDojo] Auto-complete status: ${acRes.status}`);

  if (!acRes.ok) {
    const text = await acRes.text().catch(() => "");
    console.error(`[searchHotelsApiDojo] Auto-complete error body:`, text.slice(0, 600));
    return [];
  }

  const acPayload = (await acRes.json().catch(() => null)) as unknown;
  const rows: Array<Record<string, unknown>> = Array.isArray(acPayload)
    ? (acPayload as Array<Record<string, unknown>>)
    : Array.isArray((acPayload as { data?: unknown })?.data)
      ? ((acPayload as { data: Array<Record<string, unknown>> }).data)
      : [];

  if (rows.length === 0) {
    console.warn(`[searchHotelsApiDojo] No auto-complete rows for "${params.query}"`);
    return [];
  }

  // Prefer city/region rows, but fall back to the first usable result.
  const preferredTypes = new Set(["city", "region", "district", "country"]);
  const ranked = [...rows].sort((a, b) => {
    const ta = String(a.dest_type ?? "").toLowerCase();
    const tb = String(b.dest_type ?? "").toLowerCase();
    return (preferredTypes.has(tb) ? 1 : 0) - (preferredTypes.has(ta) ? 1 : 0);
  });

  const first = ranked.find((row) => row.dest_id != null && row.dest_type != null);
  if (!first) {
    console.warn(`[searchHotelsApiDojo] No row with dest_id/dest_type for "${params.query}"`);
    return [];
  }

  const destId = String(first.dest_id);
  const destType = String(first.dest_type);
  console.log(`[searchHotelsApiDojo] Resolved dest_id=${destId} dest_type=${destType} for "${params.query}"`);

  // Step 2: properties/list
  const search = new URLSearchParams();
  search.set("offset", "0");
  search.set("dest_ids", destId);
  search.set("search_type", destType);
  search.set("guest_qty", String(params.adults ?? 2));
  search.set("room_qty", String(params.rooms ?? 1));
  search.set("children_qty", "0");
  search.set("children_age", "");
  if (params.checkin) search.set("arrival_date", params.checkin);
  if (params.checkout) search.set("departure_date", params.checkout);
  search.set("price_filter_currencycode", fallbackCurrency);
  search.set("languagecode", "en-us");
  search.set("order_by", "popularity");
  search.set("units", "metric");
  search.set("search_id", "none");

  const searchUrl = `https://${host}/properties/list?${search.toString()}`;
  console.log(`[searchHotelsApiDojo] Search URL: ${searchUrl}`);

  const sRes = await fetch(searchUrl, { headers });
  console.log(`[searchHotelsApiDojo] Search status: ${sRes.status}`);

  if (!sRes.ok) {
    const text = await sRes.text().catch(() => "");
    console.error(`[searchHotelsApiDojo] Search error body:`, text.slice(0, 600));
    throw new Error(`APIDojo properties/list responded ${sRes.status}`);
  }

  const sPayload = (await sRes.json().catch(() => null)) as Record<string, unknown> | null;
  if (sPayload && typeof sPayload === "object") {
    console.log(
      `[searchHotelsApiDojo] Top-level keys: ${Object.keys(sPayload).join(", ")}`,
    );
  }

  if (sPayload && typeof sPayload === "object") {
    const msg = typeof sPayload.message === "string" ? sPayload.message.trim() : "";
    const resultArr = sPayload.result;
    const resultsArr = sPayload.results;
    const hasUsableList =
      (Array.isArray(resultArr) && resultArr.length > 0) ||
      (Array.isArray(resultsArr) && resultsArr.length > 0);
    if (msg && !hasUsableList) {
      const code = sPayload.code;
      const codeHint =
        typeof code === "number" && code === 429 ? " (possible rate limit)" : "";
      console.error(
        `[searchHotelsApiDojo] properties/list API error:${codeHint} code=${JSON.stringify(code)} message=${msg}`,
      );
      console.error(
        `[searchHotelsApiDojo] properties/list payload slice:`,
        JSON.stringify(sPayload).slice(0, 800),
      );
      return [];
    }
  }

  const list = Array.isArray(sPayload?.result)
    ? (sPayload!.result as Array<Record<string, unknown>>)
    : Array.isArray(sPayload?.results)
      ? (sPayload!.results as Array<Record<string, unknown>>)
      : [];

  console.log(`[searchHotelsApiDojo] Found ${list.length} properties`);

  const offers = list
    .map((item, idx) => mapApiDojoHotelOffer(item, idx, fallbackCurrency))
    .filter((o): o is TravelOfferInput => o !== null);

  if (typeof params.maxPrice === "number" && Number.isFinite(params.maxPrice) && params.maxPrice > 0) {
    return offers.filter((o) => o.price <= (params.maxPrice as number));
  }
  return offers;
}

function mapApiDojoHotelOffer(
  item: Record<string, unknown>,
  index: number,
  fallbackCurrency: string,
): TravelOfferInput | null {
  const title =
    pickFirstString([item.hotel_name, item.name, item.title, item.property_name]) ??
    String(item.hotel_id ?? `Hotel ${index}`);

  const priceBreakdown = item.price_breakdown as Record<string, unknown> | undefined;
  const grossPrice = priceBreakdown?.gross_price as Record<string, unknown> | number | undefined;
  const allInclusive = priceBreakdown?.all_inclusive_price as Record<string, unknown> | number | undefined;

  const priceCandidates: Array<unknown> = [
    item.min_total_price,
    item.minTotalPrice,
    typeof grossPrice === "number" ? grossPrice : (grossPrice as Record<string, unknown> | undefined)?.value,
    typeof allInclusive === "number" ? allInclusive : (allInclusive as Record<string, unknown> | undefined)?.value,
    item.composite_price_breakdown && typeof item.composite_price_breakdown === "object"
      ? (item.composite_price_breakdown as Record<string, unknown>).gross_amount_per_night
      : undefined,
    item.price,
    item.total_price,
  ];
  let price = 0;
  for (const c of priceCandidates) {
    const n = Number(typeof c === "object" && c && "value" in c ? (c as { value: unknown }).value : c);
    if (Number.isFinite(n) && n > 0) {
      price = n;
      break;
    }
  }

  const currency =
    pickFirstString([
      item.currencycode,
      item.currency_code,
      item.currency,
      typeof grossPrice === "object" && grossPrice
        ? ((grossPrice as Record<string, unknown>).currency as string | undefined)
        : undefined,
      fallbackCurrency,
    ]) ?? fallbackCurrency;

  const bookingUrl =
    pickFirstString([item.url, item.url_original, item.product_url, item.hotel_url]) ??
    `https://www.booking.com/hotel/${encodeURIComponent(String(item.hotel_id ?? title))}`;

  const imageUrl = pickFirstString([
    item.max_photo_url,
    item.main_photo_url,
    item.maxPhotoUrl,
    item.mainPhotoUrl,
    Array.isArray(item.photos) && item.photos.length > 0
      ? typeof item.photos[0] === "string"
        ? (item.photos[0] as string)
        : ((item.photos[0] as Record<string, unknown>)?.url as string | undefined)
      : undefined,
  ]);

  const ratingRaw = item.review_score ?? item.reviewScore ?? item.rating;
  const ratingNumber = typeof ratingRaw === "number" ? ratingRaw : Number(ratingRaw);
  // APIDojo uses a 0-10 scale; project schema caps rating at 0-5.
  const rating =
    Number.isFinite(ratingNumber) && ratingNumber > 0
      ? Math.min(5, Math.round((ratingNumber / 2) * 10) / 10)
      : undefined;

  const reviewCountRaw = item.review_nr ?? item.reviewNr ?? item.review_count;
  const reviewCount = Number.isFinite(Number(reviewCountRaw)) ? Number(reviewCountRaw) : undefined;

  const description =
    pickFirstString([
      item.address_trans,
      item.address,
      item.review_score_word,
      item.city_trans,
      item.city,
    ]) ?? undefined;

  const availabilityText =
    pickFirstString([
      item.unit_configuration_label,
      item.matching_units_configuration && typeof item.matching_units_configuration === "object"
        ? ((item.matching_units_configuration as Record<string, unknown>).label as string | undefined)
        : undefined,
      typeof item.distance_to_cc === "number"
        ? `${(item.distance_to_cc as number).toFixed(1)} km from center`
        : undefined,
    ]) ?? undefined;

  const rawCurrency = String(currency).toUpperCase().slice(0, 3);
  const priceEur = toEur(price, rawCurrency);

  return {
    type: "hotel",
    provider: "Booking.com via APIDojo",
    title: String(title),
    description,
    price: priceEur,
    currency: "EUR",
    bookingUrl,
    sourceUrl: bookingUrl,
    imageUrl: imageUrl ?? undefined,
    rating,
    reviewCount,
    availabilityText,
    metadata: item,
    rank: index,
  };
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

/** Normalize RapidAPI path segment to always start with `/`. */
function normalizeRapidApiPathSegment(p: string): string {
  const t = p.trim();
  return t.startsWith("/") ? t : `/${t}`;
}

/**
 * Flight-Sky autocomplete path: optional override, else align with `/web/flights/...`
 * search path, else legacy `/flights/auto-complete`.
 */
function getFlightAutocompletePath(): string {
  const explicit = process.env.RAPIDAPI_FLIGHTS_AUTOCOMPLETE_PATH?.trim();
  if (explicit) return normalizeRapidApiPathSegment(explicit);

  const flightPath = process.env.RAPIDAPI_FLIGHTS_PATH?.trim() || "";
  if (flightPath.includes("web/flights")) {
    return "/web/flights/auto-complete";
  }
  return "/flights/auto-complete";
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

function trimSkyScraperSkyId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** When autocomplete fails, use known-good place ids (same idea as the working commit). */
function getAutocompleteFallbackPlaceId(iataCode: string): string | null {
  const k = iataCode.trim().toUpperCase();
    const fallbacks: Record<string, string> = {
    LHR: "LOND",
    JFK: "JFK",
    PARI: "PARI",
    BCN: "BCN",
    MAD: "MAD",
    LIS: "LIS",
    CDG: "CDG",
    FCO: "FCO",
    AMS: "AMS",
    MUC: "MUC",
    BER: "BER",
    DPS: "DPS",
    RAK: "RAK",
    HND: "HND",
    JTR: "JTR",
  };
  return fallbacks[k] ?? null;
}

/**
 * Sky Scraper / Flight-Sky autocomplete returns `data[]` rows. For search-roundtrip,
 * we pass through `skyId` strings from the API (no `-sky` suffix). Pure numeric legacy
 * `entityId` rows are skipped per row; non-numeric legacy ids are accepted.
 *
 * Path: `RAPIDAPI_FLIGHTS_AUTOCOMPLETE_PATH`, or `/web/flights/auto-complete`
 * when `RAPIDAPI_FLIGHTS_PATH` contains `web/flights`, else `/flights/auto-complete`.
 * On HTTP 400 or empty `data`, retries once with `/web/flights/auto-complete` if needed.
 * On failure after retries, falls back to `getAutocompleteFallbackPlaceId` when defined.
 */
async function getEntityIdFromAutoComplete(iataCode: string): Promise<string | null> {
  const { host, key } = getRapidApiFlightConfig();
  const headers = {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": host,
        accept: "application/json",
  };
  const webPath = "/web/flights/auto-complete";
  let path = getFlightAutocompletePath();

  const tryParsePlaceId = (payload: Record<string, unknown>): string | null => {
    const results = payload.data;
    if (!Array.isArray(results) || results.length === 0) return null;

    for (const row of results) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const navigation = item.navigation as Record<string, unknown> | undefined;
      const flight = navigation?.relevantFlightParams as Record<string, unknown> | undefined;

      const skyRaw =
        trimSkyScraperSkyId(item.skyId) ||
        trimSkyScraperSkyId(flight?.skyId) ||
        trimSkyScraperSkyId(navigation?.skyId);

      if (skyRaw) {
        return skyRaw;
      }

      const legacyRaw = flight?.entityId ?? navigation?.entityId ?? item.entityId;
      const legacy =
        legacyRaw !== undefined && legacyRaw !== null ? String(legacyRaw).trim() : "";
      if (legacy && !/^\d+$/.test(legacy)) {
        return legacy;
      }
    }

    console.warn(`[getEntityIdFromAutoComplete] No usable place id (skyId or entityId) for ${iataCode}`);
    return null;
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const url = `https://${host}${path}?query=${encodeURIComponent(iataCode)}`;
    console.log(`[getEntityIdFromAutoComplete] Fetching for ${iataCode} path=${path}`);

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.warn(
          `[getEntityIdFromAutoComplete] ${iataCode}: HTTP ${response.status} path=${path} body:`,
          body.slice(0, 800),
        );
        if (response.status === 400 && path !== webPath && attempt === 0) {
          console.warn(`[getEntityIdFromAutoComplete] Retrying with ${webPath}`);
          path = webPath;
          continue;
        }
        return getAutocompleteFallbackPlaceId(iataCode);
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const placeId = tryParsePlaceId(payload);
      if (placeId) return placeId;

      const results = payload.data;
      const emptyData = !Array.isArray(results) || results.length === 0;
      if (emptyData) {
        console.warn(`[getEntityIdFromAutoComplete] No data[] for ${iataCode} (path=${path})`);
        if (path !== webPath && attempt === 0) {
          console.warn(`[getEntityIdFromAutoComplete] Retrying with ${webPath}`);
          path = webPath;
          continue;
        }
        return getAutocompleteFallbackPlaceId(iataCode);
      }

      return getAutocompleteFallbackPlaceId(iataCode);
  } catch (error) {
    console.error(`[getEntityIdFromAutoComplete] Error:`, error);
      return getAutocompleteFallbackPlaceId(iataCode);
    }
  }

  return getAutocompleteFallbackPlaceId(iataCode);
}

/**
 * Flight-Sky / Sky Scraper `search-roundtrip`: `fromEntityId` and `toEntityId` from
 * autocomplete (plain sky segment ids such as `BCN`, `LOND`, as returned by the API).
 */
  function buildRapidApiFlightSearchUrlWithEntityIds(
  fromPlaceId: string,
  toPlaceId: string,
    departureDate?: string,
    returnDate?: string,
    passengers: number = 1,
    maxPrice?: number,
    currency: string = "EUR",
  ) {
    const { host, path } = getRapidApiFlightConfig();
    const searchParams = new URLSearchParams();
    const curr = String(currency.toUpperCase()).slice(0, 3);

  searchParams.set("fromEntityId", fromPlaceId);
  searchParams.set("toEntityId", toPlaceId);

  if (departureDate) searchParams.set("departDate", departureDate);
  if (returnDate) searchParams.set("returnDate", returnDate);
    searchParams.set("adults", String(passengers));
    searchParams.set("currency", curr);
    searchParams.set("limit", "20");
    searchParams.set("sort", "price");
  if (typeof maxPrice === "number" && Number.isFinite(maxPrice) && maxPrice > 0) {
    searchParams.set("priceTo", String(maxPrice));
  }

    return `https://${host}${path}?${searchParams.toString()}`;
  }

function rootHasFlightErrors(root: Record<string, unknown>): boolean {
  const errors = root.errors;
  if (Array.isArray(errors)) return errors.length > 0;
  if (errors && typeof errors === "object") return Object.keys(errors as Record<string, unknown>).length > 0;
  return false;
}

/** Logs URL-safe shape hints (keys, typeof data, errors) — truncates long error JSON. */
function logFlightResponseDebug(payload: unknown, phase: string): void {
  if (!payload || typeof payload !== "object") {
    console.log(`[Flight Debug] ${phase}: payload is null or not an object`);
    return;
  }
  const root = payload as Record<string, unknown>;
  console.log(`[Flight Debug] ${phase} Root keys:`, Object.keys(root));
  console.log(
    `[Flight Debug] ${phase} typeof data:`,
    typeof root.data,
    "data === null:",
    root.data === null,
    "data === undefined:",
    root.data === undefined,
  );
  if ("status" in root) console.log(`[Flight Debug] ${phase} root status:`, root.status);
  if ("message" in root) console.log(`[Flight Debug] ${phase} message:`, root.message);
  if ("errors" in root) {
    const s = JSON.stringify(root.errors);
    console.log(`[Flight Debug] ${phase} errors:`, s.length > 2500 ? `${s.slice(0, 2500)}…` : s);
  }
  const dataVal = root.data;
  if (dataVal && typeof dataVal === "object" && !Array.isArray(dataVal)) {
    const d = dataVal as Record<string, unknown>;
    console.log(`[Flight Debug] ${phase} Data keys:`, Object.keys(d));
    if ("itineraries" in d) {
      const itin = d.itineraries;
      console.log(`[Flight Debug] ${phase} itineraries type:`, typeof itin, "isArray:", Array.isArray(itin));
    }
  } else if (Array.isArray(dataVal)) {
    console.log(`[Flight Debug] ${phase} data is array, length:`, dataVal.length);
  }
}

/**
 * Shallow scan of root / nested `data` (legacy metasearch shapes). Used when bucket
 * extraction returns nothing but the payload still contains a list somewhere.
 */
function extractRapidApiFlightOffersBroadShallow(value: Record<string, unknown>): Array<unknown> {
  const candidates: Array<unknown> = [
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

function extractRapidApiFlightOffers(payload: unknown): Array<unknown> {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;

  // flights-sky: data.itineraries.buckets[].items (primary structure)
  const dataObj = root.data as Record<string, unknown> | undefined;
  if (dataObj && typeof dataObj === "object") {
    const itineraries = dataObj.itineraries as Record<string, unknown> | undefined;
    if (itineraries && typeof itineraries === "object") {
      const buckets = itineraries.buckets as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(buckets) && buckets.length > 0) {
        const items: unknown[] = [];
        for (const bucket of buckets) {
          if (Array.isArray(bucket.items)) items.push(...bucket.items);
        }
        if (items.length > 0) return items;
      }
      // results fallback
      if (Array.isArray(itineraries.results) && (itineraries.results as unknown[]).length > 0) {
        return itineraries.results as unknown[];
      }
      // Some flights-sky variants return data.itineraries as a plain array
      if (Array.isArray(itineraries) && (itineraries as unknown as unknown[]).length > 0) {
        return itineraries as unknown as unknown[];
      }
    }
    // data.flights[] (alternative flights-sky shape)
    if (Array.isArray(dataObj.flights) && (dataObj.flights as unknown[]).length > 0) {
      return dataObj.flights as unknown[];
    }
    // data.results[]
    if (Array.isArray(dataObj.results) && (dataObj.results as unknown[]).length > 0) {
      return dataObj.results as unknown[];
    }
    // flat data array
    if (Array.isArray(dataObj)) return dataObj;
  }

  // Generic fallbacks on root
  for (const key of ["result", "results", "itineraries", "flights", "offers", "items"] as const) {
    const val = root[key];
    if (Array.isArray(val) && val.length > 0) return val;
  }

  const broad = extractRapidApiFlightOffersBroadShallow(root);
  if (broad.length > 0) return broad;

  if (dataObj && typeof dataObj === "object") {
    const fromNestedData = extractRapidApiFlightOffersBroadShallow(dataObj);
    if (fromNestedData.length > 0) return fromNestedData;
  }

  return [];
}

function resolveFlightOriginIata(query: TravelOfferQuery) {
  const explicit = query.origin?.trim().toUpperCase();
  if (explicit && explicit.length === 3) return explicit;

  const envOrigin = process.env.RAPIDAPI_FLIGHTS_ORIGIN_IATA?.trim().toUpperCase();
  if (envOrigin && envOrigin.length === 3) return envOrigin;

  // Default origin is Barcelona; avoid origin === destination
  const dest = resolveFlightDestinationIata(query).toUpperCase();
  return dest === "BCN" ? "MAD" : "BCN";
}

function resolveFlightDestinationIata(query: TravelOfferQuery) {
  const city = (query.city || query.destination).trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, ""); // strip accents
  const cityMap: Record<string, string> = {
    // Iberian Peninsula
    lisbon: "LIS", lisboa: "LIS", lisbonne: "LIS",
    madrid: "MAD",
    barcelona: "BCN",
    seville: "SVQ", sevilla: "SVQ",
    valencia: "VLC",
    bilbao: "BIO",
    malaga: "AGP",
    porto: "OPO",
    faro: "FAO",
    // France
    paris: "CDG",
    nice: "NCE",
    lyon: "LYS",
    marseille: "MRS",
    bordeaux: "BOD",
    // Italy
    rome: "FCO", roma: "FCO",
    milan: "MXP", mila: "MXP", milano: "MXP",
    florence: "FLR", firenze: "FLR",
    venice: "VCE", venecia: "VCE", venezia: "VCE",
    naples: "NAP", napoles: "NAP", napoli: "NAP",
    // UK
    london: "LHR",
    edinburgh: "EDI",
    manchester: "MAN",
    // Central Europe
    amsterdam: "AMS",
    berlin: "BER",
    munich: "MUC", munic: "MUC", munchen: "MUC",
    frankfurt: "FRA",
    hamburg: "HAM",
    vienna: "VIE", viena: "VIE", wien: "VIE",
    zurich: "ZRH", zuric: "ZRH",
    geneva: "GVA", ginebra: "GVA",
    brussels: "BRU", brusel: "BRU", bruxelles: "BRU",
    // Eastern Europe
    prague: "PRG", praga: "PRG",
    budapest: "BUD",
    warsaw: "WAW", varsovia: "WAW",
    krakow: "KRK", cracovia: "KRK",
    bucharest: "OTP", bucarest: "OTP",
    sofia: "SOF",
    // Scandinavia
    copenhagen: "CPH", copenhaguen: "CPH", copenague: "CPH",
    stockholm: "ARN",
    oslo: "OSL",
    helsinki: "HEL",
    // Mediterranean / Balkans
    athens: "ATH", atenes: "ATH", atenas: "ATH",
    istanbul: "IST", estambul: "IST",
    dubrovnik: "DBV",
    split: "SPU",
    thessaloniki: "SKG",
    // Middle East / Africa
    dubai: "DXB",
    doha: "DOH",
    abu: "AUH",
    marrakech: "RAK", marraquech: "RAK", marraqueix: "RAK",
    casablanca: "CMN",
    cairo: "CAI", el: "CAI",
    // Asia
    tokyo: "HND", tokio: "HND",
    osaka: "KIX",
    kyoto: "ITM",
    bangkok: "BKK",
    singapore: "SIN",
    "kuala lumpur": "KUL",
    bali: "DPS",
    hong: "HKG",
    seoul: "ICN",
    beijing: "PEK", pekin: "PEK",
    shanghai: "PVG",
    delhi: "DEL",
    mumbai: "BOM",
    // Americas
    "new york": "JFK", nueva: "JFK",
    "los angeles": "LAX",
    miami: "MIA",
    cancun: "CUN",
    mexico: "MEX",
    bogota: "BOG",
    lima: "LIM",
    buenos: "EZE",
    // Islands / Beach
    santorini: "JTR",
    mykonos: "JMK",
    ibiza: "IBZ",
    mallorca: "PMI",
    tenerife: "TFS",
    "las palmas": "LPA",
    fuerteventura: "FUE",
    lanzarote: "ACE",
    maldives: "MLE",
    phuket: "HKT",
  };

  const resolved = cityMap[city];
  if (resolved) return resolved;

  // Try partial match for compound names
  for (const [key, iata] of Object.entries(cityMap)) {
    if (city.startsWith(key) || key.startsWith(city)) return iata;
  }

  // Last resort: use env override or throw
  const envDest = process.env.RAPIDAPI_FLIGHTS_DESTINATION_IATA?.trim().toUpperCase();
  if (envDest && envDest.length === 3) return envDest;

    throw new Error(
    `No flight destination IATA for "${query.city || query.destination}". Add it to the city map in travel-providers.ts.`,
  );
}

function pickFirstString(values: Array<unknown>): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Sky Scraper itineraries bury the safest, agent-direct deep link inside
 * `pricing_options[].items[].deep_link` (or `.url`). Top-level `deep_link`
 * URLs frequently route through the Skyscanner redirect that triggers the
 * reCAPTCHA / "bad authentication" wall. Prefer agent items first.
 */
function normalizeRapidApiBookingUrl(offer: Record<string, unknown>, fallbackUrl: string) {
  const pricingOptions = Array.isArray(offer.pricing_options)
    ? (offer.pricing_options as Array<Record<string, unknown>>)
    : Array.isArray(offer.pricingOptions)
      ? (offer.pricingOptions as Array<Record<string, unknown>>)
      : [];

  for (const option of pricingOptions) {
    const items = Array.isArray(option.items) ? (option.items as Array<Record<string, unknown>>) : [];
    for (const item of items) {
      const candidate = pickFirstString([
        item.deep_link,
        item.deepLink,
        item.url,
        item.booking_url,
        item.bookingUrl,
      ]);
      if (candidate) return candidate;
    }

    const agents = Array.isArray(option.agents) ? (option.agents as Array<Record<string, unknown>>) : [];
    for (const agent of agents) {
      const candidate = pickFirstString([
        agent.deep_link,
        agent.deepLink,
        agent.url,
        agent.booking_url,
        agent.bookingUrl,
      ]);
      if (candidate) return candidate;
    }
  }

  const agents = Array.isArray(offer.agents) ? (offer.agents as Array<Record<string, unknown>>) : [];
  for (const agent of agents) {
    const candidate = pickFirstString([
      agent.deep_link,
      agent.deepLink,
      agent.url,
      agent.booking_url,
      agent.bookingUrl,
    ]);
    if (candidate) return candidate;
  }

  const direct = pickFirstString([
    offer.deep_link,
    offer.deepLink,
    offer.bookingLink,
    offer.booking_link,
    offer.redirectUrl,
    offer.redirect_url,
    offer.url,
    offer.link,
    offer.canonicalUrl,
  ]);
  if (direct) return direct;

  return fallbackUrl;
}

function parseFlightPriceCandidate(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.raw, obj.amount, obj.value, obj.total, obj.formatted];
    for (const c of candidates) {
      const n = parseFlightPriceCandidate(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return Number.NaN;
}

function extractFlightPrice(offer: Record<string, unknown>): number {
  const candidates: Array<unknown> = [
    // flights-sky uses price.raw
    (offer.price as Record<string, unknown> | undefined)?.raw,
    (offer.price as Record<string, unknown> | undefined)?.formatted,
    offer.price,
    offer.minPrice,
    offer.min_price,
    offer.totalPrice,
    offer.total_price,
    offer.amount,
    offer.fare,
    offer.pricePerAdult,
    offer.price_per_adult,
  ];
  for (const candidate of candidates) {
    const n = parseFlightPriceCandidate(candidate);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function toSkyscannerYyMmDd(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1].slice(2)}${match[2]}${match[3]}`;
}

/**
 * Direct Skyscanner search URL — bypasses agent redirect / `?adults_v2=...` deep
 * links that trigger the reCAPTCHA wall when the API returns `status:incomplete`.
 * Format: https://www.skyscanner.net/transport/flights/{from}/{to}/{depYYMMDD}/{retYYMMDD}/
 */
function buildSkyscannerSearchFallbackUrl(
  route: FlightRouteContext,
  departureDate?: string,
  returnDate?: string,
): string {
  const from = route.originIata.toLowerCase();
  const to = route.destinationIata.toLowerCase();
  const dep = toSkyscannerYyMmDd(departureDate);
  const ret = toSkyscannerYyMmDd(returnDate);

  if (dep && ret) return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/${ret}/`;
  if (dep) return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/`;
  return `https://www.skyscanner.net/transport/flights/${from}/${to}/`;
}

type FlightLegSummary = {
  airlineName: string | null;
  airlineCode: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  durationMinutes: number | null;
  stops: number | null;
};

function pickIsoTimeHHmm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function formatDurationLabel(minutes: number | null): string | null {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function summarizeFlightLeg(leg: unknown): FlightLegSummary | null {
  if (!leg || typeof leg !== "object") return null;
  const l = leg as Record<string, unknown>;

  const carriers = l.carriers as Record<string, unknown> | undefined;
  const marketingArr = (carriers?.marketing ?? l.marketingCarrier ?? l.marketing_carriers) as
    | Array<Record<string, unknown>>
    | undefined;
  const firstMarketing = Array.isArray(marketingArr) ? marketingArr[0] : undefined;
  const airlineName =
    (typeof firstMarketing?.name === "string" && firstMarketing.name) ||
    (typeof l.airlineName === "string" && l.airlineName) ||
    null;
  const airlineCode =
    (typeof firstMarketing?.alternate_id === "string" && firstMarketing.alternate_id) ||
    (typeof firstMarketing?.code === "string" && firstMarketing.code) ||
    (typeof l.airlineCode === "string" && l.airlineCode) ||
    null;

  const departureTime = pickIsoTimeHHmm(l.departure ?? l.departureTime ?? l.departure_at);
  const arrivalTime = pickIsoTimeHHmm(l.arrival ?? l.arrivalTime ?? l.arrival_at);

  const durationRaw = l.durationInMinutes ?? l.duration_in_minutes ?? l.duration;
  const durationMinutes =
    typeof durationRaw === "number" && Number.isFinite(durationRaw) ? durationRaw : null;

  const stopCountRaw = l.stopCount ?? l.stop_count ?? l.stops;
  const stops = typeof stopCountRaw === "number" && Number.isFinite(stopCountRaw) ? stopCountRaw : null;

  return { airlineName, airlineCode, departureTime, arrivalTime, durationMinutes, stops };
}

function formatLegInline(leg: FlightLegSummary | null): string | null {
  if (!leg) return null;
  const range = leg.departureTime && leg.arrivalTime ? `${leg.departureTime} - ${leg.arrivalTime}` : null;
  const duration = formatDurationLabel(leg.durationMinutes);
  if (range && duration) return `${range} (${duration})`;
  return range ?? duration ?? null;
}

function mapRapidApiFlightOffer(
  offer: Record<string, unknown>,
  route: FlightRouteContext,
  index: number,
  maxPrice?: number,
  currency = "EUR",
  departureDate?: string,
  returnDate?: string,
): TravelOfferInput | null {
  const effectiveMaxPrice = typeof maxPrice === "number" && Number.isFinite(maxPrice) ? maxPrice : undefined;
  const price = extractFlightPrice(offer);
  if (typeof effectiveMaxPrice === "number" && effectiveMaxPrice > 0 && Number.isFinite(price) && price > effectiveMaxPrice) {
    return null;
  }

  const legs = Array.isArray(offer.legs) ? (offer.legs as Array<unknown>) : [];
  const outbound = summarizeFlightLeg(legs[0]);
  const inbound = legs.length > 1 ? summarizeFlightLeg(legs[1]) : null;

  const airlineName =
    outbound?.airlineName ||
    inbound?.airlineName ||
    (typeof offer.airline === "string" ? offer.airline : null);

  const title = airlineName
    ? `${airlineName} • ${route.originIata} to ${route.destinationIata}`
    : (typeof offer.title === "string" && offer.title) ||
    (typeof offer.name === "string" && offer.name) ||
    `${route.originIata} → ${route.destinationIata}`;

  const safeFallback = buildSkyscannerSearchFallbackUrl(route, departureDate, returnDate);
  const directDeepLink = normalizeRapidApiBookingUrl(offer, "");
  const bookingUrl = directDeepLink && /^https?:\/\//i.test(directDeepLink) ? directDeepLink : safeFallback;

  const outboundLabel = formatLegInline(outbound);
  const inboundLabel = formatLegInline(inbound);
  const stopsTotal =
    (outbound?.stops ?? 0) + (inbound?.stops ?? 0);

  const descriptionSegments: string[] = [];
  if (outboundLabel) descriptionSegments.push(`Outbound: ${outboundLabel}`);
  if (inboundLabel) descriptionSegments.push(`Return: ${inboundLabel}`);
  if (stopsTotal > 0) descriptionSegments.push(`${stopsTotal} stop${stopsTotal === 1 ? "" : "s"}`);

  const description =
    descriptionSegments.length > 0
      ? descriptionSegments.join(" | ")
      : (typeof offer.airline === "string" ? offer.airline : undefined);

  const availabilityText =
    (typeof offer.availabilityText === "string" && offer.availabilityText) ||
    formatDurationLabel((outbound?.durationMinutes ?? 0) + (inbound?.durationMinutes ?? 0)) ||
    (typeof offer.availableSeats === "number" ? `${offer.availableSeats} seats` : undefined) ||
    (typeof offer.duration === "string" ? offer.duration : undefined);

  return {
    type: "transport",
    provider: "RapidAPI Metasearch",
    title: String(title),
    description: description || undefined,
    price: Number.isFinite(price) ? price : 0,
    currency: String(
      (typeof offer.currency === "string" && offer.currency) ||
        (typeof offer.currencyCode === "string" && offer.currencyCode) ||
        (offer.price && typeof offer.price === "object" &&
          typeof (offer.price as Record<string, unknown>).currency === "string"
          ? ((offer.price as Record<string, unknown>).currency as string)
          : "") ||
        currency,
    )
      .toUpperCase()
      .slice(0, 3),
    bookingUrl,
    sourceUrl: bookingUrl,
    imageUrl: undefined,
    rating: undefined,
    reviewCount: undefined,
    availabilityText,
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
  const fromId = await getEntityIdFromAutoComplete(params.originIata);
  const toId = await getEntityIdFromAutoComplete(params.destinationIata);

  if (!fromId || !toId) {
    console.warn(`[searchFlightsMetasearch] Could not resolve place ids for search.`);
    return [];
  }

  console.log(`[searchFlightsMetasearch] Using ${fromId} → ${toId}`);

  // Initial search request
  const url = buildRapidApiFlightSearchUrlWithEntityIds(
    fromId,
    toId,
    params.departureDate,
    params.returnDate,
    params.passengers ?? 1,
    params.maxPrice,
    params.currency,
  );

  console.log(`[Flight Debug] Fetching URL:`, url);

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

  let payload = await response.json().catch(() => null);
  logFlightResponseDebug(payload, "after-parse");

  // Step 3: Poll if status is incomplete (flights-sky uses async session pattern)
  const getSessionId = (p: unknown): string | null => {
    if (!p || typeof p !== "object") return null;
    const root = p as Record<string, unknown>;
    const dataObj = root.data as Record<string, unknown> | undefined;
    if (!dataObj) return null;
    const ctx = (dataObj.context ?? dataObj.itineraries) as Record<string, unknown> | undefined;
    const sessionId = ctx?.sessionId ?? dataObj.sessionId ?? root.sessionId;
    return typeof sessionId === "string" ? sessionId : null;
  };

  const getStatus = (p: unknown): string => {
    if (!p || typeof p !== "object") return "complete";
    const root = p as Record<string, unknown>;
    if (rootHasFlightErrors(root)) return "error";

    const dataVal = root.data;
    if (dataVal === null || dataVal === undefined) {
      const rs = root.status;
      if (typeof rs === "string" && rs.trim() !== "" && rs.toLowerCase() !== "ok") return rs;
      return "complete";
    }
    if (typeof dataVal !== "object") return "complete";

    const dataObj = dataVal as Record<string, unknown>;
    const ctx = dataObj.context as Record<string, unknown> | undefined;
    return (ctx?.status ?? dataObj.status ?? "complete") as string;
  };

  const sessionId = getSessionId(payload);
  const initialStatus = getStatus(payload);
  console.log(`[searchFlightsMetasearch] Initial status: ${initialStatus}, sessionId: ${sessionId}`);

  if (initialStatus === "incomplete" && sessionId) {
    // The flights-sky API uses a polling pattern: re-call the same search endpoint
    // adding sessionId as a query param to retrieve progressive results.
    const { path } = getRapidApiFlightConfig();
    const curr = (params.currency || "EUR").toUpperCase();

    // Build candidate poll URLs in priority order
    const pollUrls = [
      // Pattern 1: same search endpoint + sessionId (most common for flights-sky)
      `${url}&sessionId=${encodeURIComponent(sessionId)}`,
      // Pattern 2: dedicated /poll path derived from search path
      `https://${host}${path.replace(/search-roundtrip$/, "poll")}?sessionId=${encodeURIComponent(sessionId)}&currency=${curr}`,
      // Pattern 3: /web/flights/poll (separate endpoint)
      `https://${host}/web/flights/poll?sessionId=${encodeURIComponent(sessionId)}&currency=${curr}`,
    ];

    const MAX_POLLS = 5;
    const POLL_DELAY_MS = 2000;
    let activePollUrl: string | null = null;

    for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
      await new Promise((res) => setTimeout(res, POLL_DELAY_MS));

      // On first attempt, discover which poll URL works
      if (attempt === 1) {
        for (const candidate of pollUrls) {
          console.log(`[searchFlightsMetasearch] Trying poll URL: ${candidate}`);
          const probe = await fetch(candidate, {
            headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host, accept: "application/json" },
          });
          if (probe.ok) {
            activePollUrl = candidate;
            const probePayload = await probe.json().catch(() => null);
            const probeStatus = getStatus(probePayload);
            const probeOffers = extractRapidApiFlightOffers(probePayload);
            console.log(
              `[searchFlightsMetasearch] Poll URL works, status: ${probeStatus}, offers: ${probeOffers.length}`,
            );
            payload = probePayload;
            if (probeOffers.length > 0 || probeStatus === "complete" || probeStatus === "error") {
              activePollUrl = null;
            }
            break;
          }
          console.warn(`[searchFlightsMetasearch] Poll URL returned ${probe.status}: ${candidate}`);
        }
        if (!activePollUrl) break; // already got results or no URL works
        continue;
      }

      if (!activePollUrl) break;

      console.log(`[searchFlightsMetasearch] Polling attempt ${attempt}/${MAX_POLLS}`);
      const pollResponse = await fetch(activePollUrl, {
        headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host, accept: "application/json" },
      });

      if (!pollResponse.ok) {
        console.warn(`[searchFlightsMetasearch] Poll ${attempt} returned ${pollResponse.status}, stopping`);
        break;
      }

      const pollPayload = await pollResponse.json().catch(() => null);
      const pollOffers = extractRapidApiFlightOffers(pollPayload);
      const pollStatus = getStatus(pollPayload);
      console.log(`[searchFlightsMetasearch] Poll ${attempt} status: ${pollStatus}, offers: ${pollOffers.length}`);

      payload = pollPayload;
      if (pollOffers.length > 0 || pollStatus === "complete" || pollStatus === "error") break;
    }
  }

  logFlightResponseDebug(payload, "pre-extract");

  const list = extractRapidApiFlightOffers(payload);
  const route = {
    originIata: params.originIata,
    destinationIata: params.destinationIata,
    routeLabel: `${params.originIata} → ${params.destinationIata}`,
  } satisfies FlightRouteContext;
  const maxPrice = params.maxPrice ?? undefined;
  const currency = params.currency || "EUR";

  console.log(`[searchFlightsMetasearch] Final offers found: ${list.length}`);

  return (Array.isArray(list) ? list : [])
    .map((offer: unknown, idx: number) => {
      if (!offer || typeof offer !== "object") return null;
      return mapRapidApiFlightOffer(
        offer as Record<string, unknown>,
        route,
        idx,
        maxPrice,
        currency,
        params.departureDate,
        params.returnDate,
      );
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

const travelProviders = {
  searchHotelsApiDojo,
  searchFlightsMetasearch,
};

export default travelProviders;
