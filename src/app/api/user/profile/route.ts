import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      ageGroup: true,
      travelStyles: true,
      budgetMin: true,
      budgetMax: true,
      preferredDuration: true,
    },
  });

  return NextResponse.json({ user });
}

const patchSchema = z.object({
  ageGroup: z.enum(["youth", "adult", "senior"]).nullable().optional(),
  travelStyles: z
    .array(
      z.enum([
        "Cultura",
        "Natura",
        "Gastronomia",
        "Platja",
        "Aventura",
        "Relax",
        "Urbà",
        "Luxe",
      ])
    )
    .optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  duration: z.enum(["2", "3-4", "5-7", "7-14", "14+"]).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ageGroup: parsed.data.ageGroup ?? undefined,
      travelStyles: parsed.data.travelStyles ?? undefined,
      budgetMin: parsed.data.budgetMin ?? undefined,
      budgetMax: parsed.data.budgetMax ?? undefined,
      preferredDuration: parsed.data.duration ?? undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      ageGroup: true,
      travelStyles: true,
      budgetMin: true,
      budgetMax: true,
      preferredDuration: true,
    },
  });

  return NextResponse.json({ user: updated });
}

