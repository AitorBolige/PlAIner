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

  const current = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, isFavorite: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.trip.update({
    where: { id: current.id },
    data: { isFavorite: !current.isFavorite },
    select: { id: true, isFavorite: true },
  });

  return NextResponse.json({ ok: true, isFavorite: updated.isFavorite });
}

