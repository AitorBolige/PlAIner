"use client";

import React from "react";

export function SettingsBottomTabs({ user }: { user: any }) {
  const TABS = [
    {
      id: "search",
      label: "Cerca",
      iconInactive: (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <circle cx={11} cy={11} r={7.5} stroke="currentColor" strokeWidth={1.7} fill="none" />
          <line x1={17} y1={17} x2={22} y2={22} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "trips",
      label: "Viatges",
      iconInactive: (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            stroke="currentColor"
            strokeWidth={1.7}
            fill="none"
            strokeLinejoin="round"
          />
          <circle cx={12} cy={9} r={2.5} stroke="currentColor" strokeWidth={1.5} fill="none" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Perfil",
      iconActive: user?.image ? (
        <img
          src={user.image}
          style={{ width: 24, height: 24, borderRadius: 12, border: "2px solid var(--green)", objectFit: "cover" }}
        />
      ) : (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <circle cx={12} cy={8} r={4} fill="var(--green)" opacity={0.18} />
          <circle cx={12} cy={8} r={4} stroke="var(--green)" strokeWidth={2} fill="none" />
          <path
            d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
            stroke="var(--green)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "var(--surface)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: "1px solid var(--border-md)",
        transition: "background 240ms var(--ease)",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 56,
          paddingBottom: 2,
          justifyContent: "space-evenly",
          alignItems: "center",
          margin: "0 auto",
          maxWidth: 300,
        }}
      >
        {TABS.map((t) => {
          const active = t.id === "settings";
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === "search" || t.id === "trips") {
                  window.location.href = `/plainer-mvp.html?tab=${t.id}`;
                }
              }}
              style={{
                flex: 1,
                maxWidth: 100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-faint)",
              }}
            >
              {active ? t.iconActive : t.iconInactive}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--green)" : "var(--text-faint)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
