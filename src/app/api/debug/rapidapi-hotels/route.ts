import { NextRequest, NextResponse } from "next/server";

import { travelOfferQuerySchema } from "@/lib/travel-offers";
import { searchHotelsRapidAPI } from "@/lib/travel-providers";

function parseQuery(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return travelOfferQuerySchema.safeParse({
    destination: searchParams.get("destination") ?? "Lisbon",
    city: searchParams.get("city") ?? "Lisbon",
    countryCode: searchParams.get("countryCode") ?? "PT",
    startDate:
      searchParams.get("startDate") ??
      new Date().toISOString().slice(0, 10),
    endDate:
      searchParams.get("endDate") ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    people: searchParams.get("people") ?? "2",
    budgetMax: searchParams.get("budgetMax") ?? "500",
    currency: searchParams.get("currency") ?? "EUR",
  });
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const offers = await searchHotelsRapidAPI(parsed.data);

    return NextResponse.json({
      success: true,
      query: parsed.data,
      offersCount: offers.length,
      offers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        query: parsed.data,
        offersCount: 0,
        offers: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
