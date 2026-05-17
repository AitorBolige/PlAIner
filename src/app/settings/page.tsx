import * as React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { PhoneWrapper } from "./PhoneWrapper";
import { SettingsBottomTabs } from "./SettingsBottomTabs";

export const metadata = {
  title: "Ajustaments - PlAIner",
  description: "Edita el teu perfil i ajustaments d'usuari.",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

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
      <div
        style={{
          height: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          background: "var(--bg)",
          paddingBottom: "56px", // Space for bottom tabs
        }}
      >
        <div
          style={{
            height: "28vh",
            minHeight: "180px",
            flexShrink: 0,
            background: "linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 60%, #2D3561 100%)",
            position: "relative",
            overflow: "hidden",
            borderRadius: "0 0 32px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "24px",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Settings size={28} color="#fff" />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "28px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Ajustaments
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
            Actualitza la teva informació personal
          </p>
        </div>

        <div style={{ marginTop: "-20px", position: "relative", zIndex: 10 }}>
          <SettingsForm userId={session.user.id} initialData={user} />
        </div>
      </div>
      <SettingsBottomTabs user={user} />
    </PhoneWrapper>
  );
}
