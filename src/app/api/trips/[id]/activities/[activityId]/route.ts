import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; activityId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId, activityId } = await ctx.params;

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, day: { tripId, trip: { userId: session.user.id } } },
    select: { id: true },
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id: activityId } });
  return NextResponse.json({ ok: true });
}

