import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { Card } from "@/components/ui/Card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TripBudgetPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await props.params;
  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      destination: true,
      totalCost: true,
      flightCost: true,
      hotelCost: true,
      activitiesCost: true,
      dailyCost: true,
    },
  });

  if (!trip) redirect("/history");

  return (
    <PageWrapper className="py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          Pressupost — {trip.destination}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
          Transparència total de costos, des del primer minut.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <BudgetBreakdown
          total={trip.totalCost}
          flight={trip.flightCost}
          hotel={trip.hotelCost}
          activities={trip.activitiesCost}
          daily={trip.dailyCost}
        />

        <Card className="p-6">
          <div className="font-display text-xl font-extrabold tracking-wide">
            Com es calcula
          </div>
          <div className="mt-3 text-sm text-[color:var(--color-text-muted)]">
            PLAIner suma vol, hotel, activitats i un estimat diari coherent amb
            el teu estil i ritme. Pots ajustar activitats per mantenir el total
            dins del teu rang.
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

