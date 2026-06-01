import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const source = await prisma.trip.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!source || !source.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const cloned = await prisma.trip.create({
      data: {
        userId: session.user.id,
        destination: source.destination,
        country: source.country,
        imageUrl: source.imageUrl,
        startDate: source.startDate,
        endDate: source.endDate,
        people: source.people,
        travelerAgeGroups: source.travelerAgeGroups,
        totalCost: source.totalCost,
        flightCost: source.flightCost,
        hotelCost: source.hotelCost,
        activitiesCost: source.activitiesCost,
        dailyCost: source.dailyCost,
        status: "draft",
        isSurprise: source.isSurprise,
        isPublic: false,
        clonedFromId: source.id,
        days: {
          create: source.days.map((d) => ({
            dayNumber: d.dayNumber,
            title: d.title,
            activities: {
              create: d.activities.map((a) => ({
                name: a.name,
                description: a.description,
                startTime: a.startTime,
                duration: a.duration,
                cost: a.cost,
                category: a.category,
                imageUrl: a.imageUrl,
                mapsUrl: a.mapsUrl,
                menuUrl: a.menuUrl,
                order: a.order,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ id: cloned.id }, { status: 201 });
  } catch (err) {
    console.error("[clone trip]", err);
    return NextResponse.json({ error: "Error en clonar el viatge." }, { status: 500 });
  }
}
