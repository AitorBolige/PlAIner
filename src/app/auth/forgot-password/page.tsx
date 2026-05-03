"use client";

import * as React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [devLink, setDevLink] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => null);

    setLoading(false);
    setDevLink(data?.resetUrl ?? null);
    setSent(true);
  }

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
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
            PL<span style={{ color: "rgba(255,255,255,0.55)" }}>AI</span>ner
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Recupera l&apos;accés.
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
        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
              Comprova el teu email
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.5 }}>
              Si l&apos;email existeix, rebràs un link per restablir la contrasenya en breu.
            </p>
            {devLink && (
              <div style={{ margin: "0 auto 18px", maxWidth: 380, textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                <div className="micro" style={{ marginBottom: 8 }}>
                  DEV LINK (Resend testing)
                </div>
                <a href={devLink} style={{ color: "var(--green)", fontWeight: 700, wordBreak: "break-all", textDecoration: "none" }}>
                  {devLink}
                </a>
              </div>
            )}
            <Link
              href="/auth/login"
              style={{ fontSize: "14px", fontWeight: 600, color: "var(--green)", textDecoration: "none" }}
            >
              ← Tornar al login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              He oblidat la contrasenya
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Introdueix el teu email i t&apos;enviarem un link per crear una nova contrasenya.
            </p>

            <form onSubmit={onSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joana@plainer.app"
                    autoComplete="email"
                    required
                    style={{ width: "100%", height: "50px", paddingLeft: "40px", paddingRight: "14px", background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", fontSize: "15px", color: "var(--text)", outline: "none", transition: "var(--t)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", height: "52px", background: "var(--green)", color: "#fff", border: "none", borderRadius: "var(--r-pill)", fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.01em", boxShadow: "var(--shadow-cta)", transition: "var(--t)", cursor: "pointer", marginBottom: "20px", opacity: loading ? 0.8 : 1 }}
              >
                {loading ? "Enviant…" : "Enviar link de reset"}
              </button>

              <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                <Link href="/auth/login" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
                  ← Tornar al login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
