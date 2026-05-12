import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { travelOfferQuerySchema } from "@/lib/travel-offers";
import { refreshTravelOffers } from "@/lib/travel-offers-refresh";

const refreshBodySchema = z.object({
  query: travelOfferQuerySchema,
});

function assertRefreshSecret(request: NextRequest) {
  const configuredSecret = process.env.TRAVEL_OFFERS_INGEST_SECRET?.trim();
  if (!configuredSecret) return true;

  const incomingSecret = request.headers.get("x-travel-offers-secret")?.trim();
  return incomingSecret === configuredSecret;
}

export async function POST(request: NextRequest) {
  if (!assertRefreshSecret(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = refreshBodySchema.safeParse(body);

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

  const cache = await refreshTravelOffers(parsed.data.query);

  return NextResponse.json({
    ok: true,
    cache,
  });
}
