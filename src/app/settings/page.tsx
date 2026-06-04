import * as React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { PhoneWrapper } from "./PhoneWrapper";
import { SettingsBottomTabs } from "./SettingsBottomTabs";
import { PageTransition } from "@/components/motion/PageTransition";
import { getServerLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { t } = getServerLocale();
  return {
    title: `${t.settingsTitle} - PlAIner`,
  };
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { locale, t } = getServerLocale();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nickname: true,
      age: true,
      gender: true,
      nationality: true,
      hobbies: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <PhoneWrapper>
      <PageTransition>
        <div
          className="min-h-dvh pb-20 transition-[background] duration-[240ms]"
          style={{
            background: "var(--bg)",
            transitionTimingFunction: "var(--ease)",
          }}
        >
          <header
            className="relative overflow-hidden px-6 pt-14 pb-[100px]"
            style={{
              background:
                "linear-gradient(155deg, #0D9E7A 0%, #1a6b9a 56%, #2D3561 100%)",
            }}
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-9 h-[190px] w-[190px] rounded-full bg-white/[0.08]"
            />
            <div
              aria-hidden
              className="absolute -bottom-[52px] -left-12 h-[150px] w-[150px] rounded-full bg-white/[0.06]"
            />

            <div className="relative flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[13px] bg-white/[0.16] backdrop-blur-md">
                <Settings size={21} color="#fff" />
              </div>
              <div>
                <h1 className="display m-0 text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                  {t.settingsTitle}
                </h1>
                <p className="mt-0.5 text-[12.5px] text-white/[0.62]">
                  {t.myProfileSubtitle}
                </p>
              </div>
            </div>
          </header>

          <div className="relative z-10 -mt-14">
            <SettingsForm
              userId={session.user.id}
              initialData={user}
              initialLocale={locale}
            />
          </div>
        </div>
      </PageTransition>
      <SettingsBottomTabs user={user} />
    </PhoneWrapper>
  );
}
