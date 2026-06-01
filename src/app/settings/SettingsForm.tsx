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
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n-client";
import { type Locale } from "@/lib/i18n";
import { NATIONALITIES } from "@/lib/nationalities";

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
  initialLocale?: Locale;
}

function getLocalizedGender(val: string | null, targetLocale: Locale): string {
  if (!val) return "";
  const name = val.trim().toLowerCase();
  const gendersMap: Record<string, Partial<Record<Locale, string>>> = {
    "dona": { ca: "Dona", es: "Mujer", en: "Woman", de: "Frau", fr: "Femme", it: "Donna", pt: "Mulher", ar: "أنثى", zh: "女", hi: "महिला" },
    "woman": { ca: "Dona", es: "Mujer", en: "Woman", de: "Frau", fr: "Femme", it: "Donna", pt: "Mulher", ar: "أنثى", zh: "女", hi: "महिला" },
    "mujer": { ca: "Dona", es: "Mujer", en: "Woman", de: "Frau", fr: "Femme", it: "Donna", pt: "Mulher", ar: "أنثى", zh: "女", hi: "महिला" },

    "home": { ca: "Home", es: "Hombre", en: "Man", de: "Mann", fr: "Homme", it: "Uomo", pt: "Homem", ar: "ذكر", zh: "男", hi: "पुरुष" },
    "man": { ca: "Home", es: "Hombre", en: "Man", de: "Mann", fr: "Homme", it: "Uomo", pt: "Homem", ar: "ذكر", zh: "男", hi: "पुरुष" },
    "hombre": { ca: "Home", es: "Hombre", en: "Man", de: "Mann", fr: "Homme", it: "Uomo", pt: "Homem", ar: "ذكر", zh: "男", hi: "पुरुष" },

    "no binari": { ca: "No binari", es: "No binario", en: "Non-binary", de: "Non-binär", fr: "Non-binaire", it: "Non binario", pt: "Não-binário", ar: "غير ثنائي", zh: "非二元", hi: "गैर-बाइनरी" },
    "non-binary": { ca: "No binari", es: "No binario", en: "Non-binary", de: "Non-binär", fr: "Non-binaire", it: "Non binario", pt: "Não-binário", ar: "غير ثنائي", zh: "非二元", hi: "गैर-बाइनरी" },
    "no binario": { ca: "No binari", es: "No binario", en: "Non-binary", de: "Non-binär", fr: "Non-binaire", it: "Non binario", pt: "Não-binário", ar: "غير ثنائي", zh: "非二元", hi: "गैर-बाइनरी" },

    "prefereixo no dir-ho": { ca: "Prefereixo no dir-ho", es: "Prefiero no decirlo", en: "Prefer not to say", de: "Keine Angabe", fr: "Préfère ne pas le dire", it: "Preferisco no dirlo", pt: "Prefiro não dizer", ar: "أفضل عدم الإفصاح", zh: "不想透露", hi: "बताना नहीं चाहते" },
    "prefer not to say": { ca: "Prefereixo no dir-ho", es: "Prefiero no decirlo", en: "Prefer not to say", de: "Keine Angabe", fr: "Préfère ne pas le dire", it: "Preferisco no dirlo", pt: "Prefiro não dizer", ar: "أفضل عدم الإفصاح", zh: "不想透露", hi: "बताना नहीं चाहते" },
    "prefiero no decirlo": { ca: "Prefereixo no dir-ho", es: "Prefiero no decirlo", en: "Prefer not to say", de: "Keine Angabe", fr: "Préfère ne pas le dire", it: "Preferisco no dirlo", pt: "Prefiro não dizer", ar: "أفضل عدم الإفصاح", zh: "不想透露", hi: "बताना नहीं चाहते" },

    "altre": { ca: "Altre", es: "Otro", en: "Other", de: "Andere", fr: "Autre", it: "Altro", pt: "Outro", ar: "آخر", zh: "其他", hi: "अन्य" },
    "other": { ca: "Altre", es: "Otro", en: "Other", de: "Andere", fr: "Autre", it: "Altro", pt: "Outro", ar: "آخر", zh: "其他", hi: "अन्य" },
    "otro": { ca: "Altre", es: "Otro", en: "Other", de: "Andere", fr: "Autre", it: "Altro", pt: "Outro", ar: "آخر", zh: "其他", hi: "अन्य" },
  };
  return gendersMap[name]?.[targetLocale] ?? gendersMap[name]?.en ?? val;
}

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

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
  placeholder: string;
  icon?: React.ReactNode;
  className?: string;
}

function CustomSelect({ id, value, onChange, options, placeholder, icon, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className || ""}`}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] py-0 pr-4 text-[15px] text-[color:var(--text)] outline-none transition-[border-color,box-shadow] duration-[180ms] flex items-center justify-between cursor-pointer relative ${
          icon ? "pl-11 h-[52px]" : "pl-4 h-11"
        } ${
          isOpen ? "border-[color:var(--green)] shadow-[0_0_0_4px_var(--green-subtle)]" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[color:var(--text-faint)] flex pointer-events-none">
              {icon}
            </span>
          )}
          <span className={value ? "text-[color:var(--text)] font-semibold" : "text-[color:var(--text-faint)]"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className={`text-[10px] text-[color:var(--text-faint)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-1.5 w-full overflow-hidden rounded-[14px] border border-[color:var(--border-md)] bg-[color:var(--surface)] p-1 shadow-[var(--shadow-lg)] pl-fadein"
          style={{ transformOrigin: "top" }}
        >
          <div className="max-h-[220px] overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[10px] px-3.5 py-3 text-left text-[14px] font-medium transition-[background,color] duration-[150ms] outline-none ${
                    isSelected
                      ? "bg-[color:var(--green-subtle)] text-[color:var(--green-deep)]"
                      : "text-[color:var(--text)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] focus:bg-[color:var(--surface-2)]"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={15} className="text-[color:var(--green)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Searchable Nationality Dropdown ── */
interface NationalitySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  locale: Locale;
}

function NationalitySelect({ id, value, onChange, placeholder, searchPlaceholder, locale }: NationalitySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const options = React.useMemo(() =>
    NATIONALITIES.map((n) => ({
      code: n.code,
      flag: n.flag,
      label: n.labels[locale] || n.labels.en,
    })),
    [locale]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().startsWith(q) ||
        o.code.toLowerCase().startsWith(q)
    );
  }, [options, search]);

  const selected = options.find((o) => o.code === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
        className={`w-full rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] py-0 pl-11 pr-4 h-[52px] text-[15px] text-[color:var(--text)] outline-none transition-[border-color,box-shadow] duration-[180ms] flex items-center justify-between cursor-pointer relative ${
          isOpen ? "border-[color:var(--green)] shadow-[0_0_0_4px_var(--green-subtle)]" : ""
        }`}
      >
        <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[color:var(--text-faint)] flex pointer-events-none">
          <Globe2 size={17} />
        </span>
        <span className={selected ? "text-[color:var(--text)] font-semibold flex items-center gap-2" : "text-[color:var(--text-faint)]"}>
          {selected ? <>{selected.flag} {selected.label}</> : placeholder}
        </span>
        <span className={`text-[10px] text-[color:var(--text-faint)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-1.5 w-full overflow-hidden rounded-[14px] border border-[color:var(--border-md)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)] pl-fadein"
          style={{ transformOrigin: "top" }}
        >
          {/* Search bar */}
          <div className="sticky top-0 z-10 bg-[color:var(--surface)] p-2 border-b border-[color:var(--border)]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)] pointer-events-none">
                <Search size={14} />
              </span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 rounded-[10px] bg-[color:var(--surface-2)] border border-[color:var(--border)] pl-8 pr-3 text-[13px] text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--green)] transition-[border-color] duration-150"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-3 text-[13px] text-[color:var(--text-faint)] text-center">
                —
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.code === value;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      onChange(opt.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-[10px] px-3.5 py-3 text-left text-[14px] font-medium transition-[background,color] duration-[150ms] outline-none ${
                      isSelected
                        ? "bg-[color:var(--green-subtle)] text-[color:var(--green-deep)]"
                        : "text-[color:var(--text)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] focus:bg-[color:var(--surface-2)]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{opt.flag}</span>
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && <Check size={15} className="text-[color:var(--green)]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsForm({ userId, initialData, initialLocale }: SettingsFormProps) {
  const { update } = useSession();
  const [dark, toggleTheme] = useTheme();
  const { locale, t } = useLocale(initialLocale);

  const [nickname, setNickname] = React.useState(initialData.nickname || "");
  const [age, setAge] = React.useState(initialData.age?.toString() || "");
  const [gender, setGender] = React.useState("");
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

  // Sync localized gender once locale is loaded
  React.useEffect(() => {
    if (initialData.gender) {
      setGender(getLocalizedGender(initialData.gender, locale));
    }
  }, [initialData.gender, locale]);

  function changeLang(next: Locale) {
    if (next === locale) return;
    try {
      localStorage.setItem("pl-lang", next);
      document.cookie = `pl-lang=${next};path=/;max-age=31536000`;
    } catch {
      /* noop */
    }
    window.location.reload();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nickname.trim()) {
      setError(t.nicknameRequired);
      return;
    }

    const ageNumber = Number(age);
    if (!Number.isFinite(ageNumber) || ageNumber <= 0) {
      setError(t.ageInvalid);
      return;
    }

    setLoading(true);

    // Upload new avatar file if one was selected
    let avatarUrl = avatar;
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json() as { url?: string };
          avatarUrl = uploadData.url ?? avatar;
          setAvatar(avatarUrl);
          setAvatarFile(null);
        }
      } catch {
        // Non-fatal: keep existing avatar
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
      setError(data.error ?? t.saveSettingsError);
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
          {nickname.trim() ? `@${nickname.trim()}` : t.onboardingDefaultProfile}
        </div>
        <div className="mt-0.5 text-[13px] text-[color:var(--text-muted)]">
          {t.onboardingPersonalize}
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <Field id="nickname" label={t.nicknameLabel} icon={<UserIcon size={17} />}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="travelwithjoana"
            required
            className={inputCls}
          />
        </Field>

        <Field id="age" label={t.ageLabel} icon={<Cake size={17} />}>
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
            {t.genderLabel}
          </label>
          <CustomSelect
            id="gender"
            value={gender}
            onChange={(val) => setGender(val)}
            placeholder={t.genderSelectPlaceholder}
            icon={<Sparkles size={17} />}
            options={t.gendersList.map((g) => ({ value: g, label: g }))}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="nationality" className={labelCls}>
            {t.nationalityLabel}
          </label>
          <NationalitySelect
            id="nationality"
            value={nationality}
            onChange={(val) => setNationality(val)}
            placeholder={t.nationalityPlaceholder}
            searchPlaceholder={t.nationalitySearchPlaceholder}
            locale={locale}
          />
        </div>

        <Field id="hobbies" label={t.hobbiesLabel} icon={<Sparkles size={17} />}>
          <input
            type="text"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            placeholder={t.hobbiesPlaceholder}
            className={inputCls}
          />
        </Field>

        <div className="mb-5">
          <label className={labelCls}>
            {t.avatarLabel}{" "}
            <span className="font-medium normal-case opacity-70">{t.avatarOptional}</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)]">
              {showAvatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatar} alt="" className="h-full w-full object-cover" onError={() => setAvatarOk(false)} />
                : <span className="flex h-full w-full items-center justify-center text-[color:var(--text-faint)]"><Camera size={20} /></span>
              }
            </div>
            <div className="relative flex-1">
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
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <button
                type="button"
                className="flex h-[52px] w-full items-center gap-2 rounded-[14px] border-[1.5px] border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 text-[15px] text-[color:var(--text)]"
              >
                <Camera size={16} className="flex-shrink-0 text-[color:var(--text-faint)]" />
                <span className="truncate">{avatarFile ? "Foto seleccionada" : "Pujar nova foto..."}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="my-[14px] flex items-center gap-2.5">
          <div className="h-px flex-1 bg-[color:var(--border-md)]" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--text-faint)]">
            {t.preferences}
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
              {t.darkModeLabel}
            </span>
            <span className="text-xs text-[color:var(--text-muted)]">
              {t.darkModeSub(dark)}
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
                {t.languageLabel}
              </span>
              <span className="text-xs text-[color:var(--text-muted)]">
                {t.languageSub}
              </span>
            </span>
          </div>
          <CustomSelect
            value={locale}
            onChange={(val) => changeLang(val as Locale)}
            placeholder=""
            options={[
              { value: "ca", label: "🏴󠁡󠁥󠁣󠁡󠁴󠁿 Català" },
              { value: "es", label: "🇪🇸 Español" },
              { value: "en", label: "🇬🇧 English" },
              { value: "de", label: "🇩🇪 Deutsch" },
              { value: "fr", label: "🇫🇷 Français" },
              { value: "it", label: "🇮🇹 Italiano" },
              { value: "pt", label: "🇵🇹 Português" },
              { value: "ar", label: "🇸🇦 العربية" },
              { value: "zh", label: "🇨🇳 中文 (简体)" },
              { value: "hi", label: "🇮🇳 हिन्दी" }
            ]}
          />
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
            <Check size={16} /> {t.saveSettingsSuccess}
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
          {loading ? t.savingSettingsBtn : t.saveSettingsBtn}
        </button>
      </form>
    </div>
  );
}
