import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN =
  process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

const CACHE = new Map<string, [number, number] | null>();

// ── Google Maps Geocoding API ─────────────────────────────────────────────────
// Best coverage: restaurants, local POIs, anything Gemini can suggest.

async function googleGeocode(
  q: string,
  plng: string | null,
  plat: string | null,
): Promise<[number, number] | null> {
  if (!GOOGLE_KEY) return null;
  const params = new URLSearchParams({
    address: q,
    key: GOOGLE_KEY,
  });
  // Use location + radius bias (~5 km around city centre) to prefer local results.
  if (plng && plat) {
    params.set("location", `${plat},${plng}`);
    params.set("radius", "50000");
  }
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    );
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc?.lat && loc?.lng) return [loc.lng, loc.lat];
    return null;
  } catch {
    return null;
  }
}

// ── Nominatim (OSM) ───────────────────────────────────────────────────────────
// Free, no key. Good for cities and well-known landmarks. Weak on restaurants.

async function nominatimGeocode(
  q: string,
  plng: string | null,
  plat: string | null,
): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    addressdetails: "0",
    "accept-language": "en",
  });
  if (plng && plat) {
    const D = 0.5;
    const lng = parseFloat(plng);
    const lat = parseFloat(plat);
    params.set("viewbox", `${lng - D},${lat + D},${lng + D},${lat - D}`);
    params.set("bounded", "1");
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "User-Agent": "PlAIner/1.0 (aitorbolige187@gmail.com)" } },
    );
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.lon) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
    return null;
  } catch {
    return null;
  }
}

// ── Mapbox Geocoding v5 ───────────────────────────────────────────────────────

async function mapboxGeocode(
  q: string,
  dest: boolean,
  plng: string | null,
  plat: string | null,
): Promise<[number, number] | null> {
  if (!MAPBOX_TOKEN) return null;
  const types = dest ? "place,locality" : "poi,address";
  let url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?types=${types}&limit=1&access_token=${MAPBOX_TOKEN}`;
  if (plng && plat && !dest) {
    const D = 0.45;
    const lng = parseFloat(plng);
    const lat = parseFloat(plat);
    url += `&proximity=${lng},${lat}&bbox=${lng - D},${lat - D},${lng + D},${lat + D}`;
  }
  try {
    const data = await fetch(url).then((r) => r.json());
    const c: [number, number] | undefined = data?.features?.[0]?.center;
    return c ?? null;
  } catch {
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const plng = searchParams.get("plng");
  const plat = searchParams.get("plat");
  const dest = searchParams.get("dest") === "1";

  if (!q) return NextResponse.json(null);

  const cacheKey = `${q}|${plng ?? ""}|${plat ?? ""}`;
  if (CACHE.has(cacheKey))
    return NextResponse.json(CACHE.get(cacheKey) ?? null);

  let result: [number, number] | null = null;

  if (dest) {
    // City anchor: Nominatim is very good at city names
    result = await nominatimGeocode(q, null, null);
    if (!result) result = await mapboxGeocode(q, true, null, null);
    if (!result) result = await googleGeocode(q, null, null);
  } else {
    // POI cascade: Nominatim (fast, free) → Google (definitive for anything Gemini names)
    result = await nominatimGeocode(q, plng, plat);
    if (!result) result = await googleGeocode(q, plng, plat);
    if (!result) result = await mapboxGeocode(q, false, plng, plat);
  }

  CACHE.set(cacheKey, result);
  return NextResponse.json(result);
}
