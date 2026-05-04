"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);

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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error en crear el compte.");
      return;
    }

    // Redirect to login with success message
    window.location.href = "/auth/login?registered=1";
  }

  const inputStyle: React.CSSProperties = {
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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "6px",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-faint)",
  };

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
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "-60px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div style={{ position: "relative" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
            PL<span style={{ color: "rgba(255,255,255,0.55)" }}>AI</span>ner
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "4px" }}>
            Crea el teu compte.
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.60)" }}>
            El teu primer viatge t&apos;espera.
          </p>
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
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
          Registra&apos;t
        </h2>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nom</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={iconStyle} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Joana García"
                autoComplete="name"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={iconStyle} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joana@plainer.app"
                autoComplete="email"
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Contrasenya</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínim 8 caràcters"
                autoComplete="new-password"
                required
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", padding: "4px" }}
                aria-label={showPass ? "Amagar contrasenya" : "Mostrar contrasenya"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Confirmar contrasenya</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={iconStyle} />
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeteix la contrasenya"
                autoComplete="new-password"
                required
                style={inputStyle}
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
            style={{ width: "100%", height: "52px", background: "var(--green)", color: "#fff", border: "none", borderRadius: "var(--r-pill)", fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.01em", boxShadow: "var(--shadow-cta)", transition: "var(--t)", cursor: "pointer", marginBottom: "20px", opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Creant compte…" : "Crear compte"}
          </button>

          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
            Ja tens compte?{" "}
            <Link href="/auth/login" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
              Inicia sessió →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
