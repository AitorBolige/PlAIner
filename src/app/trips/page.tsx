import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HistoryClient } from "@/components/history/HistoryClient";
import { BottomTabs } from "@/components/nav/BottomTabs";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata = {
  title: "Els meus viatges - PlAIner",
};

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

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
    },
  });

  const tripsDto = trips.map((t) => ({
    id: t.id,
    destination: t.destination,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    totalCost: t.totalCost,
    status: t.status,
    isFavorite: t.isFavorite,
  }));

  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <PageTransition className="relative min-h-dvh w-full max-w-[480px] border-x border-border bg-bg">
        <HistoryClient trips={tripsDto} />
        <BottomTabs active="trips" />
      </PageTransition>
    </div>
  );
}
