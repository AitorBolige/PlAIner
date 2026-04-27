"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Apple } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/onboarding",
    });

    setLoading(false);

    if (!res?.ok) {
      setError("Email o contrasenya incorrectes.");
      return;
    }

    window.location.href = res.url ?? "/onboarding";
  }

  return (
    <PageWrapper className="py-6 md:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_18px_60px_rgba(18,24,24,0.10)]">
          <div className="relative h-56 w-full">
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(47,125,179,0.20),transparent_55%),radial-gradient(900px_circle_at_80%_40%,rgba(10,163,127,0.24),transparent_55%),linear-gradient(to_bottom,rgba(20,24,24,0.15),rgba(20,24,24,0.35))]" />
            <div className="absolute inset-0 opacity-[0.10] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2290%22%20height%3D%2290%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%2290%22%20height%3D%2290%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.35%22/%3E%3C/svg%3E')]" />
            <div className="absolute left-4 top-4 text-sm font-semibold text-white/90">
              PLAIner
            </div>
          </div>

          <div className="p-6">
            <h1 className="font-display text-3xl font-extrabold tracking-wide">
              Benvingut de nou
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              El teu pròxim viatge t’està esperant.
            </p>

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <Input
                label="Correu electrònic"
                type="email"
                value={email}
                placeholder="nom@exemple.com"
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Input
                label="Contrasenya"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between">
                <a
                  href="#"
                  className="text-sm font-medium text-[color:var(--color-primary)] hover:underline"
                >
                  He oblidat la contrasenya
                </a>
              </div>

              {error ? (
                <p className="text-sm text-[color:rgba(255,94,86,0.95)]">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" size="lg" isLoading={loading}>
                Iniciar sessió
              </Button>

              <div className="mt-3 grid gap-3">
                <Button
                  className="w-full"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                >
                  Continua amb Google
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => {}}
                >
                  <Apple className="h-4 w-4" aria-hidden="true" />
                  Continua amb Apple
                </Button>
              </div>
            </form>

            <p className="mt-6 text-sm text-[color:var(--color-text-muted)]">
              No tens compte?{" "}
              <Link
                className="font-semibold text-[color:var(--color-primary)] hover:underline"
                href="/auth/register"
              >
                Crear-la →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

