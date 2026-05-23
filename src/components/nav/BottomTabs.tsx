import * as React from "react";
import Link from "next/link";

type TabId = "search" | "trips" | "settings";

const ACTIVE = "var(--green)";
const INACTIVE = "#A0998E";

function SearchIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <circle cx={11} cy={11} r={7.5} fill={ACTIVE} opacity={0.18} />
      <circle cx={11} cy={11} r={7.5} stroke={ACTIVE} strokeWidth={2} fill="none" />
      <line x1={17} y1={17} x2={22} y2={22} stroke={ACTIVE} strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  ) : (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <circle cx={11} cy={11} r={7.5} stroke={INACTIVE} strokeWidth={1.7} fill="none" />
      <line x1={17} y1={17} x2={22} y2={22} stroke={INACTIVE} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}

function TripsIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={ACTIVE}
        opacity={0.18}
        stroke={ACTIVE}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={9} r={2.5} fill={ACTIVE} />
    </svg>
  ) : (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={INACTIVE}
        strokeWidth={1.7}
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx={12} cy={9} r={2.5} stroke={INACTIVE} strokeWidth={1.5} fill="none" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      {active ? <circle cx={12} cy={8} r={4} fill={ACTIVE} opacity={0.18} /> : null}
      <circle cx={12} cy={8} r={4} stroke={c} strokeWidth={active ? 2 : 1.7} fill="none" />
      <path
        d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
        stroke={c}
        strokeWidth={active ? 2 : 1.7}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const TABS: {
  id: TabId;
  label: string;
  href: string;
  Icon: (p: { active: boolean }) => React.ReactElement;
}[] = [
  { id: "search", label: "Cerca", href: "/plan", Icon: SearchIcon },
  { id: "trips", label: "Viatges", href: "/trips", Icon: TripsIcon },
  { id: "settings", label: "Perfil", href: "/settings", Icon: ProfileIcon },
];

/**
 * Bottom tab bar for the migrated RSC screens. Mirrors the look of the legacy
 * legacy BottomTabs so navigation feels seamless across the migrated routes.
 */
export function BottomTabs({ active }: { active: TabId }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px]"
      style={{
        background: "var(--surface)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: "0.5px solid rgba(0,0,0,0.12)",
      }}
    >
      <div className="safe-bottom mx-auto flex h-14 max-w-[300px] items-center justify-evenly pb-0.5">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <Link
              key={t.id}
              href={t.href}
              className="flex flex-1 max-w-[100px] flex-col items-center justify-center gap-0.5 no-underline"
            >
              <span
                style={{
                  transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                }}
              >
                <t.Icon active={isActive} />
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.01em",
                  color: isActive ? ACTIVE : INACTIVE,
                  fontFamily: "var(--font-body)",
                }}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
