import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/trip/TripCard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

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

  return (
    <PageWrapper className="py-6 md:py-10">
      <div className="mx-auto w-full max-w-md md:max-w-6xl">
        <div className="mb-5">
          <h1 className="font-display text-3xl font-extrabold tracking-wide">
            El meu viatge
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Historial i accés ràpid als teus plans.
          </p>
        </div>

        {trips.length ? (
          <div className="grid gap-3">
            {trips.map((t) => (
              <TripCard
                key={t.id}
                id={t.id}
                destination={t.destination}
                startDate={t.startDate.toISOString()}
                endDate={t.endDate.toISOString()}
                totalCost={t.totalCost}
                status={t.status}
                isFavorite={t.isFavorite}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="font-display text-xl font-extrabold tracking-wide">
              Encara no tens cap viatge
            </div>
            <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Genera el teu primer itinerari en menys de 15 segons.
            </div>
            <div className="mt-5">
              <Link href="/search">
                <Button className="w-full">Planifica el teu viatge</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

