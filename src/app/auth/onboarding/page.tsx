"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, User } from "lucide-react";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const { update } = useSession();
  const userId = searchParams.get("user") ?? "";

  const [nickname, setNickname] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [nationality, setNationality] = React.useState("");
  const [hobbies, setHobbies] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Falta l'usuari. Torna a registrar-te.");
      return;
    }

    if (!nickname.trim()) {
      setError("El nickname és obligatori.");
      return;
    }

    const ageNumber = Number(age);
    if (!Number.isFinite(ageNumber) || ageNumber <= 0) {
      setError("Introdueix una edat vàlida.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        nickname,
        age: ageNumber,
        gender,
        nationality,
        hobbies,
        avatar,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No hem pogut guardar el teu onboarding.");
      return;
    }

    setSuccess(true);
    await update({ onboarded: true, nickname, image: avatar });
    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "50px",
    paddingLeft: "16px",
    paddingRight: "16px",
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

  return (
    <div>
      <div
        style={{
          height: "32vh",
          minHeight: "200px",
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
        </div>

        <div style={{ position: "relative" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "4px",
            }}
          >
            Onboarding
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.60)" }}>
            Personalitza el teu perfil en un minut.
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "20px",
          }}
        >
          Perfil inicial
        </h2>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nickname</label>
            <div style={{ position: "relative" }}>
              <User
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
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="travelwithjoana"
                required
                style={{ ...inputStyle, paddingLeft: "40px" }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--green)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Edat</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              min={1}
              max={120}
              required
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--green)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Gènere</label>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Dona, Home, No binari..."
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--green)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nacionalitat</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Catalana"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--green)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Hobbies</label>
            <input
              type="text"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              placeholder="Senderisme, menjar local, museus"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--green)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Avatar (URL) <span style={{ textTransform: "none", opacity: 0.7 }}>(Opcional)</span></label>
            <div style={{ position: "relative" }}>
              <Camera
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
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                style={{ ...inputStyle, paddingLeft: "40px" }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--green)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(255, 90, 90, 0.12)",
                border: "1px solid rgba(255, 90, 90, 0.3)",
                color: "#a94442",
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                marginBottom: "12px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "rgba(57, 205, 98, 0.12)",
                border: "1px solid rgba(57, 205, 98, 0.3)",
                color: "#1a7f37",
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                marginBottom: "12px",
                fontSize: "13px",
              }}
            >
              Onboarding guardat. Redirigint...
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--green)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Guardant..." : "Guardar onboarding"}
          </button>
        </form>
      </div>
    </div>
  );
}
