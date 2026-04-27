import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TripDetailClient } from "@/app/trip/[id]/TripDetailClient";

export default async function TripDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await props.params;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!trip) redirect("/history");

  return (
    <PageWrapper className="py-10">
      <TripDetailClient
        trip={{
          id: trip.id,
          destination: trip.destination,
          startDate: trip.startDate.toISOString(),
          endDate: trip.endDate.toISOString(),
          totalCost: trip.totalCost,
          flightCost: trip.flightCost,
          hotelCost: trip.hotelCost,
          activitiesCost: trip.activitiesCost,
          dailyCost: trip.dailyCost,
          days: trip.days.map((d) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            activities: d.activities.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              startTime: a.startTime,
              duration: a.duration,
              cost: a.cost,
              category: a.category,
              order: a.order,
            })),
          })),
        }}
      />
    </PageWrapper>
  );
}

