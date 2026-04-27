import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/trip/TripCard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Tab = "all" | "confirmed" | "draft";

function tabFromSearchParams(v: string | undefined): Tab {
  if (v === "confirmed") return "confirmed";
  if (v === "draft") return "draft";
  return "all";
}

export default async function FavoritesPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const sp = await props.searchParams?.catch(() => ({} as { tab?: string }));
  const tab = tabFromSearchParams(sp?.tab);

  const whereStatus =
    tab === "confirmed"
      ? { status: "confirmed" }
      : tab === "draft"
        ? { status: "draft" }
        : {};

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id, isFavorite: true, ...whereStatus },
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

  const tabs: Array<{ key: Tab; label: string; href: string }> = [
    { key: "all", label: "Tots", href: "/favorites?tab=all" },
    { key: "confirmed", label: "Confirmats", href: "/favorites?tab=confirmed" },
    { key: "draft", label: "Esborranys", href: "/favorites?tab=draft" },
  ];

  return (
    <PageWrapper className="py-6 md:py-10">
      <div className="mx-auto w-full max-w-md md:max-w-6xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-wide">
              Favorits
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Guarda viatges per reprendre’ls més tard.
            </p>
          </div>
        </div>

        <Card className="mb-4 p-2">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={[
                  "inline-flex h-10 items-center justify-center rounded-full text-sm font-semibold",
                  t.key === tab
                    ? "bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-[color:var(--color-primary)]"
                    : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-black/[0.03]",
                ].join(" ")}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </Card>

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
              Encara no tens favorits
            </div>
            <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Afegeix un viatge als favorits des de l’historial o el detall.
            </div>
            <div className="mt-5">
              <Link href="/history">
                <Button className="w-full" variant="secondary">
                  Veure el meu viatge
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

