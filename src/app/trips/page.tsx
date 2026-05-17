"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Heart, Loader2, Map, MapPin, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { signOut } from "next-auth/react";

import { getDestinationImage } from "@/lib/destinations";

/* ── Types ── */
type SavedTrip = {
  id: string;
  destination: string;
  country: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  people: number;
  totalCost: number;
  flightCost: number;
  hotelCost: number;
  activitiesCost: number;
  dailyCost: number;
  status: string;
  isFavorite: boolean;
  isSurprise: boolean;
  createdAt: string;
  search?: {
    id: string;
    destination: string;
    status: string;
    refreshedAt: string | null;
    expiresAt: string | null;
  } | null;
};

/* ── Helpers ── */
function useAppShellBody() {
  React.useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ca-ES", { day: "2-digit", month: "short" });
}

function diffDays(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000));
}

function tripImage(trip: SavedTrip) {
  return trip.imageUrl || getDestinationImage(trip.destination, "hero");
}

function HeroImg({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

/* ── Bottom Tabs ── */
function BottomTabs({ active }: { active: "search" | "trips" }) {
  const Tab = ({ id, icon, label, href }: { id: "search" | "trips"; icon: React.ReactNode; label: string; href: string }) => {
    const isActive = id === active;
    return (
      <Link href={href} className="pl-tap" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: isActive ? "var(--green)" : "var(--text-faint)", padding: "8px 0", textDecoration: "none" }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500, letterSpacing: "0.01em" }}>{label}</span>
        <span style={{ width: 4, height: 4, borderRadius: 9999, background: isActive ? "var(--green)" : "transparent", marginTop: 1 }} />
      </Link>
    );
  };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 78, paddingBottom: 14, background: "rgba(247,245,242,0.92)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", maxWidth: 430, margin: "0 auto" }}>
      <Tab id="search" icon={<MapPin size={22} />} label="Cerca" href="/search" />
      <Tab id="trips" icon={<Map size={22} />} label="Viatges" href="/trips" />
    </div>
  );
}

/* ── Meta label ── */
function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
      <span style={{ color: "var(--text-faint)", display: "inline-flex" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: 9999, background: "var(--green-subtle)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <MapPin size={28} />
      </div>
      <div className="display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
        Comença el teu primer viatge
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)", maxWidth: 240 }}>
        Configura el teu destí i deixa que la IA dissenyi el viatge perfecte.
      </div>
      <button onClick={onAdd} className="pl-tap" style={{ marginTop: 22, height: 48, padding: "0 22px", borderRadius: 9999, background: "var(--green)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, boxShadow: "var(--shadow-cta)", border: "none" }}>
        Planifica un viatge
      </button>
    </div>
  );
}

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={32} style={{ color: "var(--green)", animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Carregant els teus viatges…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ── Trip Card ── */
function TripCard({ trip, onFav, onOpen, onDelete }: { trip: SavedTrip; onFav: () => void; onOpen: () => void; onDelete: () => void }) {
  const now = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const isUpcoming = start > now;
  const statusBadge = isUpcoming
    ? { bg: "rgba(59,135,232,0.95)", label: "Pròximament" }
    : end < now
      ? { bg: "rgba(13,158,122,0.95)", label: "Completat" }
      : { bg: "rgba(200,134,10,0.95)", label: "En curs" };
  const days = diffDays(trip.startDate, trip.endDate);

  return (
    <button onClick={onOpen} className="pl-tap" style={{ background: "#fff", borderRadius: 24, boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", overflow: "hidden", textAlign: "left", width: "100%", padding: 0 }}>
      <div style={{ position: "relative", width: "100%", height: 160 }}>
        <HeroImg src={tripImage(trip)} alt={trip.destination} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{ background: statusBadge.bg, color: "#fff", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>{statusBadge.label}</span>
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="pl-tap" style={{ width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }} aria-label="Eliminar viatge">
            <Trash2 size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="pl-tap" style={{ width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", color: trip.isFavorite ? "var(--coral)" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }} aria-label={trip.isFavorite ? "Treure de favorits" : "Afegir a favorits"}>
            <Heart size={18} fill={trip.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        <div style={{ position: "absolute", left: 14, bottom: 12 }}>
          <div className="display" style={{ fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: "-0.025em" }}>
            {trip.destination}
          </div>
          {trip.country && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{trip.country}</div>}
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", alignItems: "flex-end", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Meta icon={<Calendar size={15} />}>
            {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)} · {days} dies
          </Meta>
          <Meta icon={<Users size={15} />}>{trip.people} persones</Meta>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="micro">COST TOTAL</div>
          <div className="display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.025em", marginTop: 2 }}>
            {trip.totalCost.toLocaleString("ca")} €
          </div>
          <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginTop: 4 }}>Veure detall →</div>
        </div>
      </div>
    </button>
  );
}

/* ── Trip Detail ── */
function TripDetail({ trip, onBack }: { trip: SavedTrip; onBack: () => void }) {
  const days = diffDays(trip.startDate, trip.endDate);

  return (
    <div className="pl-app pl-fadein" style={{ background: "var(--bg)", width: "100%", maxWidth: 430, height: "100%", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <div className="pl-noscroll" style={{ height: "100%", overflowY: "auto", paddingBottom: 40 }}>
        <div style={{ position: "relative", height: 280 }}>
          <HeroImg src={tripImage(trip)} alt={trip.destination} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)" }} />
          <button onClick={onBack} className="pl-tap" style={{ position: "absolute", top: 54, left: 16, width: 40, height: 40, borderRadius: 9999, background: "rgba(255,255,255,0.95)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", border: "none" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, color: "#fff" }}>
            {trip.country && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{trip.country}</div>}
            <div className="display" style={{ fontWeight: 800, fontSize: 36, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>
              {trip.destination}
            </div>
            <div style={{ marginTop: 6, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}>
              {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)} · {days} dies · {trip.people} persones
            </div>
          </div>
        </div>

        <div style={{ margin: "-32px 16px 0", position: "relative", zIndex: 2 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 18, boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div className="micro">COST TOTAL · TOT INCLÒS</div>
                <div className="display" style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", marginTop: 2 }}>
                  {trip.totalCost.toLocaleString("ca")} €
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{trip.people > 0 ? Math.round(trip.totalCost / trip.people).toLocaleString("ca") : trip.totalCost.toLocaleString("ca")} € per persona</div>
              </div>
              <span style={{ background: "var(--green-subtle)", color: "var(--green-deep)", padding: "4px 10px", borderRadius: 9999, fontSize: 11.5, fontWeight: 700 }}>Guardat</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 16 }}>
              {[
                { c: "var(--coral)", l: "Transport", v: trip.flightCost },
                { c: "var(--green)", l: "Allotjament", v: trip.hotelCost },
                { c: "var(--gold)", l: "Activitats", v: trip.activitiesCost },
              ].map((b, i) => (
                <div key={i} style={{ background: "var(--surface-2)", padding: "10px 10px", borderRadius: 12 }}>
                  <span style={{ color: b.c, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>{b.l}</span>
                  <div className="display" style={{ fontWeight: 700, fontSize: 16, marginTop: 4, letterSpacing: "-0.015em" }}>
                    {b.v.toLocaleString("ca")} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 16px 0" }}>
          <button className="pl-tap" style={{ width: "100%", height: 56, borderRadius: 9999, background: "var(--green)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, boxShadow: "var(--shadow-cta)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "none" }}>
            <Sparkles size={18} /> Reservar tot el viatge
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Et redirigirem als nostres partners verificats</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function TripsPage() {
  useAppShellBody();
  const router = useRouter();

  const [trips, setTrips] = React.useState<SavedTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openTrip, setOpenTrip] = React.useState<SavedTrip | null>(null);
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past" | "fav">("all");

  // Fetch trips from API
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/trips");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled && data.ok) setTrips(data.trips);
      } catch {
        // silently fail — user sees empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const now = React.useMemo(() => new Date(), []);

  const counts = React.useMemo(() => ({
    all: trips.length,
    upcoming: trips.filter((t) => new Date(t.startDate) > now).length,
    past: trips.filter((t) => new Date(t.endDate) < now).length,
    fav: trips.filter((t) => t.isFavorite).length,
  }), [trips, now]);

  const visible = React.useMemo(() =>
    trips.filter((t) =>
      filter === "all" ? true
        : filter === "upcoming" ? new Date(t.startDate) > now
          : filter === "past" ? new Date(t.endDate) < now
            : filter === "fav" ? t.isFavorite
              : true,
    ),
  [trips, filter, now]);

  const toggleFav = async (id: string) => {
    // Optimistic update
    setTrips((prev) => prev.map((t) => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
    if (openTrip?.id === id) setOpenTrip((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    await fetch(`/api/trips/${id}/favorite`, { method: "POST" }).catch(() => null);
  };

  const deleteTrip = async (id: string) => {
    if (!confirm("Segur que vols eliminar aquest viatge?")) return;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/trips/${id}`, { method: "DELETE" }).catch(() => null);
  };

  if (openTrip) {
    return (
      <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
        <TripDetail trip={openTrip} onBack={() => setOpenTrip(null)} />
      </div>
    );
  }

  const tabs: { id: "all" | "upcoming" | "past" | "fav"; label: string; n: number }[] = [
    { id: "all", label: "Tots", n: counts.all },
    { id: "upcoming", label: "Pròxims", n: counts.upcoming },
    { id: "past", label: "Passats", n: counts.past },
    { id: "fav", label: "Favorits", n: counts.fav },
  ];

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <div className="pl-app pl-fadein" style={{ background: "var(--bg)", width: "100%", maxWidth: 430, height: "100%", margin: "0 auto", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="pl-noscroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
          <div style={{ padding: "54px 20px 0", display: "flex", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.05 }}>
                Els meus viatges
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{trips.length} viatges</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="pl-tap" style={{ height: 44, padding: "0 12px", borderRadius: 9999, background: "rgba(255,255,255,0.72)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", color: "var(--text-muted)", fontWeight: 800, fontSize: 12, letterSpacing: "0.02em", marginRight: 10 }}>
              Sortir
            </button>
            <button onClick={() => router.push("/search")} className="pl-tap" style={{ width: 44, height: 44, borderRadius: 9999, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-cta)", border: "none" }}>
              <Plus size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div className="pl-noscroll" style={{ marginTop: 20, padding: "0 20px", display: "flex", gap: 8, overflowX: "auto" }}>
            {tabs.map((t) => {
              const active = t.id === filter;
              return (
                <button key={t.id} onClick={() => setFilter(t.id)} className="pl-tap" style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, background: active ? "var(--text)" : "var(--surface)", color: active ? "#fff" : "var(--text-muted)", border: active ? "1px solid var(--text)" : "1px solid var(--border)", transition: "all 200ms var(--ease)", whiteSpace: "nowrap" }}>
                  {t.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>[{t.n}]</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 20, padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
              <LoadingSkeleton />
            ) : visible.length === 0 ? (
              <EmptyState onAdd={() => router.push("/search")} />
            ) : (
              visible.map((t) => (
                <TripCard
                  key={t.id}
                  trip={t}
                  onFav={() => toggleFav(t.id)}
                  onOpen={() => setOpenTrip(t)}
                  onDelete={() => deleteTrip(t.id)}
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
