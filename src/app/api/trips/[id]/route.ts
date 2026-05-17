import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateTripSchema = z.object({
  destination: z.string().trim().min(1).optional(),
  country: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  people: z.coerce.number().int().positive().optional(),
  totalCost: z.coerce.number().nonnegative().optional(),
  flightCost: z.coerce.number().nonnegative().optional(),
  hotelCost: z.coerce.number().nonnegative().optional(),
  activitiesCost: z.coerce.number().nonnegative().optional(),
  dailyCost: z.coerce.number().nonnegative().optional(),
  status: z.string().trim().optional(),
  isFavorite: z.boolean().optional(),
  isSurprise: z.boolean().optional(),
}).strict();

type RouteContext = { params: Promise<{ id: string }> };

async function assertOwnership(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });
  if (!trip) return "NOT_FOUND" as const;
  if (trip.userId !== userId) return "FORBIDDEN" as const;
  return "OK" as const;
}

/**
 * GET /api/trips/:id — get a single trip with days, activities, and linked search offers.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await assertOwnership(id, session.user.id);
  if (ownership === "NOT_FOUND") {
    return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
  }
  if (ownership === "FORBIDDEN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        include: { activities: { orderBy: { order: "asc" } } },
        orderBy: { dayNumber: "asc" },
      },
      search: {
        include: {
          offers: {
            orderBy: [{ rank: "asc" }, { price: "asc" }],
          },
        },
      },
    },
  });

  return NextResponse.json({ ok: true, trip });
}

/**
 * PATCH /api/trips/:id — update trip fields.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await assertOwnership(id, session.user.id);
  if (ownership === "NOT_FOUND") {
    return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
  }
  if (ownership === "FORBIDDEN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const trip = await prisma.trip.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, trip });
}

/**
 * DELETE /api/trips/:id — delete a trip (cascades to days/activities).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await assertOwnership(id, session.user.id);
  if (ownership === "NOT_FOUND") {
    return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
  }
  if (ownership === "FORBIDDEN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.trip.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
