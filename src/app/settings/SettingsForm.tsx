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

/** Theme (light/dark) synced to localStorage + <html data-theme>. */
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

const labelCls =
  "mb-[7px] block text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--text-muted)]";

const inputCls =
  "h-[52px] w-full rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] py-0 pl-11 pr-4 text-[15px] text-[color:var(--text)] outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-[color:var(--green)] focus:shadow-[0_0_0_4px_var(--green-subtle)]";

const iconWrapCls =
  "pointer-events-none absolute left-[15px] top-1/2 flex -translate-y-1/2 text-[color:var(--text-faint)]";

type FieldProps = {
  id: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactElement;
  className?: string;
};

function Field({ id, label, icon, children, className }: FieldProps) {
  return (
    <div className={className ?? "mb-4"}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <span className={iconWrapCls}>{icon}</span>
        {React.cloneElement(children, { id })}
      </div>
    </div>
  );
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
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
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

    let avatarUrl = avatar;
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            avatarUrl = uploadData.url;
          }
        } else {
          setError("No hem pogut pujar la foto de perfil.");
          setLoading(false);
          return;
        }
      } catch (err) {
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
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No hem pogut guardar els ajustaments.");
      return;
    }

    setSuccess(true);
    await update({ nickname, image: avatarUrl });
    window.setTimeout(() => setSuccess(false), 3200);
  }

  const showAvatar = avatar.trim() !== "" && avatarOk;

  return (
    <div
      className="relative mx-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] px-[22px] pt-0 pb-24 shadow-[var(--shadow-lg)] transition-[background] duration-[240ms]"
      style={{ transitionTimingFunction: "var(--ease)" }}
    >
      <div className="flex justify-center">
        <div
          className="-mt-[30px] h-[100px] w-[100px] rounded-full p-[3.5px]"
          style={{
            background:
              "linear-gradient(135deg, #0D9E7A 0%, #1a6b9a 100%)",
            boxShadow: "0 10px 30px rgba(13,158,122,0.32)",
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--surface-2)]"
            style={{ border: "3.5px solid var(--surface)" }}
          >
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Avatar"
                referrerPolicy="no-referrer"
                onError={() => setAvatarOk(false)}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon size={42} color="var(--text-faint)" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 mb-[22px] text-center">
        <div
          className="display text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--text)]"
        >
          {nickname.trim() ? `@${nickname.trim()}` : "El teu perfil"}
        </div>
        <div className="mt-0.5 text-[13px] text-[color:var(--text-muted)]">
          Personalitza la teva experiència PlAIner
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <Field id="nickname" label="Nickname" icon={<UserIcon size={17} />}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="travelwithjoana"
            required
            className={inputCls}
          />
        </Field>

        <Field id="age" label="Edat" icon={<Cake size={17} />}>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="28"
            min={1}
            max={120}
            required
            className={inputCls}
          />
        </Field>

        <div className="mb-4">
          <label htmlFor="gender" className={labelCls}>
            Gènere
          </label>
          <div className="relative">
            <span className={iconWrapCls}>
              <Sparkles size={17} />
            </span>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`${inputCls} cursor-pointer appearance-none ${
                gender ? "text-[color:var(--text)]" : "text-[color:var(--text-faint)]"
              }`}
            >
              <option value="">Selecciona…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g} className="text-black">
                  {g}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--text-faint)]">
              ▼
            </span>
          </div>
        </div>

        <Field id="nationality" label="Nacionalitat" icon={<Globe2 size={17} />}>
          <input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Catalana"
            className={inputCls}
          />
        </Field>

        <Field id="hobbies" label="Hobbies" icon={<Sparkles size={17} />}>
          <input
            type="text"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            placeholder="Senderisme, menjar local, museus"
            className={inputCls}
          />
        </Field>

        <Field
          id="avatar"
          icon={<Camera size={17} />}
          className="mb-5"
          label={
            <>
              Foto de perfil{" "}
              <span className="font-medium normal-case opacity-70">
                · Opcional
              </span>
            </>
          }
        >
          <div className="relative h-[52px] w-full">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatar(URL.createObjectURL(file));
                  setAvatarOk(true);
                }
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
            />
            <div className={`${inputCls} absolute inset-0 flex items-center`}>
              <span className="truncate">{avatarFile ? "Foto seleccionada" : "Pujar nova foto..."}</span>
            </div>
          </div>
        </Field>

        <div className="my-[14px] flex items-center gap-2.5">
          <div className="h-px flex-1 bg-[color:var(--border-md)]" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--text-faint)]">
            Preferències
          </span>
          <div className="h-px flex-1 bg-[color:var(--border-md)]" />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="mb-5 flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] p-[12px_14px]"
        >
          <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--green-subtle)] text-[color:var(--green)]">
            <Moon size={17} />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-semibold text-[color:var(--text)]">
              Mode fosc
            </span>
            <span className="text-xs text-[color:var(--text-muted)]">
              {dark ? "Activat" : "Desactivat"}
            </span>
          </span>
          <span
            className="flex h-[27px] w-[46px] flex-shrink-0 rounded-full p-[3px] transition-[background] duration-200"
            style={{
              background: dark ? "var(--green)" : "var(--surface-3)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            <span
              className="h-[21px] w-[21px] rounded-full bg-white transition-transform duration-200"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transform: dark ? "translateX(19px)" : "translateX(0)",
                transitionTimingFunction: "var(--ease)",
              }}
            />
          </span>
        </button>

        <div className="mb-5 rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] p-[12px_14px]">
          <div className="mb-2.5 flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--green-subtle)] text-[color:var(--green)]">
              <Globe2 size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-[color:var(--text)]">
                Idioma
              </span>
              <span className="text-xs text-[color:var(--text-muted)]">
                Tria l&apos;idioma de l&apos;aplicació
              </span>
            </span>
          </div>
          <div className="flex gap-1.5">
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
                  className="h-10 flex-1 rounded-[11px] border-[1.5px] text-[13px] transition-all duration-[160ms]"
                  style={{
                    borderColor: on ? "var(--green)" : "var(--border-md)",
                    background: on ? "var(--green-subtle)" : "var(--surface)",
                    color: on ? "var(--green)" : "var(--text-muted)",
                    fontWeight: on ? 700 : 500,
                    transitionTimingFunction: "var(--ease)",
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
            className="mb-3 rounded-[12px] border p-[11px_13px] text-[13px] font-medium text-[color:var(--coral)]"
            style={{
              background: "var(--coral-subtle)",
              borderColor: "rgba(240,90,53,0.32)",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-3 flex items-center gap-2 rounded-[12px] border p-[11px_13px] text-[13px] font-semibold text-[color:var(--green-deep)]"
            style={{
              background: "var(--green-subtle)",
              borderColor: "var(--green-glow)",
            }}
          >
            <Check size={16} /> Ajustaments guardats correctament.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pl-tap display h-[54px] w-full rounded-full border-0 text-[15px] font-bold tracking-[-0.01em] text-white transition-opacity duration-[180ms] disabled:cursor-not-allowed disabled:opacity-75"
          style={{
            background:
              "linear-gradient(135deg, var(--green) 0%, var(--green-hover) 100%)",
            boxShadow: "var(--shadow-cta)",
          }}
        >
          {loading ? "Guardant…" : "Guardar ajustaments"}
        </button>
      </form>
    </div>
  );
}
