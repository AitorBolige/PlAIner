import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/trips/:id/favorite — toggle isFavorite on a trip.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { userId: true, isFavorite: true },
  });

  if (!trip) {
    return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
  }
  if (trip.userId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: { isFavorite: !trip.isFavorite },
    select: { id: true, isFavorite: true },
  });

  return NextResponse.json({ ok: true, trip: updated });
}
