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
          transition: "background 240ms var(--ease)",
          paddingBottom: "56px",
        }}
      >
        {/* ---- Capçalera ---- */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(155deg, #0D9E7A 0%, #1a6b9a 56%, #2D3561 100%)",
            padding: "56px 24px 100px",
          }}
        >
          {/* Cercles decoratius */}
          <div
            style={{
              position: "absolute",
              top: -64,
              right: -36,
              width: 190,
              height: 190,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -52,
              left: -48,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Settings size={21} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "25px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Ajustaments
              </h1>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "rgba(255,255,255,0.62)",
                  margin: "2px 0 0",
                }}
              >
                El teu perfil PlAIner
              </p>
            </div>
          </div>
        </div>

        {/* ---- Targeta del formulari (sobresurt damunt la capçalera) ---- */}
        <div style={{ marginTop: "-56px", position: "relative", zIndex: 10 }}>
          <SettingsForm userId={session.user.id} initialData={user} />
        </div>
      </div>
      <SettingsBottomTabs user={user} />
    </PhoneWrapper>
  );
}
