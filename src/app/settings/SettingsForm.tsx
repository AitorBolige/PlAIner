"use client";

import * as React from "react";
import { Camera, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

interface SettingsFormProps {
  userId: string;
  initialData: {
    nickname?: string | null;
    age?: number | null;
    gender?: string | null;
    nationality?: string | null;
    hobbies?: string | null;
    image?: string | null;
  };
}

export function SettingsForm({ userId, initialData }: SettingsFormProps) {
  const { update } = useSession();

  const [nickname, setNickname] = React.useState(initialData.nickname || "");
  const [age, setAge] = React.useState(initialData.age?.toString() || "");
  const [gender, setGender] = React.useState(initialData.gender || "");
  const [nationality, setNationality] = React.useState(initialData.nationality || "");
  const [hobbies, setHobbies] = React.useState(initialData.hobbies || "");
  const [avatar, setAvatar] = React.useState(initialData.image || "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
      setError(data.error ?? "No hem pogut guardar els ajustaments.");
      return;
    }

    setSuccess(true);
    await update({ nickname, image: avatar });
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
        margin: "16px",
        background: "var(--surface)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-lg)",
        padding: "28px 24px 24px",
        position: "relative",
        border: "1px solid var(--border)",
        paddingBottom: "80px", // space for bottom nav
      }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Nickname</label>
          <div style={{ position: "relative" }}>
            <UserIcon
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
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>
            Avatar (URL){" "}
            <span style={{ textTransform: "none", opacity: 0.7 }}>(Opcional)</span>
          </label>
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
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
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
            Ajustaments guardats correctament.
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
          {loading ? "Guardant..." : "Guardar ajustaments"}
        </button>
      </form>
    </div>
  );
}
