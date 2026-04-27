import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trip.update({
    where: { id },
    data: { isSurprise: true },
  });

  return NextResponse.json({
    destination: trip.destination,
    days: trip.days.map((d) => ({ dayNumber: d.dayNumber, title: d.title })),
  });
}

