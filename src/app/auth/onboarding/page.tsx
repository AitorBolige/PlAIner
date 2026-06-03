"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Search,
  Sparkles,
  User,
} from "lucide-react";

import { useLocale } from "@/lib/i18n-client";
import { NATIONALITIES } from "@/lib/nationalities";
import { currencyForCountry, setStoredCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";

/* ── Localized copy (falls back to Catalan) ───────────────────────────────── */
type Copy = {
  welcomeTitle: string;
  welcomeSub: string;
  start: string;
  next: string;
  back: string;
  skip: string;
  finish: string;
  saving: string;
  nicknameTitle: string;
  nicknameSub: string;
  nicknamePh: string;
  ageTitle: string;
  ageSub: string;
  genderTitle: string;
  genderSub: string;
  nationalityTitle: string;
  nationalitySub: string;
  nationalitySearch: string;
  interestsTitle: string;
  interestsSub: string;
  photoTitle: string;
  photoSub: string;
  uploadPhoto: string;
  changePhoto: string;
  doneTitle: string;
  doneSub: string;
  errNickname: string;
  errUser: string;
  errUpload: string;
  errNetwork: string;
  errSave: string;
  genders: string[];
  interests: { emoji: string; label: string }[];
};

const COPY: Partial<Record<Locale, Copy>> = {
  ca: {
    welcomeTitle: "Benvingut/da a PLAIner",
    welcomeSub: "Crea el teu perfil en mig minut. Tria, no escriguis.",
    start: "Comencem",
    next: "Continuar",
    back: "Enrere",
    skip: "Ometre",
    finish: "Acabar",
    saving: "Guardant…",
    nicknameTitle: "Com et diem?",
    nicknameSub: "El teu nom d'usuari dins de PLAIner.",
    nicknamePh: "travelwithjoana",
    ageTitle: "Quina edat tens?",
    ageSub: "Ens ajuda a recomanar-te millor.",
    genderTitle: "Amb què t'identifiques?",
    genderSub: "Opcional, però ajuda a personalitzar.",
    nationalityTitle: "D'on ets?",
    nationalitySub: "Per a vols i preus més precisos.",
    nationalitySearch: "Cerca el teu país…",
    interestsTitle: "Què t'agrada quan viatges?",
    interestsSub: "Tria'n tants com vulguis.",
    photoTitle: "Posa-hi cara",
    photoSub: "Opcional. Pots fer-ho més tard.",
    uploadPhoto: "Pujar foto",
    changePhoto: "Canviar foto",
    doneTitle: "Tot a punt!",
    doneSub: "Preparant els teus viatges…",
    errNickname: "Posa un nom d'usuari per continuar.",
    errUser: "Falta l'usuari. Torna a registrar-te.",
    errUpload: "No hem pogut pujar la imatge.",
    errNetwork: "Error de xarxa al pujar la imatge.",
    errSave: "No hem pogut guardar el teu onboarding.",
    genders: ["Dona", "Home", "No binari", "Prefereixo no dir-ho"],
    interests: [
      { emoji: "🏖️", label: "Platja" },
      { emoji: "⛰️", label: "Muntanya" },
      { emoji: "🍽️", label: "Gastronomia" },
      { emoji: "🏛️", label: "Museus" },
      { emoji: "🌃", label: "Vida nocturna" },
      { emoji: "🧗", label: "Aventura" },
      { emoji: "🌿", label: "Natura" },
      { emoji: "🛍️", label: "Compres" },
      { emoji: "🏰", label: "Història" },
      { emoji: "📸", label: "Fotografia" },
      { emoji: "🧘", label: "Relax" },
      { emoji: "🎨", label: "Art" },
    ],
  },
  es: {
    welcomeTitle: "Bienvenido/a a PLAIner",
    welcomeSub: "Crea tu perfil en medio minuto. Elige, no escribas.",
    start: "Empezar",
    next: "Continuar",
    back: "Atrás",
    skip: "Omitir",
    finish: "Terminar",
    saving: "Guardando…",
    nicknameTitle: "¿Cómo te llamamos?",
    nicknameSub: "Tu nombre de usuario en PLAIner.",
    nicknamePh: "travelwithjoana",
    ageTitle: "¿Qué edad tienes?",
    ageSub: "Nos ayuda a recomendarte mejor.",
    genderTitle: "¿Con qué te identificas?",
    genderSub: "Opcional, pero ayuda a personalizar.",
    nationalityTitle: "¿De dónde eres?",
    nationalitySub: "Para vuelos y precios más precisos.",
    nationalitySearch: "Busca tu país…",
    interestsTitle: "¿Qué te gusta al viajar?",
    interestsSub: "Elige los que quieras.",
    photoTitle: "Ponle cara",
    photoSub: "Opcional. Puedes hacerlo más tarde.",
    uploadPhoto: "Subir foto",
    changePhoto: "Cambiar foto",
    doneTitle: "¡Todo listo!",
    doneSub: "Preparando tus viajes…",
    errNickname: "Pon un nombre de usuario para continuar.",
    errUser: "Falta el usuario. Vuelve a registrarte.",
    errUpload: "No hemos podido subir la imagen.",
    errNetwork: "Error de red al subir la imagen.",
    errSave: "No hemos podido guardar tu onboarding.",
    genders: ["Mujer", "Hombre", "No binario", "Prefiero no decirlo"],
    interests: [
      { emoji: "🏖️", label: "Playa" },
      { emoji: "⛰️", label: "Montaña" },
      { emoji: "🍽️", label: "Gastronomía" },
      { emoji: "🏛️", label: "Museos" },
      { emoji: "🌃", label: "Vida nocturna" },
      { emoji: "🧗", label: "Aventura" },
      { emoji: "🌿", label: "Naturaleza" },
      { emoji: "🛍️", label: "Compras" },
      { emoji: "🏰", label: "Historia" },
      { emoji: "📸", label: "Fotografía" },
      { emoji: "🧘", label: "Relax" },
      { emoji: "🎨", label: "Arte" },
    ],
  },
  en: {
    welcomeTitle: "Welcome to PLAIner",
    welcomeSub: "Build your profile in 30 seconds. Tap, don't type.",
    start: "Get started",
    next: "Continue",
    back: "Back",
    skip: "Skip",
    finish: "Finish",
    saving: "Saving…",
    nicknameTitle: "What should we call you?",
    nicknameSub: "Your username inside PLAIner.",
    nicknamePh: "travelwithjoana",
    ageTitle: "How old are you?",
    ageSub: "Helps us recommend better.",
    genderTitle: "How do you identify?",
    genderSub: "Optional, but helps personalize.",
    nationalityTitle: "Where are you from?",
    nationalitySub: "For more accurate flights & prices.",
    nationalitySearch: "Search your country…",
    interestsTitle: "What do you love when traveling?",
    interestsSub: "Pick as many as you like.",
    photoTitle: "Add a face",
    photoSub: "Optional. You can do it later.",
    uploadPhoto: "Upload photo",
    changePhoto: "Change photo",
    doneTitle: "All set!",
    doneSub: "Preparing your trips…",
    errNickname: "Add a username to continue.",
    errUser: "Missing user. Please sign up again.",
    errUpload: "We couldn't upload the image.",
    errNetwork: "Network error while uploading.",
    errSave: "We couldn't save your onboarding.",
    genders: ["Woman", "Man", "Non-binary", "Prefer not to say"],
    interests: [
      { emoji: "🏖️", label: "Beach" },
      { emoji: "⛰️", label: "Mountains" },
      { emoji: "🍽️", label: "Food" },
      { emoji: "🏛️", label: "Museums" },
      { emoji: "🌃", label: "Nightlife" },
      { emoji: "🧗", label: "Adventure" },
      { emoji: "🌿", label: "Nature" },
      { emoji: "🛍️", label: "Shopping" },
      { emoji: "🏰", label: "History" },
      { emoji: "📸", label: "Photography" },
      { emoji: "🧘", label: "Relax" },
      { emoji: "🎨", label: "Art" },
    ],
  },
};

/* Hero image per step (Unsplash, travel-themed). */
const STEP_IMAGE = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80&auto=format&fit=crop", // welcome
  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900&q=80&auto=format&fit=crop", // nickname / passport
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80&auto=format&fit=crop", // age / road
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=900&q=80&auto=format&fit=crop", // gender / people
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=900&q=80&auto=format&fit=crop", // nationality / globe
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=900&q=80&auto=format&fit=crop", // interests / map
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&q=80&auto=format&fit=crop", // photo
];

const TOTAL_STEPS = 7; // 0 welcome … 6 photo

function OnboardingInner() {
  const searchParams = useSearchParams();
  const { update, data: session } = useSession();
  const { locale } = useLocale();
  const t = COPY[locale] ?? COPY.ca!;

  const userId = searchParams.get("user") || session?.user?.id || "";

  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);

  const [nickname, setNickname] = React.useState("");
  const [age, setAge] = React.useState<number | null>(null);
  const [gender, setGender] = React.useState("");
  const [nationality, setNationality] = React.useState("");
  const [natQuery, setNatQuery] = React.useState("");
  const [interests, setInterests] = React.useState<string[]>([]);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const go = (delta: number) => {
    setError(null);
    setDir(delta);
    setStep((s) => Math.min(TOTAL_STEPS - 1, Math.max(0, s + delta)));
  };

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  }

  const filteredNats = React.useMemo(() => {
    const q = natQuery.trim().toLowerCase();
    const list = q
      ? NATIONALITIES.filter((n) => n.labels[locale].toLowerCase().includes(q))
      : NATIONALITIES;
    return list.slice(0, 60);
  }, [natQuery, locale]);

  async function submit() {
    setError(null);
    if (!userId) return setError(t.errUser);
    if (!nickname.trim()) {
      setDir(-1);
      setStep(1);
      return setError(t.errNickname);
    }

    setLoading(true);

    let avatarUrl = "";
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { url?: string };
          avatarUrl = uploadData.url ?? "";
        } else {
          setLoading(false);
          return setError(t.errUpload);
        }
      } catch {
        setLoading(false);
        return setError(t.errNetwork);
      }
    }

    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        nickname,
        age: age ?? 0,
        gender,
        nationality,
        hobbies: interests.join(", "),
        avatar: avatarUrl,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setLoading(false);
      return setError(data.error ?? t.errSave);
    }

    setDone(true);
    await update({ onboarded: true, nickname, image: avatarUrl });
    setTimeout(() => {
      window.location.href = "/plan";
    }, 1300);
  }

  // The "primary" button is disabled until the (few) required steps are valid.
  const canAdvance =
    step === 1
      ? nickname.trim().length > 0
      : step === 2
        ? age != null && age > 0
        : true;
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      {/* Top media */}
      <div className="relative h-[40vh] min-h-[260px] w-full flex-none overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={step}
            src={STEP_IMAGE[step] ?? STEP_IMAGE[0]}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-bg" />

        {/* Brand + progress */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-12">
          <span className="display text-lg font-extrabold tracking-[-0.03em] text-white drop-shadow">
            PL<span className="text-white/60">AI</span>ner
          </span>
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="absolute inset-x-5 bottom-4 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sheet */}
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-[28px] border-t border-border bg-surface px-6 pb-6 pt-7 shadow-[0_-12px_40px_rgba(0,0,0,0.10)]">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir > 0 ? 28 : -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir > 0 ? -28 : 28 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Step 0 — Welcome */}
              {step === 0 && (
                <div className="pt-2">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--green-subtle)] px-3 py-1 text-xs font-semibold text-[color:var(--green)]">
                    <Sparkles size={13} /> PLAIner
                  </div>
                  <h1 className="display text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-text">
                    {t.welcomeTitle}
                  </h1>
                  <p className="mt-2 text-[15px] text-muted">{t.welcomeSub}</p>
                </div>
              )}

              {/* Step 1 — Nickname */}
              {step === 1 && (
                <StepHead title={t.nicknameTitle} sub={t.nicknameSub}>
                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      autoFocus
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t.nicknamePh}
                      className="h-[52px] w-full rounded-[14px] border-[1.5px] border-border bg-[color:var(--surface-2)] pl-10 pr-4 text-[15px] text-text outline-none transition focus:border-[color:var(--green)]"
                    />
                  </div>
                </StepHead>
              )}

              {/* Step 2 — Age (numeric) */}
              {step === 2 && (
                <StepHead title={t.ageTitle} sub={t.ageSub}>
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAge((a) => Math.max(1, (a ?? 25) - 1))
                      }
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-[1.5px] border-border bg-[color:var(--surface-2)] text-xl font-bold text-text"
                      aria-label="-1"
                    >
                      −
                    </button>
                    <input
                      autoFocus
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={120}
                      value={age ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") return setAge(null);
                        const n = Math.max(1, Math.min(120, Number(v)));
                        setAge(Number.isFinite(n) ? n : null);
                      }}
                      placeholder="28"
                      className="display h-[68px] w-28 rounded-[16px] border-[1.5px] border-border bg-[color:var(--surface-2)] text-center text-4xl font-extrabold text-text outline-none transition [appearance:textfield] focus:border-[color:var(--green)] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAge((a) => Math.min(120, (a ?? 25) + 1))
                      }
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-[1.5px] border-border bg-[color:var(--surface-2)] text-xl font-bold text-text"
                      aria-label="+1"
                    >
                      +
                    </button>
                  </div>
                </StepHead>
              )}

              {/* Step 3 — Gender */}
              {step === 3 && (
                <StepHead title={t.genderTitle} sub={t.genderSub}>
                  <div className="grid grid-cols-2 gap-2.5">
                    {t.genders.map((g) => (
                      <Chip
                        key={g}
                        block
                        selected={gender === g}
                        onClick={() => setGender(gender === g ? "" : g)}
                      >
                        {g}
                      </Chip>
                    ))}
                  </div>
                </StepHead>
              )}

              {/* Step 4 — Nationality */}
              {step === 4 && (
                <StepHead title={t.nationalityTitle} sub={t.nationalitySub}>
                  <div className="relative mb-3">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      type="text"
                      value={natQuery}
                      onChange={(e) => setNatQuery(e.target.value)}
                      placeholder={t.nationalitySearch}
                      className="h-12 w-full rounded-[14px] border-[1.5px] border-border bg-[color:var(--surface-2)] pl-10 pr-4 text-sm text-text outline-none transition focus:border-[color:var(--green)]"
                    />
                  </div>
                  <div className="grid max-h-[34vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {filteredNats.map((n) => {
                      const label = n.labels[locale];
                      const sel = nationality === n.code;
                      return (
                        <button
                          key={n.code}
                          type="button"
                          onClick={() => {
                            if (sel) return setNationality("");
                            setNationality(n.code);
                            // Default the display currency to the country's currency.
                            setStoredCurrency(currencyForCountry(n.code));
                          }}
                          className="flex items-center gap-2 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left text-sm transition"
                          style={{
                            borderColor: sel ? "var(--green)" : "var(--border)",
                            background: sel
                              ? "var(--green-subtle)"
                              : "var(--surface-2)",
                            color: "var(--text)",
                          }}
                        >
                          <span className="text-base leading-none">{n.flag}</span>
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </StepHead>
              )}

              {/* Step 5 — Interests */}
              {step === 5 && (
                <StepHead title={t.interestsTitle} sub={t.interestsSub}>
                  <div className="flex flex-wrap gap-2.5">
                    {t.interests.map((it) => (
                      <Chip
                        key={it.label}
                        selected={interests.includes(it.label)}
                        onClick={() => toggleInterest(it.label)}
                      >
                        <span className="mr-1.5">{it.emoji}</span>
                        {it.label}
                      </Chip>
                    ))}
                  </div>
                </StepHead>
              )}

              {/* Step 6 — Photo */}
              {step === 6 && (
                <StepHead title={t.photoTitle} sub={t.photoSub}>
                  <div className="flex flex-col items-center gap-4 pt-2">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-border bg-[color:var(--surface-2)]">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={40} className="text-faint" />
                      )}
                    </div>
                    <div className="relative">
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
                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      />
                      <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border bg-[color:var(--surface-2)] px-5 py-2.5 text-sm font-medium text-text">
                        <Camera size={16} />
                        {avatarFile ? t.changePhoto : t.uploadPhoto}
                      </span>
                    </div>
                  </div>
                </StepHead>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 rounded-[12px] border border-[color:var(--coral)]/30 bg-[color:var(--coral)]/10 px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--coral)]">
              {error}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-5 flex items-center gap-3">
          {step > 0 && !done && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border border-border bg-[color:var(--surface-2)] text-text"
              aria-label={t.back}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Optional steps get a Skip shortcut */}
          {(step === 3 || step === 4 || step === 5 || step === 6) && !done && (
            <button
              type="button"
              onClick={() => (isLast ? submit() : go(1))}
              className="h-[52px] flex-none px-4 text-sm font-semibold text-muted"
            >
              {t.skip}
            </button>
          )}

          <button
            type="button"
            disabled={!canAdvance || loading || done}
            onClick={() => (isLast ? submit() : go(1))}
            className="inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white transition disabled:opacity-50"
            style={{
              background: "var(--green)",
              boxShadow: "0 12px 30px rgba(13,158,122,0.30)",
            }}
          >
            {done
              ? t.doneTitle
              : loading
                ? t.saving
                : step === 0
                  ? t.start
                  : isLast
                    ? t.finish
                    : t.next}
            {!done && !loading && <ArrowRight size={18} />}
          </button>
        </div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/95 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--green)] text-white"
            >
              <Check size={38} strokeWidth={3} />
            </motion.div>
            <div className="text-center">
              <div className="display text-xl font-extrabold text-text">
                {t.doneTitle}
              </div>
              <p className="mt-1 text-sm text-muted">{t.doneSub}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-1">
      <h2 className="display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-text">
        {title}
      </h2>
      <p className="mb-5 mt-1.5 text-sm text-muted">{sub}</p>
      {children}
    </div>
  );
}

function Chip({
  children,
  selected,
  onClick,
  block,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  block?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center rounded-full border-[1.5px] px-4 py-2.5 text-sm font-medium transition ${
        block ? "w-full" : ""
      }`}
      style={{
        borderColor: selected ? "var(--green)" : "var(--border)",
        background: selected ? "var(--green-subtle)" : "var(--surface-2)",
        color: selected ? "var(--green-deep, var(--green))" : "var(--text)",
      }}
    >
      {selected && <Check size={14} className="mr-1.5 text-[color:var(--green)]" />}
      {children}
    </motion.button>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <OnboardingInner />
    </React.Suspense>
  );
}
