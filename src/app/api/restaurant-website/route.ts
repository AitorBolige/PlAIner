import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

const CACHE = new Map<string, string | null>();

const MENU_PATHS = [
  "/menu",
  "/carta",
  "/menus",
  "/our-menu",
  "/food-menu",
  "/menu/",
  "/carta/",
  "/menus/",
  "/gastronomy",
  "/gastronomia",
  "/ementa",
  "/restaurante",
  "/restaurant/menu",
  "/food",
  "/dining",
  "/comer",
  "/what-we-serve",
  "/our-food",
];

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
    });
    return res.status < 400;
  } catch {
    return false;
  }
}

/** Scrape homepage looking for a menu-related internal link. */
async function scrapeMenuLink(website: string): Promise<string | null> {
  try {
    const html = await fetch(website, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PlAIner/1.0)" },
    }).then((r) => r.text());

    const base = new URL(website);
    const menuKeywords =
      /\b(menu|carta|menus|ementa|food|dining|gastronom|comer)\b/i;

    // Match all <a href="..."> tags
    const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(
      (m) => m[1],
    );
    for (const href of hrefs) {
      if (!menuKeywords.test(href)) continue;
      // In-page anchor (e.g. #menu-anchor) — return base + anchor directly
      if (href.startsWith("#")) return `${website.replace(/\/$/, "")}/${href}`;
      try {
        const full = new URL(href, base).href;
        if (new URL(full).hostname !== base.hostname) continue;
        if (await urlExists(full)) return full;
      } catch {
        /* skip malformed */
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function findMenuPage(website: string): Promise<string> {
  const base = website.replace(/\/$/, "");
  // 1. Try common paths
  for (const path of MENU_PATHS) {
    if (await urlExists(`${base}${path}`)) return `${base}${path}`;
  }
  // 2. Scrape homepage for menu links
  const scraped = await scrapeMenuLink(website);
  if (scraped) return scraped;
  // 3. Return homepage (user lands on official site)
  return website;
}

/** Try OSM/Nominatim extratags for website + menu fields (free, no key). */
async function nominatimWebsite(
  name: string,
  dest: string,
  lat: string | null,
  lng: string | null,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: `${name} ${dest}`,
      format: "json",
      limit: "1",
      extratags: "1",
      "accept-language": "en",
    });
    if (lat && lng) {
      const D = 0.3;
      params.set(
        "viewbox",
        `${parseFloat(lng) - D},${parseFloat(lat) + D},${parseFloat(lng) + D},${parseFloat(lat) - D}`,
      );
      params.set("bounded", "1");
    }
    const data = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "User-Agent": "PlAIner/1.0 (aitorbolige187@gmail.com)" } },
    ).then((r) => r.json());

    const tags = data?.[0]?.extratags ?? {};
    return (
      tags["contact:menu"] ??
      tags["menu"] ??
      tags["contact:website"] ??
      tags["website"] ??
      null
    );
  } catch {
    return null;
  }
}

/** Google Places — returns { website, mapsUrl } for a restaurant. */
async function placesLookup(
  name: string,
  dest: string,
  lat: string | null,
  lng: string | null,
): Promise<{ website: string | null; mapsUrl: string | null }> {
  const empty = { website: null, mapsUrl: null };
  if (!KEY) return empty;
  try {
    const query = encodeURIComponent(`${name} ${dest}`);
    let tsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${KEY}`;
    if (lat && lng) tsUrl += `&location=${lat},${lng}&radius=2000`;
    const tsData = await fetch(tsUrl).then((r) => r.json());
    if (tsData.status !== "OK") return empty;
    const placeId = tsData?.results?.[0]?.place_id;
    if (!placeId) return empty;
    // Fetch both website (official site) and url (canonical Maps URL)
    const detData = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,url&key=${KEY}`,
    ).then((r) => r.json());
    return {
      website: detData?.result?.website ?? null,
      mapsUrl: detData?.result?.url ?? null,
    };
  } catch {
    return empty;
  }
}

/** Fallback: Google Maps search for "{restaurant} carta menu" centred on coords → shows place with menu. */
function mapsMenuUrl(
  name: string,
  dest: string,
  lat: string | null,
  lng: string | null,
): string {
  const q = encodeURIComponent(`${name} ${dest} carta menu`);
  if (lat && lng)
    return `https://www.google.com/maps/search/${q}/@${lat},${lng},17z`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name")?.trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const dest = searchParams.get("dest")?.trim() ?? "";

  if (!name) return NextResponse.json(null);

  const cacheKey = `${name}|${dest}|${lat ?? ""}|${lng ?? ""}`;
  if (CACHE.has(cacheKey))
    return NextResponse.json(CACHE.get(cacheKey) ?? null);

  // 1. OSM Nominatim extratags (free, no quota)
  let website = await nominatimWebsite(name, dest, lat, lng);

  // 2. Google Places API — also gives us the canonical Maps URL as fallback
  let canonicalMapsUrl: string | null = null;
  if (!website) {
    const places = await placesLookup(name, dest, lat, lng);
    website = places.website;
    canonicalMapsUrl = places.mapsUrl;
  }

  let result: string;
  if (website) {
    // Probe for direct menu sub-page on the official website
    result = await findMenuPage(website);
  } else {
    // Use canonical Maps URL from Places if available, else construct menu search
    result = canonicalMapsUrl ?? mapsMenuUrl(name, dest, lat, lng);
  }

  CACHE.set(cacheKey, result);
  return NextResponse.json(result);
}
