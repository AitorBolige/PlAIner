import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  mapItineraryToDaysCreate,
  prismaDaysToItinerary,
  sumItineraryActivitiesCost,
} from "@/lib/itinerary";
import { prisma } from "@/lib/prisma";

const placeSlotSchema = z.object({
  name: z.string().trim().min(1),
  estimated_cost_eur: z.coerce.number().nonnegative(),
  Maps_url: z.string().trim().min(1),
});

const activitySlotSchema = placeSlotSchema.extend({
  description: z.string(),
});

const restaurantSlotSchema = placeSlotSchema.extend({
  cuisine: z.string(),
});

const itineraryDaySchema = z.object({
  day_number: z.coerce.number().int().positive(),
  theme: z.string().trim().min(1),
  morning_activity: activitySlotSchema,
  lunch_restaurant: restaurantSlotSchema,
  afternoon_activity: activitySlotSchema,
  dinner_restaurant: restaurantSlotSchema,
});

const itinerarySchema = z.object({
  trip_title: z.string().trim().min(1),
  days: z.array(itineraryDaySchema).min(1),
});

const createTripSchema = z.object({
  destination: z.string().trim().min(1),
  country: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  people: z.coerce.number().int().positive().default(2),
  travelerAgeGroups: z.array(z.string()).optional(),
  totalCost: z.coerce.number().nonnegative().default(0),
  flightCost: z.coerce.number().nonnegative().default(0),
  hotelCost: z.coerce.number().nonnegative().default(0),
  activitiesCost: z.coerce.number().nonnegative().optional(),
  dailyCost: z.coerce.number().nonnegative().default(0),
  status: z.string().trim().default("draft"),
  isSurprise: z.boolean().default(false),
  searchCacheKey: z.string().trim().optional(),
  itinerary: itinerarySchema.optional(),
});

const tripInclude = {
  days: {
    include: { activities: { orderBy: { order: "asc" as const } } },
    orderBy: { dayNumber: "asc" as const },
  },
  search: {
    select: {
      id: true,
      destination: true,
      status: true,
      refreshedAt: true,
      expiresAt: true,
    },
  },
} as const;

function tripWithItinerary<
  T extends {
    destination: string;
    days: Parameters<typeof prismaDaysToItinerary>[1];
  },
>(trip: T) {
  const itinerary =
    trip.days.length > 0
      ? prismaDaysToItinerary(trip.destination, trip.days)
      : null;
  return { ...trip, itinerary };
}

/**
 * GET /api/trips — list all trips for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: tripInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    trips: trips.map(tripWithItinerary),
  });
}

/**
 * POST /api/trips — create a new saved trip.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);

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

  const data = parsed.data;

  let searchId: string | null = null;
  if (data.searchCacheKey) {
    const search = await prisma.travelSearch.findUnique({
      where: { cacheKey: data.searchCacheKey },
      select: { id: true },
    });
    searchId = search?.id ?? null;
  }

  const activitiesCost =
    data.itinerary != null
      ? sumItineraryActivitiesCost(data.itinerary)
      : (data.activitiesCost ?? 0);

  const trip = await prisma.trip.create({
    data: {
      userId: session.user.id,
      destination: data.destination,
      country: data.country ?? null,
      imageUrl: data.imageUrl ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      people: data.people,
      travelerAgeGroups: data.travelerAgeGroups ?? [],
      totalCost: data.totalCost,
      flightCost: data.flightCost,
      hotelCost: data.hotelCost,
      activitiesCost,
      dailyCost: data.dailyCost,
      status: data.status,
      isSurprise: data.isSurprise,
      searchId,
      days: data.itinerary
        ? { create: mapItineraryToDaysCreate(data.itinerary) }
        : undefined,
    },
    include: tripInclude,
  });

  return NextResponse.json(
    { ok: true, trip: tripWithItinerary(trip) },
    { status: 201 },
  );
}
