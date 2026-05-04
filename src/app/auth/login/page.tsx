"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.86 32.658 29.333 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.956 3.044l5.657-5.657C34.995 6.053 29.734 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.956 3.044l5.657-5.657C34.995 6.053 29.734 4 24 4c-7.682 0-14.365 4.328-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.221 0 10.101-1.996 13.743-5.238l-6.349-5.372C29.33 35.077 26.805 36 24 36c-5.312 0-9.828-3.315-11.287-7.946l-6.522 5.025C9.474 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.698 1.966-1.99 3.634-3.709 4.762l6.349 5.372C36.715 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function Field({ icon, right, focus, children }: { icon: React.ReactNode; right?: React.ReactNode; focus: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: 50, padding: '0 14px',
      background: focus ? '#fff' : 'var(--surface-2)',
      border: `1.5px solid ${focus ? 'var(--green)' : 'transparent'}`,
      boxShadow: focus ? '0 0 0 4px var(--green-subtle)' : 'none',
      borderRadius: 14,
      transition: 'all 200ms var(--ease)',
    }}>
      <span style={{ color: focus ? 'var(--green)' : 'var(--text-faint)', display: 'flex' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {right}
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const { status } = useSession();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [emailFocus, setEmailFocus] = React.useState(false);
  const [passFocus, setPassFocus] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/plainer-mvp.html");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/plainer-mvp.html" });
    setLoading(false);
    if (!res?.ok) { setError("Email o contrasenya incorrectes."); return; }
    window.location.href = res.url ?? "/plainer-mvp.html";
  }

  return (
    <div className="pl-fadein" style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Hero */}
      <div style={{
        height: '46%',
        background: 'linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 60%, #2D3561 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="pl-float-1" style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div className="pl-float-2" style={{ position: 'absolute', bottom: -30, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div className="pl-float-3" style={{ position: 'absolute', top: '40%', left: '30%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 24px 32px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              PL<span style={{ color: 'rgba(255,255,255,0.55)' }}>AI</span>ner
            </span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, letterSpacing: '0.01em' }}>
              planifica sense fricció
            </p>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>
              El món t&apos;espera.
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)', lineHeight: 1.4 }}>
              El teu pròxim viatge, a 3 minuts.
            </p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        position: 'absolute',
        top: 'calc(46% - 24px)',
        left: 0, right: 0, bottom: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: '0 -4px 32px rgba(0,0,0,0.10)',
        overflowY: 'auto',
        padding: '28px 24px 40px',
        zIndex: 10,
      }}>
        {registered && (
          <div style={{ marginBottom: 18, padding: '12px 16px', background: 'var(--green-subtle)', border: '1px solid var(--green-glow)', borderRadius: 12, fontSize: 13.5, color: 'var(--green-deep)', fontWeight: 500 }}>
            ✓ Compte creat correctament. Inicia sessió per continuar.
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Benvingut de nou
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          El teu pròxim viatge t&apos;està esperant.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <Field icon={<Mail size={16} />} focus={emailFocus}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joana@plainer.app"
                autoComplete="email"
                required
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
              />
            </Field>
          </div>

          <div style={{ marginBottom: 8 }}>
            <Field
              icon={<Lock size={16} />}
              focus={passFocus}
              right={
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', padding: 4, display: 'flex', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            >
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
              />
            </Field>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link href="/auth/forgot-password" style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)', textDecoration: 'none' }}>
              He oblidat la contrasenya
            </Link>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'rgba(240,90,53,0.95)', marginBottom: 10 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pl-tap"
            style={{ width: '100%', height: 52, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', boxShadow: 'var(--shadow-cta)', cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Carregant…" : "Iniciar sessió"}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>o continua amb</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/plainer-mvp.html" })}
              className="pl-tap"
              style={{ width: '100%', height: 48, background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border-md)', borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}
            >
              <GoogleIcon />
              Continua amb Google
            </button>
            <button
              type="button"
              onClick={() => signIn("facebook", { callbackUrl: "/plainer-mvp.html" })}
              className="pl-tap"
              style={{ width: '100%', height: 48, background: '#1877F2', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}
            >
              <FacebookIcon />
              Continua amb Facebook
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            No tens compte?{" "}
            <Link href="/auth/register" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
              Crear-la →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginPageInner />
    </React.Suspense>
  );
}
