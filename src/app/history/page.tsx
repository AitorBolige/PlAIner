import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HistoryClient } from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?redirect=/history");

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      destination: true,
      startDate: true,
      endDate: true,
      totalCost: true,
      status: true,
      isFavorite: true,
      createdAt: true,
    },
  });

  return (
    <HistoryClient
      trips={trips.map((t) => ({
        id: t.id,
        destination: t.destination,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        totalCost: t.totalCost,
        status: t.status,
        isFavorite: t.isFavorite,
      }))}
    />
  );
}

