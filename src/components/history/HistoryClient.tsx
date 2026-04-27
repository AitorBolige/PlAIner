"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Heart, MapPin, Plus } from "lucide-react";

import { getDestinationImage } from "@/lib/destinations";

type TripLite = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
  isFavorite: boolean;
};

type TabFilter = "all" | "upcoming" | "past" | "favorites";

function euro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ca-ES", {
    day: "2-digit",
    month: "short",
  });
}

export function HistoryClient({ trips }: { trips: TripLite[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabFilter>("all");

  const now = React.useMemo(() => new Date(), []);

  const tabs = React.useMemo(() => {
    const upcoming = trips.filter((t) => new Date(t.startDate) > now).length;
    const past = trips.filter((t) => new Date(t.endDate) < now).length;
    const favorites = trips.filter((t) => t.isFavorite).length;
    return [
      { id: "all" as const, label: "Tots", count: trips.length },
      { id: "upcoming" as const, label: "Pròxims", count: upcoming },
      { id: "past" as const, label: "Passats", count: past },
      { id: "favorites" as const, label: "Favorits", count: favorites },
    ];
  }, [now, trips]);

  const filtered = React.useMemo(() => {
    if (activeTab === "upcoming") return trips.filter((t) => new Date(t.startDate) > now);
    if (activeTab === "past") return trips.filter((t) => new Date(t.endDate) < now);
    if (activeTab === "favorites") return trips.filter((t) => t.isFavorite);
    return trips;
  }, [activeTab, now, trips]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", paddingBottom: "100px" }}>
      <div style={{ padding: "56px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              {trips.length} {trips.length === 1 ? "viatge" : "viatges"}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Els meus viatges
            </h1>
          </div>
          <button
            onClick={() => router.push("/search")}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--green)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-cta)",
              color: "#fff",
            }}
            aria-label="Nou viatge"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "0 20px 20px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "36px",
              padding: "0 14px",
              borderRadius: "var(--r-pill)",
              border: activeTab === tab.id ? "none" : "1px solid var(--border-md)",
              background: activeTab === tab.id ? "var(--text)" : "var(--surface)",
              color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms var(--ease)",
            }}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "var(--r-pill)",
                  background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "var(--surface-2)",
                  color: activeTab === tab.id ? "#fff" : "var(--text-faint)",
                }}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--green-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <MapPin size={28} color="var(--green)" />
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
              {activeTab === "favorites" ? "Cap favorit encara" : "Comença el teu primer viatge"}
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                maxWidth: "280px",
                lineHeight: 1.5,
                marginBottom: "24px",
              }}
            >
              {activeTab === "favorites"
                ? "Marca viatges com a favorits tocant el cor a qualsevol viatge."
                : "Configura el teu destí i deixa que la IA construeixi el pla perfecte."}
            </p>
            {activeTab !== "favorites" ? (
              <button
                onClick={() => router.push("/search")}
                style={{
                  height: "48px",
                  padding: "0 24px",
                  background: "var(--green)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  boxShadow: "var(--shadow-cta)",
                  cursor: "pointer",
                }}
              >
                Planifica un viatge
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((trip) => <TripHistoryCard key={trip.id} trip={trip} />)
        )}
      </div>
    </div>
  );

  function TripHistoryCard({ trip }: { trip: TripLite }) {
    const [isFav, setIsFav] = React.useState(trip.isFavorite);
    const isUpcoming = new Date(trip.startDate) > now;
    const isPast = new Date(trip.endDate) < now;
    const heroImg = getDestinationImage(trip.destination, "hero");

    const statusConfig = {
      upcoming: { label: "Pròximament", color: "#3B87E8", bg: "rgba(59,135,232,0.12)" },
      past: { label: "Completat", color: "#0D9E7A", bg: "rgba(13,158,122,0.12)" },
      active: { label: "En curs", color: "#C8860A", bg: "rgba(200,134,10,0.12)" },
    } as const;
    const status = isUpcoming ? "upcoming" : isPast ? "past" : "active";
    const cfg = statusConfig[status];

    const toggleFavorite = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFav((f) => !f);
      await fetch(`/api/trips/${trip.id}/favorite`, { method: "POST" }).catch(() => null);
    };

    return (
      <div
        onClick={() => router.push(`/trip/${trip.id}`)}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          transition: "transform 200ms var(--ease), box-shadow 200ms var(--ease)",
        }}
      >
        <div style={{ height: "160px", position: "relative", overflow: "hidden" }}>
          <Image src={heroImg} alt={trip.destination} fill sizes="(max-width: 768px) 100vw, 480px" style={{ objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: cfg.bg,
              color: cfg.color,
              backdropFilter: "blur(8px)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {cfg.label}
          </div>
          <button
            onClick={toggleFavorite}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.90)",
              backdropFilter: "blur(8px)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label={isFav ? "Treure de favorits" : "Afegir a favorits"}
          >
            <Heart size={16} fill={isFav ? "#E85D3A" : "none"} color={isFav ? "#E85D3A" : "#888"} />
          </button>
          <div style={{ position: "absolute", bottom: "12px", left: "14px" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {trip.destination}
            </h3>
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={13} color="var(--text-faint)" />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                  marginBottom: "2px",
                }}
              >
                Cost total
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text)",
                  letterSpacing: "-0.02em",
                }}
              >
                {euro(trip.totalCost)}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--green)", fontSize: "13px", fontWeight: 600 }}>
              Veure detall <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

