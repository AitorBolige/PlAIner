import { NextRequest, NextResponse } from "next/server";
import { searchFlightsMetasearch } from "@/lib/travel-providers";
import { assertDebugAccess } from "@/lib/debug-guard";

export async function GET(request: NextRequest) {
  const denied = assertDebugAccess(request);
  if (denied) return denied;
  try {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30);

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 37);

    const sp = request.nextUrl.searchParams;
    const params = {
      originIata: (sp.get("origin") || "LHR").toUpperCase(),
      destinationIata: (sp.get("destination") || "JFK").toUpperCase(),
      departureDate:
        sp.get("departureDate") || departureDate.toISOString().split("T")[0],
      returnDate:
        sp.get("returnDate") || returnDate.toISOString().split("T")[0],
      passengers: Number(sp.get("passengers") || 1),
      maxPrice: Number(sp.get("maxPrice") || 1000),
      currency: (sp.get("currency") || "EUR").toUpperCase().slice(0, 3),
    };

    console.log(`[DEBUG] Calling searchFlightsMetasearch with:`, params);
    const offers = await searchFlightsMetasearch(params);

    return NextResponse.json({
      success: true,
      offerCount: offers.length,
      offers: offers,
      testQuery: params,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[DEBUG] Route Error:`, error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
