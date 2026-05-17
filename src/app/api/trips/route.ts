import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTripSchema = z.object({
  destination: z.string().trim().min(1),
  country: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  people: z.coerce.number().int().positive().default(2),
  totalCost: z.coerce.number().nonnegative().default(0),
  flightCost: z.coerce.number().nonnegative().default(0),
  hotelCost: z.coerce.number().nonnegative().default(0),
  activitiesCost: z.coerce.number().nonnegative().default(0),
  dailyCost: z.coerce.number().nonnegative().default(0),
  status: z.string().trim().default("draft"),
  isSurprise: z.boolean().default(false),
  // Optional: link to an existing TravelSearch by cache-key params
  searchCacheKey: z.string().trim().optional(),
});

/**
 * GET /api/trips — list all trips for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: {
      search: {
        select: {
          id: true,
          destination: true,
          status: true,
          refreshedAt: true,
          expiresAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, trips });
}

/**
 * POST /api/trips — create a new saved trip.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Resolve searchId if a cache key was provided
  let searchId: string | null = null;
  if (data.searchCacheKey) {
    const search = await prisma.travelSearch.findUnique({
      where: { cacheKey: data.searchCacheKey },
      select: { id: true },
    });
    searchId = search?.id ?? null;
  }

  const trip = await prisma.trip.create({
    data: {
      userId: session.user.id,
      destination: data.destination,
      country: data.country ?? null,
      imageUrl: data.imageUrl ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      people: data.people,
      totalCost: data.totalCost,
      flightCost: data.flightCost,
      hotelCost: data.hotelCost,
      activitiesCost: data.activitiesCost,
      dailyCost: data.dailyCost,
      status: data.status,
      isSurprise: data.isSurprise,
      searchId,
    },
  });

  return NextResponse.json({ ok: true, trip }, { status: 201 });
}
