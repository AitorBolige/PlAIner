import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-5 overflow-hidden border-x border-border bg-bg px-8 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-white"
          style={{
            background: "linear-gradient(155deg, #0D9E7A 0%, #1a6b9a 70%, #2D3561 100%)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Compass size={36} />
        </div>
        <div>
          <h1 className="display text-2xl font-extrabold tracking-[-0.02em] text-text">
            Aquí no hi ha res
          </h1>
          <p className="mt-2 text-sm text-muted">
            La pàgina que busques no existeix o s&apos;ha mogut.
          </p>
        </div>
        <Link
          href="/plan"
          className="pl-tap inline-flex h-12 items-center justify-center rounded-full px-7 font-display text-sm font-bold text-white"
          style={{ background: "var(--green)", boxShadow: "var(--shadow-cta)" }}
        >
          Tornar a l&apos;inici
        </Link>
      </div>
    </div>
  );
}
