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
    currency: searchParams.get("currency") ?? undefined,
  });
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const snapshot = await getTravelSearchSnapshot(query);

  return NextResponse.json({
    ok: true,
    query,
    cache: snapshot,
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
      { ok: false, error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const snapshot = await upsertTravelSearchOffers(parsed.data.query, parsed.data.offers, {
    providerSummary: parsed.data.providerSummary,
    status: TravelRefreshRunStatus.SUCCESS,
  });

  return NextResponse.json({
    ok: true,
    cache: snapshot,
  });
}