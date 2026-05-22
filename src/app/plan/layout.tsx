import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Planifica - PlAIner",
};

export default async function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  // Els usuaris nous (sense onboarding completat) van primer a l'onboarding.
  if (!session.user.onboarded) {
    redirect("/auth/onboarding");
  }

  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative min-h-dvh w-full max-w-[480px] border-x border-border bg-bg">
        {children}
      </div>
    </div>
  );
}
