"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-5 overflow-hidden border-x border-border bg-bg px-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-white"
          style={{
            background: "linear-gradient(155deg, #f05a35 0%, #c8860a 100%)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <AlertTriangle size={34} />
        </div>
        <div>
          <h1 className="display text-2xl font-extrabold tracking-[-0.02em] text-text">
            Alguna cosa ha fallat
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hi ha hagut un error inesperat. Torna-ho a provar.
          </p>
        </div>

        {isDev ? (
          <pre className="max-h-40 w-full overflow-auto rounded-[var(--r-md)] bg-[color:var(--surface-2)] p-3 text-left text-[11px] text-muted">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        ) : null}

        <button
          type="button"
          onClick={() => reset()}
          className="pl-tap inline-flex h-12 items-center justify-center rounded-full px-7 font-display text-sm font-bold text-white"
          style={{ background: "var(--green)", boxShadow: "var(--shadow-cta)" }}
        >
          Tornar-ho a provar
        </button>
      </div>
    </div>
  );
}
