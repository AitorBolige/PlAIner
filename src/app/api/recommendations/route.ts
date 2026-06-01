import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/recommendations — list public trips from other users.
 *
 * Query params:
 *   destination  — partial match on trip destination
 *   minBudget / maxBudget — total cost range
 *   minPeople / maxPeople — people range
 *   minDays / maxDays — duration range
 *   sortBy — "recent" | "cheapest" | "expensive"  (default "recent")
 *   cursor — trip id for cursor-based pagination
 *   limit  — page size (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const sp = request.nextUrl.searchParams;

  // Filters
  const destination = sp.get("destination")?.trim() || undefined;
  const minBudget = sp.has("minBudget") ? Number(sp.get("minBudget")) : undefined;
  const maxBudget = sp.has("maxBudget") ? Number(sp.get("maxBudget")) : undefined;
  const minPeople = sp.has("minPeople") ? Number(sp.get("minPeople")) : undefined;
  const maxPeople = sp.has("maxPeople") ? Number(sp.get("maxPeople")) : undefined;
  const minDays = sp.has("minDays") ? Number(sp.get("minDays")) : undefined;
  const maxDays = sp.has("maxDays") ? Number(sp.get("maxDays")) : undefined;
  const sortBy = sp.get("sortBy") || "recent";
  const cursor = sp.get("cursor") || undefined;
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 20));

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isPublic: true,
    days: { some: {} },
  };

  if (destination) {
    where.destination = { contains: destination, mode: "insensitive" };
  }

  if (minBudget != null && !isNaN(minBudget)) {
    where.totalCost = { ...(where.totalCost || {}), gte: minBudget };
  }
  if (maxBudget != null && !isNaN(maxBudget)) {
    where.totalCost = { ...(where.totalCost || {}), lte: maxBudget };
  }

  if (minPeople != null && !isNaN(minPeople)) {
    where.people = { ...(where.people || {}), gte: minPeople };
  }
  if (maxPeople != null && !isNaN(maxPeople)) {
    where.people = { ...(where.people || {}), lte: maxPeople };
  }

  // Duration filter: compare days between startDate and endDate
  // We use raw SQL condition for this via Prisma's AND array
  if ((minDays != null && !isNaN(minDays)) || (maxDays != null && !isNaN(maxDays))) {
    // We'll filter post-query for duration since Prisma doesn't support
    // computed column filters directly. For a small app this is fine.
    // We fetch a bit more and filter in JS.
  }

  // Sorting
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder>;
  switch (sortBy) {
    case "cheapest":
      orderBy = { totalCost: "asc" };
      break;
    case "expensive":
      orderBy = { totalCost: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  // Fetch with cursor pagination
  let trips = await prisma.trip.findMany({
    where,
    orderBy,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
    include: {
      user: {
        select: {
          nickname: true,
          nationality: true,
          image: true,
        },
      },
    },
  });

  // Post-query duration filter
  if ((minDays != null && !isNaN(minDays)) || (maxDays != null && !isNaN(maxDays))) {
    trips = trips.filter((t) => {
      const days = Math.max(
        1,
        Math.round(
          (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      if (minDays != null && !isNaN(minDays) && days < minDays) return false;
      if (maxDays != null && !isNaN(maxDays) && days > maxDays) return false;
      return true;
    });
  }

  // Determine if there are more results
  const hasMore = trips.length > limit;
  if (hasMore) trips = trips.slice(0, limit);

  const nextCursor = hasMore && trips.length > 0 ? trips[trips.length - 1].id : null;

  const tripsDto = trips.map((t) => ({
    id: t.id,
    destination: t.destination,
    country: t.country,
    imageUrl: t.imageUrl,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    people: t.people,
    totalCost: t.totalCost,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    isOwn: t.userId === session.user?.id,
    author: {
      nickname: t.user.nickname || null,
      nationality: t.user.nationality || null,
      image: t.user.image || null,
    },
  }));

  return NextResponse.json({
    ok: true,
    trips: tripsDto,
    nextCursor,
  });
}
