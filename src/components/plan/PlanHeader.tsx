"use client";

import * as React from "react";
import { LogOut, RefreshCw } from "lucide-react";

interface SessionUser {
  name: string;
  image: string | null;
}

async function signOutTo(target: string) {
  try {
    const csrf = await fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => d.csrfToken || "");
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: csrf }),
    });
  } catch {
    /* ignore */
  }
  window.location.replace(target);
}

export function PlanHeader() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.user) return;
        setUser({
          name: data.user.nickname || data.user.name || data.user.email || "",
          image: data.user.image || null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="px-5 pt-14">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-[13px] text-muted">
            Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </p>
          <h1 className="display mt-1 text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-text">
            On anem?
          </h1>
          <p className="mb-5 mt-2 max-w-[280px] text-sm text-muted">
            Configura el teu viatge i deixa que la IA faci la resta.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="El meu compte"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-[color:var(--green-subtle)] font-display text-[15px] font-bold text-[color:var(--green-deep)]"
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>

          {open ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-2xl border border-border bg-surface p-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                {user?.name ? (
                  <div className="truncate px-3 pb-1.5 pt-1 text-[13px] font-semibold text-muted">
                    {user.name}
                  </div>
                ) : null}
                <div className="my-1.5 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => signOutTo("/auth/login")}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm font-medium text-text transition hover:bg-bg"
                >
                  <RefreshCw size={15} /> Canviar de compte
                </button>
                <button
                  type="button"
                  onClick={() => signOutTo("/auth/login")}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm font-bold transition"
                  style={{ color: "#DC2626", background: "rgba(239,68,68,0.07)" }}
                >
                  <LogOut size={15} /> Tancar sessió
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
