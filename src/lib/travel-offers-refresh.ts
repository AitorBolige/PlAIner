import { TravelRefreshRunStatus } from "@prisma/client";

import {
  type TravelOfferInput,
  type TravelOfferQuery,
  travelOfferQuerySchema,
  upsertTravelSearchOffers,
} from "@/lib/travel-offers";
import { searchFlightsMetasearchForQuery, searchHotelsRapidAPI } from "@/lib/travel-providers";

type SourceKind = "hotel" | "transport";

type TravelSource = {
  kind: SourceKind;
  name: string;
  urlTemplate: string;
};

type ParsedTrivagoOffer = TravelOfferInput & {
  sourceUrl: string;
};

const TRIVAGO_PROVIDER_NAME = "Trivago";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getTemplateVariables(query: TravelOfferQuery) {
  const city = query.city ?? query.destination;

  return {
    destination: query.destination,
    destinationSlug: slugify(query.destination),
    city,
    citySlug: slugify(city),
    countryCode: query.countryCode ?? "",
    countrySlug: query.countryCode ? slugify(query.countryCode) : "",
    startDate: query.startDate ? query.startDate.toISOString().slice(0, 10) : "",
    endDate: query.endDate ? query.endDate.toISOString().slice(0, 10) : "",
    people: String(query.people),
    budgetMax: String(query.budgetMax ?? ""),
    currency: query.currency,
  };
}

function buildUrl(template: string, query: TravelOfferQuery) {
  const vars = getTemplateVariables(query);

  return template
    .replaceAll("{{destination}}", encodeURIComponent(vars.destination))
    .replaceAll("{{destinationSlug}}", encodeURIComponent(vars.destinationSlug))
    .replaceAll("{{city}}", encodeURIComponent(vars.city))
    .replaceAll("{{citySlug}}", encodeURIComponent(vars.citySlug))
    .replaceAll("{{countryCode}}", encodeURIComponent(vars.countryCode))
    .replaceAll("{{countrySlug}}", encodeURIComponent(vars.countrySlug))
    .replaceAll("{{startDate}}", encodeURIComponent(vars.startDate))
    .replaceAll("{{endDate}}", encodeURIComponent(vars.endDate))
    .replaceAll("{{people}}", encodeURIComponent(vars.people))
    .replaceAll("{{budgetMax}}", encodeURIComponent(vars.budgetMax))
    .replaceAll("{{currency}}", encodeURIComponent(vars.currency));
}

function stripHtmlTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "\n")
    .replace(/<(?:br|\/p|\/div|\/li|\/section|\/article|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6|\/tr|\/td|\/th|\/ul|\/ol)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isLikelyTrivagoTitleLine(line: string) {
  if (!line) return false;
  if (/^https?:\/\//i.test(line)) return false;
  if (/\b(Hotels in|Price range|Frequently Asked Questions|Additional Links|More Top Destinations|Top Destinations|City Districts|Points of Interest|Other stays in|Show more|Add to favourites|Share|Let’s talk cookies|Cookie preferences|The prices and availability|We compare hotel prices|Search simply|Compare confidently|Save big|Hotel search)\b/i.test(line)) {
    return false;
  }
  if (/\b(From\s*€|ratings?|km to|sites?|night|per night)\b/i.test(line)) return false;
  if (line.length < 3 || line.length > 120) return false;
  return /[A-Za-zÀ-ÿ]/.test(line) && !/^\d/.test(line);
}

function parsePriceFromBlock(block: string) {
  const match = block.match(/From\s*€\s*([0-9][0-9.,]*)/i);
  if (!match) return null;

  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseRatingFromBlock(block: string) {
  const match = block.match(/\b([0-9](?:\.[0-9])?)\s*(?:Excellent|Very good|Good|Average|Fair)?\s*(?:\(([\d,]+)\s*ratings?\))?/i);
  if (!match) return {};

  const rating = Number.parseFloat(match[1]);
  const reviewCount = match[2] ? Number.parseInt(match[2].replace(/,/g, ""), 10) : undefined;

  return {
    rating: Number.isFinite(rating) ? rating : undefined,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
  };
}

function parseAvailabilityText(block: string) {
  const match = block.match(/([0-9.]+\s*km to [^\n]+?)(?=\s+From\s*€|\s+Share|\s+Add to favourites|$)/i);
  return match?.[1]?.trim() ?? undefined;
}

function findNearestHref(html: string, title: string) {
  const titleIndex = html.indexOf(title);
  if (titleIndex < 0) return null;

  const searchStart = Math.max(0, titleIndex - 2500);
  const fragment = html.slice(searchStart, titleIndex + title.length + 2500);
  const hrefMatches = [...fragment.matchAll(/href=["']([^"']+)["']/gi)];

  if (hrefMatches.length === 0) return null;

  const lastMatch = hrefMatches[hrefMatches.length - 1];
  const candidate = lastMatch[1];

  if (!candidate || /^javascript:/i.test(candidate)) return null;
  return candidate;
}

function findImageUrlAroundTitle(html: string, title: string) {
  const titleIndex = html.indexOf(title);
  if (titleIndex < 0) return null;

  const searchStart = Math.max(0, titleIndex - 3500);
  const fragment = html.slice(searchStart, titleIndex + title.length + 1000);
  const imgMatch = fragment.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
  return imgMatch?.[1] ?? null;
}

function normalizeAbsoluteUrl(candidate: string, baseUrl: string) {
  try {
    const url = new URL(candidate, baseUrl);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }

  return null;
}

function buildFallbackTrivagoBookingUrl(title: string, sourceUrl: string) {
  const fallbackBase = (() => {
    try {
      const url = new URL(sourceUrl);
      return `${url.origin}/en-GB`;
    } catch {
      return "https://www.trivago.com/en-GB";
    }
  })();

  return `${fallbackBase}/oar/${slugify(title)}`;
}

function parseTrivagoOffers(html: string, sourceUrl: string): ParsedTrivagoOffer[] {
  const text = stripHtmlTags(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .filter(Boolean);

  const offers: ParsedTrivagoOffer[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!/From\s*€/i.test(lines[index])) continue;

    let titleIndex = -1;
    for (let cursor = Math.max(0, index - 8); cursor >= Math.max(0, index - 5); cursor -= 1) {
      if (isLikelyTrivagoTitleLine(lines[cursor])) {
        titleIndex = cursor;
        break;
      }
    }

    if (titleIndex < 0) continue;

    const title = lines[titleIndex];
    const block = lines.slice(titleIndex, Math.min(lines.length, index + 1)).join(" \n ");
    const price = parsePriceFromBlock(block);

    if (price === null) continue;

    const { rating, reviewCount } = parseRatingFromBlock(block);
    const availabilityText = parseAvailabilityText(block);
    const bookingHref = findNearestHref(html, title);
    const bookingUrl = bookingHref ? normalizeAbsoluteUrl(bookingHref, sourceUrl) ?? null : null;

    offers.push({
      type: "hotel",
      provider: TRIVAGO_PROVIDER_NAME,
      title,
      description: availabilityText,
      price,
      currency: "EUR",
      bookingUrl: bookingUrl ?? buildFallbackTrivagoBookingUrl(title, sourceUrl),
      sourceUrl,
      imageUrl: findImageUrlAroundTitle(html, title) ?? undefined,
      rating,
      reviewCount,
      availabilityText,
      metadata: {
        provider: "trivago",
        sourceUrl,
      },
      rank: offers.length,
    });
  }

  const uniqueOffers = new Map<string, ParsedTrivagoOffer>();

  for (const offer of offers) {
    const key = offer.title.toLowerCase();
    if (!uniqueOffers.has(key)) uniqueOffers.set(key, offer);
  }

  return [...uniqueOffers.values()];
}

function isTrivagoSource(source: TravelSource) {
  return /trivago\./i.test(source.urlTemplate) || /trivago\./i.test(source.name);
}

function getConfiguredSources(query: TravelOfferQuery): TravelSource[] {
  const hotelUrl = process.env.TRAVEL_HOTEL_SCRAPE_URL;
  const transportUrl = process.env.TRAVEL_TRANSPORT_SCRAPE_URL;

  return [
    hotelUrl ? { kind: "hotel", name: "hotel-source", urlTemplate: buildUrl(hotelUrl, query) } : null,
    transportUrl ? { kind: "transport", name: "transport-source", urlTemplate: buildUrl(transportUrl, query) } : null,
  ].filter(Boolean) as TravelSource[];
}

function parseJsonLd(html: string) {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed: unknown[] = [];

  for (const match of scripts) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) parsed.push(...data);
      else parsed.push(data);
    } catch {
      continue;
    }
  }

  return parsed;
}

function getText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(" ").trim();
  return "";
}

function getImageUrl(value: unknown) {
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function toOffer(value: Record<string, unknown>, kind: SourceKind, provider: string, rank: number): TravelOfferInput | null {
  const name = getText(value.name ?? value.title ?? value.headline);
  const url = typeof value.url === "string" ? value.url : typeof value.sameAs === "string" ? value.sameAs : undefined;
  const priceValue =
    (typeof value.price === "number" ? value.price : Number.NaN) ||
    (typeof value.price === "string" ? Number.parseFloat(value.price) : Number.NaN) ||
    (typeof value.lowPrice === "string" ? Number.parseFloat(value.lowPrice) : Number.NaN);

  if (!name || !url || Number.isNaN(priceValue)) return null;

  return {
    type: kind,
    provider,
    title: name,
    description: getText(value.description),
    price: priceValue,
    currency: typeof value.priceCurrency === "string" ? value.priceCurrency : "EUR",
    bookingUrl: url,
    sourceUrl: url,
    imageUrl: getImageUrl(value.image),
    rating: typeof value.rating === "number" ? value.rating : undefined,
    reviewCount: typeof value.reviewCount === "number" ? value.reviewCount : undefined,
    availabilityText: getText(value.availability),
    metadata: value,
    rank,
  };
}

function collectOffersFromJsonLd(data: unknown, kind: SourceKind, provider: string, rankBase = 0): TravelOfferInput[] {
  const offers: TravelOfferInput[] = [];

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      offers.push(...collectOffersFromJsonLd(item, kind, provider, rankBase + index));
    });
    return offers;
  }

  if (!data || typeof data !== "object") return offers;

  const value = data as Record<string, unknown>;
  const type = value["@type"];
  const typeName = Array.isArray(type) ? type.map(String) : [String(type ?? "")];

  if (typeName.some((entry) => ["Offer", "Hotel", "LodgingBusiness", "Product", "BusTrip", "TrainTrip", "Flight"].includes(entry))) {
    const offer = toOffer(value, kind, provider, rankBase);
    if (offer) offers.push(offer);
  }

  if (value.offers && typeof value.offers === "object") {
    offers.push(...collectOffersFromJsonLd(value.offers, kind, provider, rankBase + offers.length));
  }

  if (Array.isArray(value.itemListElement)) {
    value.itemListElement.forEach((entry, index) => {
      if (entry && typeof entry === "object" && "item" in entry) {
        offers.push(...collectOffersFromJsonLd((entry as Record<string, unknown>).item, kind, provider, rankBase + index));
      }
    });
  }

  return offers;
}

function buildFallbackOffers(query: TravelOfferQuery): TravelOfferInput[] {
  const city = query.city ?? query.destination;
  const hotelPrice = Math.max(90, Math.round((query.budgetMax ?? 180) * 0.58));
  const transportPrice = Math.max(35, Math.round((query.budgetMax ?? 180) * 0.24));

  return [
    {
      type: "hotel",
      provider: "PLAIner Demo Sources",
      title: `${city} Central Stay`,
      description: `Fallback demo offer for ${city} while you configure real providers.`,
      price: hotelPrice,
      currency: query.currency,
      bookingUrl: `https://example.com/book/hotel/${encodeURIComponent(city.toLowerCase())}`,
      sourceUrl: `https://example.com/source/hotel/${encodeURIComponent(city.toLowerCase())}`,
      rating: 4.4,
      reviewCount: 123,
      availabilityText: "Available for your selected dates",
      metadata: { fallback: true },
      rank: 0,
    },
    {
      type: "transport",
      provider: "PLAIner Demo Sources",
      title: `${city} direct transport`,
      description: "Fallback transport offer to verify the UI and cache path.",
      price: transportPrice,
      currency: query.currency,
      bookingUrl: `https://example.com/book/transport/${encodeURIComponent(city.toLowerCase())}`,
      sourceUrl: `https://example.com/source/transport/${encodeURIComponent(city.toLowerCase())}`,
      rating: 4.1,
      reviewCount: 61,
      availabilityText: "Seats available",
      metadata: { fallback: true },
      rank: 0,
    },
  ];
}

async function scrapeSource(source: TravelSource) {
  const response = await fetch(source.urlTemplate, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; PlAInerBot/1.0)",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Source ${source.name} responded with ${response.status}`);
  }

  const html = await response.text();

  if (source.kind === "hotel" && isTrivagoSource(source)) {
    const trivagoOffers = parseTrivagoOffers(html, source.urlTemplate);
    if (trivagoOffers.length > 0) return trivagoOffers;
  }

  const jsonLd = parseJsonLd(html);
  return jsonLd.flatMap((entry, index) => collectOffersFromJsonLd(entry, source.kind, source.name, index));
}

export async function refreshTravelOffers(query: TravelOfferQuery) {
  const normalizedQuery = travelOfferQuerySchema.parse(query);
  const sources = getConfiguredSources(normalizedQuery);

  if (sources.length === 0) {
    return upsertTravelSearchOffers(normalizedQuery, buildFallbackOffers(normalizedQuery), {
      providerSummary: "Demo fallback offers because no scrape sources are configured.",
      status: TravelRefreshRunStatus.SUCCESS,
    });
  }

  const collected: TravelOfferInput[] = [];
  const errors: string[] = [];

  for (const source of sources) {
    // If a RapidAPI hotel provider is configured, prefer it instead of scraping configured hotel URLs
    try {
      if (source.kind === "hotel" && process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) {
        const offers = await searchHotelsRapidAPI(normalizedQuery);
        collected.push(...offers);
        // skip the other handlers for this hotel source
        continue;
      }

      const offers = await scrapeSource(source);
      collected.push(...offers);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  try {
    const flightOffers = await searchFlightsMetasearchForQuery(normalizedQuery);
    collected.push(...flightOffers);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (collected.length === 0) {
    if (errors.length > 0) {
      return upsertTravelSearchOffers(normalizedQuery, [], {
        providerSummary: errors.join(" | "),
        status: TravelRefreshRunStatus.ERROR,
        errorMessage: errors.join(" | "),
      });
    }

    if (sources.some((source) => source.kind === "hotel" && isTrivagoSource(source))) {
      return upsertTravelSearchOffers(normalizedQuery, buildFallbackOffers(normalizedQuery), {
        providerSummary: "Trivago did not return usable hotel listings; using demo fallback offers.",
        status: TravelRefreshRunStatus.SUCCESS,
      });
    }

    return upsertTravelSearchOffers(normalizedQuery, buildFallbackOffers(normalizedQuery), {
      providerSummary: "Fallback offers because the configured sources did not return usable JSON-LD.",
      status: TravelRefreshRunStatus.SUCCESS,
    });
  }

  return upsertTravelSearchOffers(normalizedQuery, collected, {
    providerSummary: `Refreshed from ${sources.length} configured source(s).`,
    status: TravelRefreshRunStatus.SUCCESS,
  });
}