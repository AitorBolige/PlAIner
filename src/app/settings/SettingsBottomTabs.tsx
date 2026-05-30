"use client";

import React from "react";
import { useLocale } from "@/lib/i18n-client";

export interface SettingsBottomTabsProps {
  user: {
    image?: string | null;
  };
}

export function SettingsBottomTabs({ user }: SettingsBottomTabsProps) {
  const { t } = useLocale();
  const TABS = [
    {
      id: "search",
      label: t.tabSearch,
      iconInactive: (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <circle cx={11} cy={11} r={7.5} stroke="currentColor" strokeWidth={1.7} fill="none" />
          <line x1={17} y1={17} x2={22} y2={22} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "trips",
      label: t.tabTrips,
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
      label: t.tabProfile,
      iconActive: user?.image ? (
        <img
          src={user.image}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
          style={{ border: "2px solid var(--green)" }}
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
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] [backdrop-filter:saturate(180%)_blur(20px)] [-webkit-backdrop-filter:saturate(180%)_blur(20px)] transition-[background] duration-[240ms]"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border-md)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <div className="safe-bottom mx-auto flex h-14 max-w-[300px] items-center justify-evenly pb-0.5">
        {TABS.map((t) => {
          const active = t.id === "settings";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (t.id === "search") window.location.href = "/plan";
                else if (t.id === "trips") window.location.href = "/trips";
              }}
              className="flex max-w-[100px] flex-1 flex-col items-center justify-center gap-0.5 border-0 bg-transparent"
              style={{ color: "var(--text-faint)" }}
            >
              {active ? t.iconActive : t.iconInactive}
              <span
                className="text-[10.5px]"
                style={{
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
    </nav>
  );
}
