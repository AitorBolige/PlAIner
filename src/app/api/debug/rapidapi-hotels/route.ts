import { NextResponse } from "next/server";

import {
  searchHotelsApiDojo,
  type ApiDojoHotelParams,
} from "@/lib/travel-providers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryFromUrl = url.searchParams.get("query");
    const adultsFromUrl = url.searchParams.get("adults");
    const currencyFromUrl = url.searchParams.get("currency");

    const checkin = new Date();
    checkin.setDate(checkin.getDate() + 3);
    const checkout = new Date();
    checkout.setDate(checkout.getDate() + 5);

    const params: ApiDojoHotelParams = {
      query: queryFromUrl || "Lisbon",
      checkin: checkin.toISOString().split("T")[0],
      checkout: checkout.toISOString().split("T")[0],
      adults: adultsFromUrl ? Number(adultsFromUrl) : 2,
      rooms: 1,
      currency: currencyFromUrl || "EUR",
    };

    console.log(`[DEBUG hotels] Calling searchHotelsApiDojo with:`, params);
    const offers = await searchHotelsApiDojo(params);

    return NextResponse.json({
      success: true,
      provider: "APIDojo Booking-v1",
      offerCount: offers.length,
      preview: offers.slice(0, 3),
      offers,
      testQuery: params,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[DEBUG hotels] Route Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack,
      },
      { status: 500 },
    );
  }
}
