import { NextResponse } from 'next/server';
import { searchFlightsMetasearch } from '@/lib/travel-providers';

export async function GET() {
  try {
    // Hardcoded test query for Roundtrip
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30);

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 37);

    const params = {
      originIata: 'LHR',
      destinationIata: 'JFK',
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      passengers: 1,
      maxPrice: 1000,
      currency: 'EUR'
    };

    console.log(`[DEBUG] Calling searchFlightsMetasearch with:`, params);
    const offers = await searchFlightsMetasearch(params);

    return NextResponse.json({
      success: true,
      offerCount: offers.length,
      offers: offers,
      testQuery: params
    });

  } catch (error: any) {
    console.error(`[DEBUG] Route Error:`, error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}