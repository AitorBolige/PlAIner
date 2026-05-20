import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  days: z
    .array(
      z.object({
        id: z.string().min(1),
        activities: z
          .array(
            z.object({
              id: z.string().min(1),
              order: z.number().int().nonnegative(),
            }),
          )
          .max(40),
      }),
    )
    .max(20),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await ctx.params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { userId: true, days: { select: { id: true } } },
  });
  if (!trip || trip.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const tripDayIds = new Set(trip.days.map((d) => d.id));
  const payloadDayIds = parsed.data.days.map((d) => d.id);

  // All day ids in the payload must belong to this trip
  for (const dayId of payloadDayIds) {
    if (!tripDayIds.has(dayId)) {
      return NextResponse.json(
        { error: "Day does not belong to this trip" },
        { status: 400 },
      );
    }
  }

  // All activity ids must belong to one of this trip's days (validated by a
  // single query rather than per-activity round-trips).
  const allActivityIds = parsed.data.days.flatMap((d) =>
    d.activities.map((a) => a.id),
  );
  const ownedActivities = await prisma.activity.findMany({
    where: {
      id: { in: allActivityIds },
      day: { tripId },
    },
    select: { id: true },
  });
  if (ownedActivities.length !== allActivityIds.length) {
    return NextResponse.json(
      { error: "Activity does not belong to this trip" },
      { status: 400 },
    );
  }

  // Apply updates in a single transaction. Activity has @@index([dayId, order])
  // and (dayId, order) is not unique, so we can update freely.
  await prisma.$transaction(
    parsed.data.days.flatMap((day) =>
      day.activities.map((a) =>
        prisma.activity.update({
          where: { id: a.id },
          data: { dayId: day.id, order: a.order },
        }),
      ),
    ),
  );

  return NextResponse.json({ ok: true });
}
