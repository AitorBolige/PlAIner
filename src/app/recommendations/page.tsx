import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { BottomTabs } from "@/components/nav/BottomTabs";
import RecommendationsClient from "@/components/recommendations/RecommendationsClient";
import { getServerLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = getServerLocale();
  return {
    title: t.recommendationsTitle,
  };
}

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--surface-sunken)] pb-20">
      <main className="mx-auto w-full max-w-[480px] flex-1">
        <RecommendationsClient />
      </main>

      {/* 4th Tab: "recommendations" */}
      <BottomTabs active="recommendations" />
    </div>
  );
}
