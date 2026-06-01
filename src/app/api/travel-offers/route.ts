import { NextRequest, NextResponse } from "next/server";
import { TravelRefreshRunStatus } from "@prisma/client";
import { z } from "zod";

import {
  travelOfferQuerySchema,
  travelOfferSchema,
  getTravelSearchSnapshot,
  upsertTravelSearchOffers,
} from "@/lib/travel-offers";

const postBodySchema = z.object({
  query: travelOfferQuerySchema,
  offers: z.array(travelOfferSchema),
  providerSummary: z.string().trim().optional(),
});

function assertIngestSecret(request: NextRequest) {
  const configuredSecret = process.env.TRAVEL_OFFERS_INGEST_SECRET?.trim();
  if (!configuredSecret) return true;

  const incomingSecret = request.headers.get("x-travel-offers-secret")?.trim();
  return incomingSecret === configuredSecret;
}

function parseQuery(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return travelOfferQuerySchema.safeParse({
    destination: searchParams.get("destination") ?? "",
    city: searchParams.get("city") ?? undefined,
    countryCode: searchParams.get("countryCode") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    people: searchParams.get("people") ?? undefined,
    budgetMax: searchParams.get("budgetMax") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    currency: searchParams.get("currency") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
    transportId: searchParams.get("transportId") ?? undefined,
  });
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid query parameters",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const snapshot = await getTravelSearchSnapshot(query);

  // If the cache exists but has no HOTEL offers, OR only fallback transports
  // (meaning the last refresh failed to get real flights), treat it as empty so
  // the frontend triggers a fresh refresh attempt.
  const hasHotels = snapshot.offers.some(
    (o) => String(o.type).toUpperCase() === "HOTEL",
  );
  const expectedKind = query.transportId ?? "plane";
  const transports = snapshot.offers.filter(
    (o) => String(o.type).toUpperCase() === "TRANSPORT",
  );
  const hasMatchingTransports = transports.some((o) => {
    const meta = o.metadata as { fallback?: boolean; transportKind?: string } | null;
    const kindMatches = !meta?.transportKind || meta.transportKind === expectedKind;
    if (!kindMatches) return false;
    // Plane: require non-fallback. Ground modes: any matching-kind transport is OK
    // (we don't have a real API for trains/buses, the curated offers are the real product).
    return expectedKind !== "plane" || meta?.fallback !== true;
  });
  const cacheUsable = hasHotels && hasMatchingTransports;
  // Hoist `metadata.transportKind` to top-level so the client `Offer` shape
  // gets it without poking into metadata.
  const normalizedOffers = cacheUsable
    ? snapshot.offers.map((o) => {
        const meta = o.metadata as { transportKind?: string } | null;
        return meta?.transportKind ? { ...o, transportKind: meta.transportKind } : o;
      })
    : [];
  const effectiveCache = { ...snapshot, offers: normalizedOffers };

  return NextResponse.json({
    ok: true,
    query,
    cache: effectiveCache,
  });
}

export async function POST(request: NextRequest) {
  if (!assertIngestSecret(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = postBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const snapshot = await upsertTravelSearchOffers(
    parsed.data.query,
    parsed.data.offers,
    {
      providerSummary: parsed.data.providerSummary,
      status: TravelRefreshRunStatus.SUCCESS,
    },
  );

  return NextResponse.json({
    ok: true,
    cache: snapshot,
  });
}
