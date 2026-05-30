"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, User } from "lucide-react";

function OnboardingInner() {
  const searchParams = useSearchParams();
  const { update, data: session } = useSession();
  // New OAuth users reach onboarding without the ?user= param — fall back to
  // the current session id so the gate works for every sign-up path.
  const userId = searchParams.get("user") || session?.user?.id || "";

  const [nickname, setNickname] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [nationality, setNationality] = React.useState("");
  const [hobbies, setHobbies] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
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

    // Upload avatar file if selected
    let avatarUrl = "";
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json() as { url?: string };
          avatarUrl = uploadData.url ?? "";
        } else {
          setError("No hem pogut pujar la imatge.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Error de xarxa al pujar la imatge.");
        setLoading(false);
        return;
      }
    }

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
        avatar: avatarUrl,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "No hem pogut guardar el teu onboarding.");
      return;
    }

    setSuccess(true);
    await update({ onboarded: true, nickname, image: avatarUrl });
    setTimeout(() => {
      window.location.href = "/plan";
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
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          height: "32vh",
          minHeight: "200px",
          flexShrink: 0,
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
            <label style={labelStyle}>
              Foto de perfil{" "}
              <span style={{ textTransform: "none", opacity: 0.7 }}>(Opcional)</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: "var(--surface-2)", border: "1.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
              }}>
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <User size={24} style={{ color: "var(--text-faint)" }} />
                }
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 1 }}
                />
                <button type="button" style={{
                  width: "100%", height: "40px",
                  background: "var(--surface-2)", border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-md)", fontSize: "14px", color: "var(--text)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", cursor: "pointer",
                }}>
                  <Camera size={16} />
                  {avatarFile ? "Canviar foto" : "Pujar foto"}
                </button>
              </div>
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

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <OnboardingInner />
    </React.Suspense>
  );
}
