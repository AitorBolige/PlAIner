"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n-client";

interface Props {
  tripId: string;
  destination: string;
  isOwn?: boolean;
  initialLocale?: import("@/lib/i18n").Locale;
}

export function AddToMyTripsButton(props: Props) {
  const { tripId, isOwn = false, initialLocale } = props;
  const router = useRouter();
  const { t } = useLocale(initialLocale);
  const [state, setState] = React.useState<"idle" | "loading" | "done">("idle");

  async function handleAdd() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/recommendations/${tripId}/clone`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        setState("done");
        setTimeout(() => router.push(`/trips/${data.id}`), 800);
      } else {
        setState("idle");
        alert(data?.error ?? "No s'ha pogut afegir el viatge.");
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <div
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] px-4 pb-4 pt-2"
      style={{
        background: "linear-gradient(to top, var(--bg) 70%, transparent)",
      }}
    >
      {isOwn ? (
        <div
          className="flex w-full items-center justify-center gap-2.5 rounded-[var(--r-xl)] py-4 text-[15px] font-bold"
          style={{
            background: "var(--green-subtle)",
            border: "1.5px solid rgba(13,158,122,0.3)",
            color: "var(--green)",
          }}
        >
          <Lock size={16} />
          {t.alreadyMyTrip}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={state === "loading" || state === "done"}
          className="flex w-full items-center justify-center gap-2.5 rounded-[var(--r-xl)] py-4 text-[15px] font-bold text-white transition-all disabled:opacity-80"
          style={{
            background:
              state === "done"
                ? "var(--green)"
                : "linear-gradient(135deg, #0D9E7A 0%, #1a6b9a 100%)",
            boxShadow: "0 4px 20px rgba(13,158,122,0.4)",
          }}
        >
          {state === "done" ? (
            <>
              <CheckCircle2 size={18} />
              {t.addToMyTrips}
            </>
          ) : state === "loading" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t.addingToTrips}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {t.addToMyTrips}
            </>
          )}
        </button>
      )}
    </div>
  );
}
