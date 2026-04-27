"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.86 32.658 29.333 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.956 3.044l5.657-5.657C34.995 6.053 29.734 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.956 3.044l5.657-5.657C34.995 6.053 29.734 4 24 4c-7.682 0-14.365 4.328-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.221 0 10.101-1.996 13.743-5.238l-6.349-5.372C29.33 35.077 26.805 36 24 36c-5.312 0-9.828-3.315-11.287-7.946l-6.522 5.025C9.474 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.698 1.966-1.99 3.634-3.709 4.762l6.349 5.372C36.715 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="white">
      <path d="M16.365 1.43c0 1.14-.41 2.2-1.23 3.18-.98 1.14-2.58 2.02-3.96 1.91-.17-1.16.35-2.3 1.25-3.31.94-1.04 2.57-1.82 3.94-1.78Z" />
      <path d="M20.31 17.17c-.46 1.05-.68 1.52-1.27 2.45-.82 1.27-1.98 2.85-3.42 2.86-1.28.01-1.61-.84-3.35-.83-1.74.01-2.1.85-3.38.84-1.44-.02-2.54-1.44-3.36-2.71-2.3-3.55-2.54-7.71-1.12-9.89 1-1.53 2.58-2.43 4.07-2.43 1.52 0 2.47.84 3.72.84 1.22 0 1.96-.85 3.7-.85 1.33 0 2.74.72 3.74 1.97-3.28 1.8-2.75 6.51.67 7.75Z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);

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
    <div>
      {/* HERO SUPERIOR */}
      <div
        style={{
          height: "42vh",
          minHeight: "280px",
          background:
            "linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 60%, #2D3561 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 32px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 24px 28px",
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-40px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              left: "-60px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "30%",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            PL<span style={{ color: "rgba(255,255,255,0.55)" }}>AI</span>ner
          </span>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.55)",
              marginTop: "2px",
              letterSpacing: "0.01em",
            }}
          >
            planifica sense fricció
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "6px",
            }}
          >
            El món t&apos;espera.
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.60)",
              lineHeight: 1.4,
            }}
          >
            El teu pròxim viatge, a 3 minuts.
          </p>
        </div>
      </div>

      {/* FORM CARD overlapping */}
      <div
        style={{
          margin: "-20px 16px 0",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 24px 24px",
          position: "relative",
          zIndex: 10,
          border: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          Benvingut de nou
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
          El teu pròxim viatge t&apos;està esperant.
        </p>

        <form onSubmit={onSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Correu electrònic
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                autoComplete="email"
                required
                style={{
                  width: "100%",
                  height: "50px",
                  paddingLeft: "40px",
                  paddingRight: "14px",
                  background: "var(--surface-2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  fontSize: "15px",
                  color: "var(--text)",
                  outline: "none",
                  transition: "var(--t)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "8px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Contrasenya
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
              />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  height: "50px",
                  paddingLeft: "40px",
                  paddingRight: "44px",
                  background: "var(--surface-2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  fontSize: "15px",
                  color: "var(--text)",
                  outline: "none",
                  transition: "var(--t)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-faint)",
                  padding: "4px",
                }}
                aria-label={showPass ? "Amagar contrasenya" : "Mostrar contrasenya"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <a
              href="/auth/forgot-password"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--green)",
                textDecoration: "none",
              }}
            >
              He oblidat la contrasenya
            </a>
          </div>

          {error ? (
            <p style={{ fontSize: "13px", color: "rgba(240,90,53,0.95)", marginBottom: 10 }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              background: "var(--green)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-pill)",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              boxShadow: "var(--shadow-cta)",
              transition: "var(--t)",
              cursor: "pointer",
              marginBottom: "16px",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Carregant…" : "Iniciar sessió"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
              o continua amb
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              style={{
                width: "100%",
                height: "48px",
                background: "var(--surface)",
                color: "var(--text)",
                border: "1.5px solid var(--border-md)",
                borderRadius: "var(--r-pill)",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "var(--t)",
                cursor: "pointer",
              }}
            >
              <GoogleIcon />
              Continua amb Google
            </button>

            <button
              type="button"
              onClick={() => {}}
              style={{
                width: "100%",
                height: "48px",
                background: "var(--text)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-pill)",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "var(--t)",
                cursor: "pointer",
              }}
            >
              <AppleIcon />
              Continua amb Apple
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
            No tens compte?{" "}
            <Link
              href="/auth/register"
              style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}
            >
              Crear-la →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

