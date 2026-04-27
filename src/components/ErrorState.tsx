"use client";

import * as React from "react";

export function ErrorState({
  code,
  message,
  onRetry,
  onGoHome,
}: {
  code?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  const isAuth =
    code === "UNAUTHORIZED" || message?.toLowerCase().includes("unauthorized");

  React.useEffect(() => {
    if (!isAuth) return;
    window.location.href =
      "/auth/login?redirect=" + encodeURIComponent(window.location.pathname);
  }, [isAuth]);

  if (isAuth) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(240,90,53,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E85D3A"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "8px",
        }}
      >
        Alguna cosa ha fallat
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          maxWidth: "280px",
          lineHeight: 1.5,
          marginBottom: "28px",
        }}
      >
        {message || "No hem pogut completar l'acció. Prova-ho de nou."}
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        {onRetry ? (
          <button
            onClick={onRetry}
            style={{
              height: "44px",
              padding: "0 20px",
              background: "var(--green)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-pill)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-cta)",
            }}
          >
            Tornar a provar
          </button>
        ) : null}
        <button
          onClick={onGoHome || (() => (window.location.href = "/search"))}
          style={{
            height: "44px",
            padding: "0 20px",
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border-md)",
            borderRadius: "var(--r-pill)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tornar al cercador
        </button>
      </div>
    </div>
  );
}

