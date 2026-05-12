"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Heart,
  Map,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { SAMPLE_TRIPS, type Trip } from "@/lib/data";

function useAppShellBody() {
  React.useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);
}

function HeroImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

function BottomTabs({ active }: { active: "search" | "trips" }) {
  const Tab = ({
    id,
    icon,
    label,
    href,
  }: {
    id: "search" | "trips";
    icon: React.ReactNode;
    label: string;
    href: string;
  }) => {
    const isActive = id === active;
    return (
      <Link
        href={href}
        className="pl-tap"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: isActive ? "var(--green)" : "var(--text-faint)",
          padding: "8px 0",
          textDecoration: "none",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 11,
            fontWeight: isActive ? 600 : 500,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 9999,
            background: isActive ? "var(--green)" : "transparent",
            marginTop: 1,
          }}
        />
      </Link>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 78,
        paddingBottom: 14,
        background: "rgba(247,245,242,0.92)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <Tab
        id="search"
        icon={<MapPin size={22} />}
        label="Cerca"
        href="/search"
      />
      <Tab id="trips" icon={<Map size={22} />} label="Viatges" href="/trips" />
    </div>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "var(--text-muted)",
      }}
    >
      <span style={{ color: "var(--text-faint)", display: "inline-flex" }}>
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 9999,
          background: "var(--green-subtle)",
          color: "var(--green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <MapPin size={28} />
      </div>
      <div
        className="display"
        style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}
      >
        Comença el teu primer viatge
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          color: "var(--text-muted)",
          maxWidth: 240,
        }}
      >
        Configura el teu destí i deixa que la IA dissenyi el viatge perfecte.
      </div>
      <button
        onClick={onAdd}
        className="pl-tap"
        style={{
          marginTop: 22,
          height: 48,
          padding: "0 22px",
          borderRadius: 9999,
          background: "var(--green)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "var(--shadow-cta)",
          border: "none",
        }}
      >
        Planifica un viatge
      </button>
    </div>
  );
}

function TripCard({
  trip,
  fav,
  onFav,
  onOpen,
}: {
  trip: Trip;
  fav: boolean;
  onFav: () => void;
  onOpen: () => void;
}) {
  const statusBadge =
    trip.status === "upcoming"
      ? { bg: "rgba(59,135,232,0.95)", label: "Pròximament" }
      : { bg: "rgba(13,158,122,0.95)", label: "Completat" };

  return (
    <button
      onClick={onOpen}
      className="pl-tap"
      style={{
        background: "#fff",
        borderRadius: 24,
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        textAlign: "left",
        width: "100%",
        padding: 0,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: 160 }}>
        <HeroImg src={trip.img} alt={trip.city} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span
            style={{
              background: statusBadge.bg,
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {statusBadge.label}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="pl-tap"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(4px)",
            color: fav ? "var(--coral)" : "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
          }}
          aria-label={fav ? "Treure de favorits" : "Afegir a favorits"}
        >
          <Heart size={18} fill={fav ? "currentColor" : "none"} />
        </button>
        <div style={{ position: "absolute", left: 14, bottom: 12 }}>
          <div
            className="display"
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "#fff",
              letterSpacing: "-0.025em",
            }}
          >
            {trip.city}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
            {trip.country}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <Meta icon={<Calendar size={15} />}>
            {trip.start} – {trip.end} · {trip.days} dies
          </Meta>
          <Meta icon={<Users size={15} />}>{trip.people} persones</Meta>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="micro">COST TOTAL</div>
          <div
            className="display"
            style={{
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.025em",
              marginTop: 2,
            }}
          >
            {trip.total.toLocaleString("ca")} €
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--green)",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Veure detall →
          </div>
        </div>
      </div>
    </button>
  );
}

function TripDetail({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const items = [
    {
      day: "Dia 1",
      title: "Arribada + tarda lliure",
      sub: "Vol AF1234 · 12:40",
      price: 220,
    },
    {
      day: "Dia 2",
      title: "Tour pel centre històric",
      sub: "Inclou guia local · 4h",
      price: 38,
    },
    {
      day: "Dia 3",
      title: "Excursió costanera",
      sub: "Bus + dinar inclòs",
      price: 65,
    },
    {
      day: "Dia 4",
      title: "Dia gastronòmic",
      sub: "Tast a 3 llocs · vespre",
      price: 72,
    },
    {
      day: "Dia 5",
      title: "Museu + temps lliure",
      sub: "Entrada + audioguia",
      price: 24,
    },
    { day: "Dia 6", title: "Tornada", sub: "Vol AF5678 · 18:10", price: 240 },
  ];

  return (
    <div
      className="pl-app pl-fadein"
      style={{
        background: "var(--bg)",
        width: "100%",
        maxWidth: 430,
        height: "100%",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="pl-noscroll"
        style={{ height: "100%", overflowY: "auto", paddingBottom: 40 }}
      >
        <div style={{ position: "relative", height: 280 }}>
          <HeroImg src={trip.img} alt={trip.city} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)",
            }}
          />
          <button
            onClick={onBack}
            className="pl-tap"
            style={{
              position: "absolute",
              top: 54,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.95)",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              border: "none",
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 18,
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.78)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {trip.country}
            </div>
            <div
              className="display"
              style={{
                fontWeight: 800,
                fontSize: 36,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {trip.city}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13.5,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {trip.start} – {trip.end} · {trip.days} dies · {trip.people}{" "}
              persones
            </div>
          </div>
        </div>

        <div
          style={{ margin: "-32px 16px 0", position: "relative", zIndex: 2 }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 18,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="micro">COST TOTAL · TOT INCLÒS</div>
                <div
                  className="display"
                  style={{
                    fontWeight: 800,
                    fontSize: 32,
                    letterSpacing: "-0.03em",
                    marginTop: 2,
                  }}
                >
                  {trip.total.toLocaleString("ca")} €
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {Math.round(trip.total / trip.people).toLocaleString("ca")} €
                  per persona
                </div>
              </div>
              <span
                style={{
                  background: "var(--green-subtle)",
                  color: "var(--green-deep)",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                Equilibrat
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
                marginTop: 16,
              }}
            >
              {[
                { c: "var(--coral)", l: "Transport", v: 460 },
                { c: "var(--green)", l: "Allotjament", v: 540 },
                { c: "var(--gold)", l: "Activitats", v: 148 },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface-2)",
                    padding: "10px 10px",
                    borderRadius: 12,
                  }}
                >
                  <span
                    style={{
                      color: b.c,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {b.l}
                  </span>
                  <div
                    className="display"
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginTop: 4,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {b.v} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 20px 0" }}>
          <div className="micro" style={{ marginBottom: 12 }}>
            ITINERARI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 14,
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--green-subtle)",
                    color: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 12,
                    flexShrink: 0,
                    lineHeight: 1,
                    padding: 4,
                    textAlign: "center",
                  }}
                >
                  {it.day}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="display"
                    style={{ fontWeight: 600, fontSize: 14.5 }}
                  >
                    {it.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {it.sub}
                  </div>
                </div>
                <div
                  className="display"
                  style={{ fontWeight: 700, fontSize: 14 }}
                >
                  {it.price} €
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px 16px 0" }}>
          <button
            className="pl-tap"
            style={{
              width: "100%",
              height: 56,
              borderRadius: 9999,
              background: "var(--green)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "var(--shadow-cta)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: "none",
            }}
          >
            <Sparkles size={18} /> Reservar tot el viatge
          </button>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Et redirigirem als nostres partners verificats
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  useAppShellBody();
  const router = useRouter();

  const [trips] = React.useState<Trip[]>(SAMPLE_TRIPS);
  const [openTrip, setOpenTrip] = React.useState<Trip | null>(null);
  const [filter, setFilter] = React.useState<
    "all" | "upcoming" | "past" | "fav"
  >("all");
  const [favs, setFavs] = React.useState<Set<string>>(() => {
    const s = new Set<string>();
    trips.forEach((t) => t.favorite && s.add(t.id));
    return s;
  });

  const counts = React.useMemo(
    () => ({
      all: trips.length,
      upcoming: trips.filter((t) => t.status === "upcoming").length,
      past: trips.filter((t) => t.status === "past").length,
      fav: trips.filter((t) => favs.has(t.id)).length,
    }),
    [trips, favs],
  );

  const visible = React.useMemo(
    () =>
      trips.filter((t) =>
        filter === "all"
          ? true
          : filter === "upcoming"
            ? t.status === "upcoming"
            : filter === "past"
              ? t.status === "past"
              : filter === "fav"
                ? favs.has(t.id)
                : true,
      ),
    [trips, filter, favs],
  );

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  };

  if (openTrip) {
    return (
      <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
        <TripDetail trip={openTrip} onBack={() => setOpenTrip(null)} />
      </div>
    );
  }

  const tabs: {
    id: "all" | "upcoming" | "past" | "fav";
    label: string;
    n: number;
  }[] = [
    { id: "all", label: "Tots", n: counts.all },
    { id: "upcoming", label: "Pròxims", n: counts.upcoming },
    { id: "past", label: "Passats", n: counts.past },
    { id: "fav", label: "Favorits", n: counts.fav },
  ];

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <div
        className="pl-app pl-fadein"
        style={{
          background: "var(--bg)",
          width: "100%",
          maxWidth: 430,
          height: "100%",
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="pl-noscroll"
          style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}
        >
          <div
            style={{
              padding: "54px 20px 0",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                className="display"
                style={{
                  fontWeight: 800,
                  fontSize: 32,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  lineHeight: 1.05,
                }}
              >
                Els meus viatges
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {trips.length} viatges
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="pl-tap"
              style={{
                height: 44,
                padding: "0 12px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                color: "var(--text-muted)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.02em",
                marginRight: 10,
              }}
            >
              Sortir
            </button>
            <button
              onClick={() => router.push("/search")}
              className="pl-tap"
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: "var(--green)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-cta)",
                border: "none",
              }}
            >
              <Plus size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div
            className="pl-noscroll"
            style={{
              marginTop: 20,
              padding: "0 20px",
              display: "flex",
              gap: 8,
              overflowX: "auto",
            }}
          >
            {tabs.map((t) => {
              const active = t.id === filter;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className="pl-tap"
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    background: active ? "var(--text)" : "var(--surface)",
                    color: active ? "#fff" : "var(--text-muted)",
                    border: active
                      ? "1px solid var(--text)"
                      : "1px solid var(--border)",
                    transition: "all 200ms var(--ease)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}{" "}
                  <span style={{ opacity: 0.7, marginLeft: 4 }}>[{t.n}]</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "0 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {visible.length === 0 ? (
              <EmptyState onAdd={() => router.push("/search")} />
            ) : (
              visible.map((t) => (
                <TripCard
                  key={t.id}
                  trip={t}
                  fav={favs.has(t.id)}
                  onFav={() => toggleFav(t.id)}
                  onOpen={() => setOpenTrip(t)}
                />
              ))
            )}
          </div>
        </div>

        <BottomTabs active="trips" />
      </div>
    </div>
  );
}
