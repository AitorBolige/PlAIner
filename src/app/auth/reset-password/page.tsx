"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les contrasenyes no coincideixen.");
      return;
    }
    if (password.length < 8) {
      setError("La contrasenya ha de tenir mínim 8 caràcters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en restablir la contrasenya.");
      return;
    }

    setDone(true);
  }

  const inputStyle: React.CSSProperties = {
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
    boxSizing: "border-box",
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
          Contrasenya actualitzada
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
          Ja pots iniciar sessió amb la teva nova contrasenya.
        </p>
        <Link
          href="/auth/login"
          style={{ display: "inline-block", padding: "14px 32px", background: "var(--green)", color: "#fff", borderRadius: "var(--r-pill)", fontWeight: 700, textDecoration: "none", fontSize: "15px" }}
        >
          Anar al login →
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <p style={{ fontSize: "14px", color: "rgba(240,90,53,0.95)", marginBottom: "16px" }}>
          L&apos;enllaç no és vàlid.
        </p>
        <Link href="/auth/forgot-password" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none", fontSize: "14px" }}>
          Sol·licitar un nou link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "6px" }}>
        Crea una nova contrasenya
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
        Ha de tenir mínim 8 caràcters.
      </p>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Nova contrasenya
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínim 8 caràcters"
              autoComplete="new-password"
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button type="button" onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", padding: "4px" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            Confirmar contrasenya
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeteix la contrasenya"
              autoComplete="new-password"
              required
              style={{ ...inputStyle, paddingRight: "14px" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "rgba(240,90,53,0.95)", marginBottom: 12 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", height: "52px", background: "var(--green)", color: "#fff", border: "none", borderRadius: "var(--r-pill)", fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.01em", boxShadow: "var(--shadow-cta)", transition: "var(--t)", cursor: "pointer", opacity: loading ? 0.8 : 1 }}
        >
          {loading ? "Guardant…" : "Guardar nova contrasenya"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div>
      <div
        style={{
          height: "32vh",
          minHeight: "200px",
          background: "linear-gradient(160deg, #0D9E7A 0%, #1a6b9a 60%, #2D3561 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 32px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 24px 28px",
        }}
      >
        <div style={{ position: "relative" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
            PL<span style={{ color: "rgba(255,255,255,0.55)" }}>AI</span>ner
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Nova contrasenya.
          </h1>
        </div>
      </div>

      <div
        style={{
          margin: "-20px 16px 32px",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 24px 24px",
          position: "relative",
          zIndex: 10,
          border: "1px solid var(--border)",
        }}
      >
        <React.Suspense fallback={<p style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregant…</p>}>
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </div>
  );
}
