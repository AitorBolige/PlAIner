import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  flightBooked: z.boolean().optional(),
  hotelBooked: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!trip)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  if (trip.userId !== session.user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: parsed.data,
    select: { id: true, flightBooked: true, hotelBooked: true },
  });

  return NextResponse.json({ ok: true, trip: updated });
}
