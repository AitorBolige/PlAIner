import { prisma } from "@/lib/prisma";
import { refreshTravelOffers } from "@/lib/travel-offers-refresh";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    
    // Default to Lisbon if no params provided
    const query = {
      destination: searchParams.get("destination") || "Lisbon",
      city: searchParams.get("city") || "Lisbon",
      countryCode: searchParams.get("countryCode") || "PT",
      startDate: new Date(searchParams.get("startDate") || new Date().toISOString().split("T")[0]),
      endDate: new Date(searchParams.get("endDate") || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      people: parseInt(searchParams.get("people") || "2"),
      budgetMax: parseInt(searchParams.get("budgetMax") || "500"),
      currency: searchParams.get("currency") || "EUR",
    };

    console.log("🔍 Debug: Testing travel offers with query:", query);

    const result = await refreshTravelOffers(query);
    const searchId = result.search?.id ?? null;
    const latestRun = searchId
      ? await prisma.travelRefreshRun.findFirst({
          where: { searchId },
          orderBy: { startedAt: "desc" },
        })
      : null;

    return Response.json({
      success: true,
      query,
      offersCount: result.offers?.length || 0,
      offers: result.offers,
      refreshStatus: latestRun?.status ?? null,
      providerSummary: latestRun?.providerSummary ?? null,
      errorMessage: latestRun?.errorMessage ?? null,
    });
  } catch (error) {
    console.error("❌ Debug Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
