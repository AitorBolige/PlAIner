"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageWrapper } from "@/components/layout/PageWrapper";

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const score = passwordScore(password);
  const pct = (score / 4) * 100;
  const label =
    score <= 1 ? "Feble" : score === 2 ? "Correcta" : score === 3 ? "Bona" : "Forta";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setLoading(false);
      setError(data?.error ?? "No s’ha pogut crear el compte.");
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/onboarding",
    });

    setLoading(false);

    if (!signInRes?.ok) {
      setError("Compte creat, però no s’ha pogut iniciar sessió.");
      return;
    }

    window.location.href = signInRes.url ?? "/onboarding";
  }

  return (
    <PageWrapper className="py-10">
      <div className="grid min-h-[calc(100dvh-10rem)] grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--color-border)] md:grid-cols-2">
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_20%,rgba(74,144,184,0.18),transparent_55%),radial-gradient(900px_circle_at_70%_40%,rgba(232,160,74,0.20),transparent_50%),linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.7))]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2280%22%20height%3D%2280%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.35%22/%3E%3C/svg%3E')]" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="font-display text-2xl font-extrabold tracking-wide">
              “Un viatge tancat. Un cost clar. Zero sorpreses.”
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Entra el teu moment vital i deixa que la IA decideixi.
            </p>
          </div>
        </div>

        <div className="bg-[color:rgba(20,22,24,0.6)] p-6 md:p-10">
          <Card className="mx-auto w-full max-w-md p-6 md:p-8">
            <h1 className="font-display text-3xl font-extrabold tracking-wide">
              Crea el teu compte
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              En menys d’un minut, tindràs el teu primer viatge.
            </p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <Input
                label="Nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div>
                <Input
                  label="Contrasenya"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
                    <span>Força</span>
                    <span className="text-[color:var(--color-text)]">{label}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[color:var(--color-primary)] transition-all duration-300 ease-[var(--ease-out-premium)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <p className="text-sm text-[color:rgba(255,150,150,0.95)]">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" size="lg" isLoading={loading}>
                Crear compte
              </Button>

              <Button
                className="w-full"
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              >
                Continua amb Google
              </Button>
            </form>

            <p className="mt-6 text-sm text-[color:var(--color-text-muted)]">
              Ja tens compte?{" "}
              <Link
                className="text-[color:var(--color-text)] underline decoration-white/20 underline-offset-4 hover:decoration-white/50"
                href="/auth/login"
              >
                Inicia sessió
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

