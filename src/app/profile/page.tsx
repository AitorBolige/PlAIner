import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function euro(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      ageGroup: true,
      travelStyles: true,
      budgetMin: true,
      budgetMax: true,
      preferredDuration: true,
    },
  });

  if (!user) redirect("/auth/login");

  const segmentLabel =
    user.ageGroup === "youth"
      ? "Jove explorador"
      : user.ageGroup === "adult"
        ? "Viatger experimentat"
        : user.ageGroup === "senior"
          ? "Viatge amb calma"
          : "—";

  return (
    <PageWrapper className="py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          Perfil
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
          Ajusta preferències per millorar la personalització.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.image} size={48} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {user.name ?? "Usuari"}
              </div>
              <div className="truncate text-sm text-[color:var(--color-text-muted)]">
                {user.email}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
              <span>Segment</span>
              <span className="text-[color:var(--color-text)]">{segmentLabel}</span>
            </div>
            <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
              <span>Durada habitual</span>
              <span className="text-[color:var(--color-text)]">
                {user.preferredDuration ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[color:var(--color-text-muted)]">
              <span>Pressupost</span>
              <span className="text-[color:var(--color-text)]">
                {euro(user.budgetMin)} — {euro(user.budgetMax)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/onboarding">
              <Button variant="secondary" className="w-full">
                Edita preferències
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-display text-xl font-extrabold tracking-wide">
            Estils de viatge
          </div>
          <div className="mt-3 text-sm text-[color:var(--color-text-muted)]">
            {user.travelStyles.length
              ? user.travelStyles.join(" · ")
              : "Encara no has definit estils. Completa l’onboarding."}
          </div>

          <div className="mt-8 border-t border-[color:var(--color-border)] pt-6">
            <div className="font-display text-xl font-extrabold tracking-wide">
              Historial
            </div>
            <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Consulta viatges anteriors i reprèn-los quan vulguis.
            </div>
            <div className="mt-6">
              <Link href="/history">
                <Button>Veure historial</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

