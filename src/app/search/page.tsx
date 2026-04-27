"use client";

import * as React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Slider } from "@/components/ui/Slider";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { DESTINATIONS } from "@/lib/destinations";
import { getDestinationImage } from "@/lib/destinations";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useSearchStore } from "@/store/useSearchStore";

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("ca-ES", { day: "2-digit", month: "short" });
}

function dayDiff(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(y: number, m1: number, d: number) {
  return `${y}-${pad2(m1)}-${pad2(d)}`;
}

function isSameISO(a: string, y: number, m1: number, d: number) {
  return a === toISODate(y, m1, d);
}

function startOfMonth(y: number, m0: number) {
  return new Date(y, m0, 1);
}

function daysInMonth(y: number, m0: number) {
  return new Date(y, m0 + 1, 0).getDate();
}

function weekday0MonFirst(d: Date) {
  // 0..6 where 0 is Monday
  const w = d.getDay(); // 0 Sunday
  return (w + 6) % 7;
}

function isoCompare(a: string, b: string) {
  return a.localeCompare(b);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function monthLabel(y: number, m0: number) {
  return new Date(y, m0, 1).toLocaleDateString("ca-ES", {
    month: "long",
    year: "numeric",
  });
}

function CalendarRangePicker(props: {
  start: string | null;
  end: string | null;
  onChange: (next: { start: string; end: string }) => void;
  onClose: () => void;
}) {
  const { start, end, onChange, onClose } = props;

  const today = React.useMemo(() => new Date(), []);
  const initial = React.useMemo(() => {
    if (start) {
      const [y, m, d] = start.split("-").map((x) => Number(x));
      return new Date(y, (m ?? 1) - 1, d ?? 1);
    }
    return today;
  }, [start, today]);

  const [year, setYear] = React.useState(initial.getFullYear());
  const [month0, setMonth0] = React.useState(initial.getMonth());
  const [draftStart, setDraftStart] = React.useState<string | null>(start);
  const [draftEnd, setDraftEnd] = React.useState<string | null>(end);

  const grid = React.useMemo(() => {
    const first = startOfMonth(year, month0);
    const pad = weekday0MonFirst(first);
    const n = daysInMonth(year, month0);
    const cells: Array<{ y: number; m1: number; d: number } | null> = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= n; d++) cells.push({ y: year, m1: month0 + 1, d });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month0, year]);

  function isInRange(iso: string) {
    if (!draftStart || !draftEnd) return false;
    if (isoCompare(draftStart, draftEnd) > 0) return false;
    return isoCompare(iso, draftStart) >= 0 && isoCompare(iso, draftEnd) <= 0;
  }

  function pick(iso: string) {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(iso);
      setDraftEnd(null);
      return;
    }
    // we have a start but no end
    if (isoCompare(iso, draftStart) < 0) {
      setDraftEnd(draftStart);
      setDraftStart(iso);
    } else {
      setDraftEnd(iso);
    }
  }

  const canSave = !!draftStart && !!draftEnd;

  return (
    <div style={{ padding: 2 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 6px 14px",
        }}
      >
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => {
            const next = new Date(year, month0 - 1, 1);
            setYear(next.getFullYear());
            setMonth0(next.getMonth());
          }}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} color="var(--text-muted)" />
        </button>

        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            textTransform: "capitalize",
          }}
        >
          {monthLabel(year, month0)}
        </div>

        <button
          type="button"
          aria-label="Mes següent"
          onClick={() => {
            const next = new Date(year, month0 + 1, 1);
            setYear(next.getFullYear());
            setMonth0(next.getMonth());
          }}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={18} color="var(--text-muted)" />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          padding: "0 6px 8px",
        }}
      >
        {["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
              textAlign: "center",
              paddingBottom: 2,
            }}
          >
            {d}
          </div>
        ))}

        {grid.map((cell, idx) => {
          if (!cell) {
            return <div key={idx} style={{ height: 38 }} />;
          }
          const iso = toISODate(cell.y, cell.m1, cell.d);
          const selectedStart =
            !!draftStart && isSameISO(draftStart, cell.y, cell.m1, cell.d);
          const selectedEnd =
            !!draftEnd && isSameISO(draftEnd, cell.y, cell.m1, cell.d);
          const inRange = isInRange(iso);

          const bg = selectedStart || selectedEnd
            ? "var(--green)"
            : inRange
              ? "var(--green-subtle)"
              : "transparent";
          const color = selectedStart || selectedEnd ? "#fff" : "var(--text)";

          return (
            <button
              key={iso}
              type="button"
              onClick={() => pick(iso)}
              style={{
                height: 38,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: bg,
                color,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                transition: "var(--t)",
              }}
            >
              {cell.d}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          padding: "10px 6px 6px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setDraftStart(null);
            setDraftEnd(null);
          }}
          style={{
            height: 44,
            padding: "0 16px",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--border-md)",
            background: "var(--surface)",
            color: "var(--text)",
            fontWeight: 600,
          }}
        >
          Netejar
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            if (!draftStart || !draftEnd) return;
            onChange({ start: draftStart, end: draftEnd });
            onClose();
          }}
          style={{
            flex: 1,
            height: 44,
            padding: "0 18px",
            borderRadius: "var(--r-pill)",
            border: "none",
            background: canSave ? "var(--green)" : "var(--surface-3)",
            color: canSave ? "#fff" : "var(--text-faint)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            boxShadow: canSave ? "var(--shadow-cta)" : "none",
            transition: "var(--t)",
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

const HERO_DESTINATIONS = ["lisbon", "tokyo", "santorini", "bali"] as const;

export default function SearchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const onboarding = useOnboardingStore();
  const search = useSearchStore();

  const [openBudget, setOpenBudget] = React.useState(false);
  const [openDates, setOpenDates] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (!search.budgetMax && onboarding.budget) {
      search.setBudgetMax(onboarding.budget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [destinationQuery, setDestinationQuery] = React.useState(search.destination);
  React.useEffect(() => setDestinationQuery(search.destination), [search.destination]);

  const filteredDestinations = React.useMemo(() => {
    const q = destinationQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return DESTINATIONS.filter((d) => d.city.toLowerCase().includes(q)).slice(0, 6);
  }, [destinationQuery]);

  const canGenerate =
    search.destination.trim().length > 0 &&
    !!search.dateRange?.start &&
    !!search.dateRange?.end &&
    search.people >= 1;

  // Note: recommended section uses fixed gradient cards (DESTINATIONS)

  function setDestination(city: string) {
    search.setDestination(city);
    setDestinationQuery(city);
  }

  const destination = search.destination.trim();
  const startDate = search.dateRange?.start ?? null;
  const endDate = search.dateRange?.end ?? null;
  const diffDays = startDate && endDate ? dayDiff(startDate, endDate) : null;

  const budget = search.budgetMax;
  const people = search.people;

  const [heroIndex, setHeroIndex] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_DESTINATIONS.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, []);

  const currentHero = React.useMemo(() => {
    const id = HERO_DESTINATIONS[heroIndex];
    return DESTINATIONS.find((d) => d.id === id) ?? DESTINATIONS[0];
  }, [heroIndex]);

  const handleGenerate = async () => {
    if (status === "loading") return;

    if (!session) {
      sessionStorage.setItem(
        "plainer_pending_search",
        JSON.stringify({ destination, startDate, endDate, people, budget })
      );
      router.push("/auth/login?redirect=/search&reason=generate");
      return;
    }

    if (!destination || !startDate || !endDate) return;

    setIsGenerating(true);

    try {
      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          people,
          budgetMax: budget,
        }),
      });

      if (res.status === 401) {
        setIsGenerating(false);
        router.push("/auth/login?redirect=/search&reason=generate");
        return;
      }

      if (!res.ok) {
        setIsGenerating(false);
        return;
      }

      const data = (await res.json()) as { tripId: string };
      router.push(`/trip/${data.tripId}`);
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {isGenerating ? (
        <GeneratingScreen
          destination={destination || "Viatge"}
          heroImage={getDestinationImage(destination || currentHero.city, "hero")}
        />
      ) : null}

      {/* HERO DESKTOP */}
      <div
        className="hidden md:block"
        style={{
          position: "relative",
          height: "320px",
          overflow: "hidden",
          borderRadius: "0 0 32px 32px",
          marginBottom: "-60px",
        }}
      >
        <Image
          key={heroIndex}
          src={currentHero.heroImage}
          alt={currentHero.city}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", animation: "heroFadeIn 1s ease" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div style={{ position: "absolute", bottom: "80px", left: "40px", right: "40px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "4px" }}>
            DESTÍ DESTACAT
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "42px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
            }}
          >
            {currentHero.city}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", marginTop: "6px" }}>
            {currentHero.description}
          </p>
        </div>
        <div style={{ position: "absolute", bottom: "28px", left: "40px", display: "flex", gap: "6px" }}>
          {HERO_DESTINATIONS.map((_, i) => (
            <div
              key={i}
              onClick={() => setHeroIndex(i)}
              style={{
                width: i === heroIndex ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === heroIndex ? "#fff" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                transition: "all 300ms ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* A) HEADER (solo mobile) */}
      <header className="md:hidden flex items-center justify-between px-5 pt-14 pb-2">
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-muted)",
              letterSpacing: "0.01em",
            }}
          >
            Bon dia
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "34px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginTop: "2px",
            }}
          >
            On anem?
          </h1>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1.5px solid var(--border-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={18} color="var(--text-muted)" />
        </div>
      </header>

      {/* B) SUBTÍTULO */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          color: "var(--text-muted)",
          padding: "4px 20px 24px",
          lineHeight: 1.4,
        }}
      >
        Configura el teu viatge i deixa que la IA faci la resta.
      </p>

      {/* C) SEARCH CARD PRINCIPAL */}
      <div
        style={{
          margin: "0 auto",
          maxWidth: 480,
          paddingLeft: 16,
          paddingRight: 16,
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* FILA 1: DESTINO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            gap: "12px",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--r-md)",
              background: "var(--green-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={18} color="var(--green)" />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "2px",
              }}
            >
              Destinació
            </p>
            <input
              value={destinationQuery}
              onChange={(e) => {
                setDestinationQuery(e.target.value);
                search.setDestination(e.target.value);
              }}
              placeholder="Quina destinació?"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "16px",
                fontWeight: destinationQuery ? 600 : 500,
                color: destinationQuery ? "var(--text)" : "var(--text-faint)",
              }}
            />
          </div>
          <ChevronRight size={18} color="var(--text-faint)" />

          {/* Autocomplete inline */}
          {destinationQuery.trim().length > 1 && filteredDestinations.length ? (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--surface)",
                borderRadius: "0 0 var(--r-lg) var(--r-lg)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border)",
                borderTop: "none",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {filteredDestinations.map((dest) => (
                <div
                  key={dest.id}
                  onClick={() => {
                    setDestination(dest.city);
                    setDestinationQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    <Image
                      src={dest.cardImage}
                      alt={dest.city}
                      fill
                      sizes="44px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
                      {dest.city}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {dest.country} · des de {dest.priceFrom} €
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "var(--r-pill)",
                        background: `${dest.tagColor}18`,
                        color: dest.tagColor,
                      }}
                    >
                      {dest.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* FILA 2: DATES */}
        <div
          onClick={() => setOpenDates(true)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            gap: "12px",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--r-md)",
              background: "var(--blue-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={18} color="var(--blue)" />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "2px",
              }}
            >
              Dates
            </p>
            {startDate && endDate ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
                  {formatDate(startDate)}
                </p>
                <span style={{ color: "var(--text-faint)", fontSize: "13px" }}>→</span>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
                  {formatDate(endDate)}
                </p>
                <span
                  style={{
                    marginLeft: "4px",
                    background: "var(--blue-subtle)",
                    color: "var(--blue)",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "var(--r-pill)",
                  }}
                >
                  {diffDays} dies
                </span>
              </div>
            ) : (
              <p style={{ fontSize: "15px", color: "var(--text-faint)" }}>Quan?</p>
            )}
          </div>
          <ChevronRight size={18} color="var(--text-faint)" />
        </div>

        {/* FILA 3: PERSONES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 20px",
            gap: "12px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--r-md)",
              background: "var(--coral-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={18} color="var(--coral)" />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "2px",
              }}
            >
              Persones
            </p>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>
              {people} {people === 1 ? "persona" : "persones"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => search.setPeople(Math.max(1, people - 1))}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: people <= 1 ? "var(--surface-2)" : "var(--surface-3)",
                border: "1px solid var(--border-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: people <= 1 ? "var(--text-faint)" : "var(--text)",
                transition: "var(--t)",
              }}
            >
              <Minus size={14} />
            </button>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--text)",
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {people}
            </span>
            <button
              type="button"
              onClick={() => search.setPeople(clamp(people + 1, 1, 12))}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--green)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                transition: "var(--t)",
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* FILA 4: PRESSUPOST */}
        <div
          onClick={() => setOpenBudget(true)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 20px",
            gap: "12px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--r-md)",
              background: "rgba(255,190,50,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wallet size={18} color="#C8860A" />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "2px",
              }}
            >
              Pressupost
            </p>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
              {budget.toLocaleString()} € per persona
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,190,50,0.12)",
              color: "#C8860A",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
            }}
          >
            Editar
          </div>
        </div>

        {/* BOTÓ CTA */}
        <div style={{ padding: "16px 16px 20px" }}>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              width: "100%",
              height: "56px",
              background: canGenerate ? "var(--green)" : "var(--surface-3)",
              color: canGenerate ? "#ffffff" : "var(--text-faint)",
              border: "none",
              borderRadius: "var(--r-pill)",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: canGenerate ? "var(--shadow-cta)" : "none",
              transition: "var(--t)",
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            {!session ? (
              <>
                <Lock size={18} />
                Inicia sessió per continuar
              </>
            ) : isGenerating ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Generant el teu viatge...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Genera el meu viatge
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              marginTop: "12px",
              flexWrap: "wrap",
            }}
          >
            {["Pressupost visible", "Sense sorpreses", "Personalitzat"].map(
              (badge) => (
                <span
                  key={badge}
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    background: "var(--surface-2)",
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* DESTINS POPULARS + fotos reals */}
      <section style={{ padding: "28px 16px 120px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Destins populars
          </p>
          <a
            href="/explore"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--green)",
              textDecoration: "none",
            }}
          >
            Veure tots →
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {DESTINATIONS.slice(0, 4).map((dest, i) => (
            <div
              key={dest.id}
              onClick={() => setDestination(dest.city)}
              style={{
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--border)",
                position: "relative",
                height: i < 2 ? "180px" : "150px",
                transition: "transform 200ms var(--ease), box-shadow 200ms var(--ease)",
              }}
            >
              <Image
                src={dest.cardImage}
                alt={dest.city}
                fill
                sizes="(max-width: 768px) 50vw, 300px"
                style={{ objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "var(--r-pill)",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                des de {dest.priceFrom} €
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: dest.tagColor,
                  borderRadius: "var(--r-pill)",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.02em",
                }}
              >
                {dest.tag}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 14px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: "2px",
                  }}
                >
                  {dest.city}
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{dest.country}</p>
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            margin: "24px 0 12px",
          }}
        >
          Més destinacions
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "none",
          }}
        >
          {DESTINATIONS.slice(4).map((dest) => (
            <div
              key={dest.id}
              onClick={() => setDestination(dest.city)}
              style={{
                flexShrink: 0,
                width: "130px",
                height: "100px",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--border)",
              }}
            >
              <Image
                src={dest.cardImage}
                alt={dest.city}
                fill
                sizes="130px"
                style={{ objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)",
                }}
              />
              <p
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "10px",
                  fontFamily: "var(--font-display)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {dest.city}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Dates modal (custom — no native date inputs) */}
      <Modal open={openDates} onClose={() => setOpenDates(false)} title="Dates">
        <CalendarRangePicker
          start={startDate}
          end={endDate}
          onClose={() => setOpenDates(false)}
          onChange={(next) => search.setDateRange(next)}
        />
      </Modal>

      {/* Budget modal */}
      <Modal open={openBudget} onClose={() => setOpenBudget(false)} title="Pressupost">
        <div className="grid gap-6">
          <div className="flex items-end justify-between">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              {euro(search.budgetMax)}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              total màxim
            </div>
          </div>
          <Slider
            value={search.budgetMax}
            min={200}
            max={5000}
            step={50}
            ariaLabel="Pressupost"
            onChange={(v) => search.setBudgetMax(v)}
          />
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setOpenBudget(false)}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes heroFadeIn { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

