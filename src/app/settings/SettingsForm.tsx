"use client";

import * as React from "react";
import {
  Camera,
  User as UserIcon,
  Cake,
  Globe2,
  Sparkles,
  Moon,
  Check,
} from "lucide-react";
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

const GENDERS = ["Dona", "Home", "No binari", "Prefereixo no dir-ho", "Altre"];

/** Gestiona el tema (clar/fosc) sincronitzat amb localStorage i <html data-theme>. */
function useTheme(): [boolean, () => void] {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("pl-theme");
    } catch {
      /* noop */
    }
    setDark(stored === "dark");
  }, []);

  const toggle = React.useCallback(() => {
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem("pl-theme", next ? "dark" : "light");
      } catch {
        /* noop */
      }
      document.documentElement.setAttribute(
        "data-theme",
        next ? "dark" : "light",
      );
      return next;
    });
  }, []);

  return [dark, toggle];
}

export function SettingsForm({ userId, initialData }: SettingsFormProps) {
  const { update } = useSession();
  const [dark, toggleTheme] = useTheme();

  const [lang, setLang] = React.useState<"ca" | "es" | "en">("ca");
  React.useEffect(() => {
    try {
      const l = localStorage.getItem("pl-lang");
      if (l === "es" || l === "en") setLang(l);
    } catch {
      /* noop */
    }
  }, []);
  function changeLang(next: "ca" | "es" | "en") {
    if (next === lang) return;
    try {
      localStorage.setItem("pl-lang", next);
    } catch {
      /* noop */
    }
    window.location.reload();
  }

  const [nickname, setNickname] = React.useState(initialData.nickname || "");
  const [age, setAge] = React.useState(initialData.age?.toString() || "");
  const [gender, setGender] = React.useState(initialData.gender || "");
  const [nationality, setNationality] = React.useState(
    initialData.nationality || "",
  );
  const [hobbies, setHobbies] = React.useState(initialData.hobbies || "");
  const [avatar, setAvatar] = React.useState(initialData.image || "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [avatarOk, setAvatarOk] = React.useState(true);

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
    window.setTimeout(() => setSuccess(false), 3200);
  }

  // ---- estils ----
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "7px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "52px",
    padding: "0 16px 0 44px",
    background: "var(--surface-2)",
    border: "1.5px solid var(--border)",
    borderRadius: "14px",
    fontSize: "15px",
    color: "var(--text)",
    outline: "none",
    transition: "border-color 180ms var(--ease), box-shadow 180ms var(--ease)",
  };

  const iconWrapStyle: React.CSSProperties = {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-faint)",
    display: "flex",
    pointerEvents: "none",
  };

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--green)";
    e.currentTarget.style.boxShadow = "0 0 0 4px var(--green-subtle)";
  };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow = "none";
  };

  const showAvatar = avatar.trim() !== "" && avatarOk;

  return (
    <div
      style={{
        margin: "16px",
        background: "var(--surface)",
        borderRadius: "24px",
        boxShadow: "var(--shadow-lg)",
        padding: "0 22px 96px",
        position: "relative",
        border: "1px solid var(--border)",
        transition: "background 240ms var(--ease)",
      }}
    >
      {/* ---- Avatar destacat (sobresurt damunt la capçalera) ---- */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            marginTop: "-30px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            padding: "3.5px",
            background: "linear-gradient(135deg, #0D9E7A 0%, #1a6b9a 100%)",
            boxShadow: "0 10px 30px rgba(13,158,122,0.32)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3.5px solid var(--surface)",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Avatar"
                referrerPolicy="no-referrer"
                onError={() => setAvatarOk(false)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <UserIcon size={42} color="var(--text-faint)" />
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "10px", marginBottom: "22px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "19px",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}
        >
          {nickname.trim() ? `@${nickname.trim()}` : "El teu perfil"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Personalitza la teva experiència PlAIner
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {/* Nickname */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Nickname</label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <UserIcon size={17} />
            </span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="travelwithjoana"
              required
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Edat */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Edat</label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <Cake size={17} />
            </span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              min={1}
              max={120}
              required
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Gènere */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Gènere</label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <Sparkles size={17} />
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
                color: gender ? "var(--text)" : "var(--text-faint)",
              }}
              onFocus={focus}
              onBlur={blur}
            >
              <option value="">Selecciona…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g} style={{ color: "#000" }}>
                  {g}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-faint)",
                pointerEvents: "none",
                fontSize: "11px",
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Nacionalitat */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Nacionalitat</label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <Globe2 size={17} />
            </span>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Catalana"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Hobbies */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Hobbies</label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <Sparkles size={17} />
            </span>
            <input
              type="text"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              placeholder="Senderisme, menjar local, museus"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Avatar URL */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>
            Avatar (URL){" "}
            <span style={{ textTransform: "none", opacity: 0.7, fontWeight: 500 }}>
              · Opcional
            </span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={iconWrapStyle}>
              <Camera size={17} />
            </span>
            <input
              type="url"
              value={avatar}
              onChange={(e) => {
                setAvatar(e.target.value);
                setAvatarOk(true);
              }}
              placeholder="https://..."
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* ---- Preferències ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "4px 0 14px",
          }}
        >
          <div style={{ height: "1px", flex: 1, background: "var(--border-md)" }} />
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            Preferències
          </span>
          <div style={{ height: "1px", flex: 1, background: "var(--border-md)" }} />
        </div>

        {/* Toggle mode fosc */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            background: "var(--surface-2)",
            border: "1.5px solid var(--border)",
            borderRadius: "14px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "var(--green-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--green)",
              flexShrink: 0,
            }}
          >
            <Moon size={17} />
          </span>
          <span style={{ flex: 1, textAlign: "left" }}>
            <span
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              Mode fosc
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {dark ? "Activat" : "Desactivat"}
            </span>
          </span>
          {/* Switch */}
          <span
            style={{
              width: "46px",
              height: "27px",
              borderRadius: "9999px",
              background: dark ? "var(--green)" : "var(--surface-3)",
              padding: "3px",
              display: "flex",
              transition: "background 200ms var(--ease)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "21px",
                height: "21px",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transform: dark ? "translateX(19px)" : "translateX(0)",
                transition: "transform 200ms var(--ease)",
              }}
            />
          </span>
        </button>

        {/* Selector d'idioma */}
        <div
          style={{
            padding: "12px 14px",
            background: "var(--surface-2)",
            border: "1.5px solid var(--border)",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "var(--green-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--green)",
                flexShrink: 0,
              }}
            >
              <Globe2 size={17} />
            </span>
            <span style={{ flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Idioma
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Tria l&apos;idioma de l&apos;aplicació
              </span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(
              [
                { id: "ca", label: "Català" },
                { id: "es", label: "Español" },
                { id: "en", label: "English" },
              ] as const
            ).map((o) => {
              const on = lang === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => changeLang(o.id)}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "11px",
                    border: `1.5px solid ${on ? "var(--green)" : "var(--border-md)"}`,
                    background: on ? "var(--green-subtle)" : "var(--surface)",
                    color: on ? "var(--green)" : "var(--text-muted)",
                    fontWeight: on ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 160ms var(--ease)",
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "var(--coral-subtle)",
              border: "1px solid rgba(240,90,53,0.32)",
              color: "var(--coral)",
              padding: "11px 13px",
              borderRadius: "12px",
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--green-subtle)",
              border: "1px solid var(--green-glow)",
              color: "var(--green-deep)",
              padding: "11px 13px",
              borderRadius: "12px",
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Check size={16} /> Ajustaments guardats correctament.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pl-tap"
          style={{
            width: "100%",
            height: "54px",
            borderRadius: "9999px",
            border: "none",
            background: "linear-gradient(135deg, var(--green) 0%, var(--green-hover) 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
            boxShadow: "var(--shadow-cta)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.75 : 1,
            transition: "opacity 180ms var(--ease)",
          }}
        >
          {loading ? "Guardant…" : "Guardar ajustaments"}
        </button>
      </form>
    </div>
  );
}
