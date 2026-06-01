"use client";

import * as React from "react";
import { Clock, Coins, MapPin, Footprints, TrainFront, Car, UtensilsCrossed } from "lucide-react";

import type { DayDTO } from "@/components/trip/DayAccordion";
import { DayRouteMap, type RouteLeg, type TransportMode } from "@/components/trip/DayRouteMap";

const SLOT_COLORS = ["#E85D3A", "#C8860A", "#E85D3A", "#C8860A"];
const SLOT_LABELS = ["Matí", "Dinar", "Tarda", "Sopar"];

function isRestaurant(category: string | null | undefined): boolean {
  return category === "lunch_restaurant" || category === "dinner_restaurant";
}

function buildMapsUrl(
  name: string,
  mapsUrl: string | null | undefined,
  destination: string,
  coord: [number, number] | null | undefined,
): string {
  // Search by name anchored to resolved coordinates → shows place card, not raw coords
  if (coord) {
    const q = encodeURIComponent(`${name} ${destination}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}&center=${coord[1]},${coord[0]}`;
  }
  // Gemini-provided Maps URL
  if (mapsUrl) return mapsUrl;
  // Fallback: Google Maps search with name + destination
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${destination}`)}`;
}

// ── Menu URL resolution ───────────────────────────────────────────────────────

/** Fetch the restaurant's official website via Google Places API (server-side). */
async function fetchRestaurantWebsite(
  name: string,
  destination: string,
  coord: [number, number] | null | undefined,
): Promise<string | null> {
  const params = new URLSearchParams({ name, dest: destination });
  if (coord) { params.set("lat", String(coord[1])); params.set("lng", String(coord[0])); }
  try {
    const res = await fetch(`/api/restaurant-website?${params}`);
    return await res.json();
  } catch {
    return null;
  }
}

function menuFallback(name: string, destination: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} ${destination} menu carta`)}`;
}

/**
 * Hook that resolves the best menu URL for a restaurant.
 * Returns immediately with a fallback so the button always shows,
 * then upgrades to the official website URL when Places API resolves.
 */
function useMenuUrl(
  activityId: string,
  name: string,
  storedMenuUrl: string | null | undefined,
  destination: string,
  coord: [number, number] | null | undefined,
): string {
  const fallback = menuFallback(name, destination);
  const [url, setUrl] = React.useState<string>(storedMenuUrl ?? fallback);

  React.useEffect(() => {
    if (storedMenuUrl) { setUrl(storedMenuUrl); return; }
    fetchRestaurantWebsite(name, destination, coord).then((w) => {
      setUrl(w ?? fallback);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, !!coord]);

  return url;
}

function euro(v: number) {
  return `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;
}

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

function fmtDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

// Realistic start times per slot index (morning, lunch, afternoon, dinner)
const SLOT_DEFAULT_TIMES = ["09:00", "13:00", "16:30", "20:00"];

/** Parse any time-like string to "HH:MM". Returns null if unrecognisable. */
function parseTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Already HH:MM or H:MM
  let m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    const h = parseInt(m[1]) % 24;
    const min = parseInt(m[2]) % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  // "9h", "9h30", "9 h 30"
  m = raw.match(/^(\d{1,2})\s*h\s*(\d{0,2})/i);
  if (m) {
    const h = parseInt(m[1]) % 24;
    const min = m[2] ? parseInt(m[2]) % 60 : 0;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  // "9:00 AM/PM"
  m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m) {
    let h = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    const pm = m[3].toLowerCase() === "pm";
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h % 24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return null;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Add minutes to a "HH:MM" string. Returns null if input is invalid. */
function addMinutes(time: string | null | undefined, minutes: number): string | null {
  const t = parseTime(time);
  if (!t) return null;
  const [hStr, mStr] = t.split(":");
  const total = parseInt(hStr) * 60 + parseInt(mStr) + minutes;
  const h = Math.floor(total / 60) % 24;
  const min = total % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// ── Travel connector between activity cards ───────────────────────────────────

const MODE_CONFIG: Record<TransportMode, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  walk:    { icon: <Footprints size={13} />, label: "a peu",         color: "#0D9E7A", bg: "rgba(13,158,122,0.08)" },
  transit: { icon: <TrainFront size={13} />, label: "metro / bus",   color: "#3B87E8", bg: "rgba(59,135,232,0.08)" },
  taxi:    { icon: <Car        size={13} />, label: "taxi / vehicle", color: "#C8860A", bg: "rgba(200,134,10,0.08)" },
};

function TravelConnector({
  leg,
  departAt,
  arriveAt,
  freeMin,
  nextSlotAt,
}: {
  leg: RouteLeg;
  departAt: string;
  arriveAt: string;
  freeMin: number;
  nextSlotAt: string;
}) {
  const cfg = MODE_CONFIG[leg.mode];
  return (
    <div className="flex items-stretch gap-3 px-1">
      {/* Vertical timeline */}
      <div className="flex w-9 flex-col items-center">
        <div style={{ width: 2, flex: 1, background: "var(--border-md)", borderRadius: 1 }} />
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}33` }}
        >
          {cfg.icon}
        </div>
        <div style={{ width: 2, flex: 1, background: "var(--border-md)", borderRadius: 1 }} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 py-2">
        {/* Transport row */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: cfg.color, fontWeight: 700 }}>{fmtDuration(leg.durationSec)}</span>
          <span>·</span>
          <span>{fmtDistance(leg.distanceM)}</span>
          <span>·</span>
          <span style={{ fontWeight: 600 }}>{cfg.label}</span>
        </div>
        {/* Departure → Arrival (real travel times) */}
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
          <span>Surt <strong style={{ color: "var(--text-muted)" }}>{departAt}</strong></span>
          <span style={{ opacity: 0.5 }}>→</span>
          <span>Arriba <strong style={{ color: "var(--text-muted)" }}>{arriveAt}</strong></span>
        </div>
        {/* Free time gap (if >5 min between arrival and next slot) */}
        {freeMin > 5 && (
          <div
            className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
          >
            ☕ {fmtDuration(freeMin * 60)} lliures fins les {nextSlotAt}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity card (own component so hooks work inside .map) ──────────────────

interface ActivityCardProps {
  activity: DayDTO["activities"][number];
  index: number;
  color: string;
  label: string;
  time: string;
  coord: [number, number] | null | undefined;
  destination: string;
}

function ActivityCard({ activity, index, color, label, time, coord, destination }: ActivityCardProps) {
  const rest    = isRestaurant(activity.category);
  const menuUrl = useMenuUrl(activity.id, activity.name, activity.menuUrl, destination, coord);

  return (
    <div className="overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface shadow-[var(--shadow-xs)]">
      <div className="flex items-start gap-3 p-4">
        <span
          className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: color, boxShadow: `0 2px 8px ${color}55` }}
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
              {label}
            </span>
            {time && (
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${color}18`, color }}>
                {time}
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[15px] font-semibold leading-snug text-text">{activity.name}</p>

          {activity.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{activity.description}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted">
            {activity.duration ? (
              <span className="inline-flex items-center gap-1"><Clock size={11} />{activity.duration} min</span>
            ) : null}
            <span className="inline-flex items-center gap-1"><Coins size={11} />{euro(activity.cost)}</span>

            <a
              href={buildMapsUrl(activity.name, activity.mapsUrl, destination, coord)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: "var(--green)" }}
            >
              <MapPin size={11} />Veure al mapa
            </a>

            {rest && (
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold"
                style={{ color: "var(--coral)" }}
              >
                <UtensilsCrossed size={11} />Veure menú
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TripItineraryViewProps {
  days: DayDTO[];
  destination: string;
}

export function TripItineraryView({ days, destination }: TripItineraryViewProps) {
  const sorted = React.useMemo(
    () => [...days].sort((a, b) => a.dayNumber - b.dayNumber),
    [days],
  );

  const [selectedDayNum, setSelectedDayNum] = React.useState(sorted[0]?.dayNumber ?? 1);
  const [legs,   setLegs]   = React.useState<RouteLeg[]>([]);
  const [coords, setCoords] = React.useState<([number, number] | null)[]>([]);

  const day = sorted.find((d) => d.dayNumber === selectedDayNum) ?? sorted[0];
  if (!day) return null;

  const activitiesSorted = [...day.activities].sort((a, b) => a.order - b.order);

  // Build scheduled times cascading forward from slot defaults.
  // Each slot has a realistic baseline; we only advance, never go back.
  const scheduledTimes: string[] = [];
  let cursor: string | null = null;

  for (let i = 0; i < activitiesSorted.length; i++) {
    const slotDefault = SLOT_DEFAULT_TIMES[i] ?? SLOT_DEFAULT_TIMES[SLOT_DEFAULT_TIMES.length - 1];
    // Use parsed startTime if valid, else keep cascaded cursor, else use slot default
    const parsed = parseTime(activitiesSorted[i].startTime);
    if (parsed) {
      cursor = parsed;
    } else if (!cursor) {
      cursor = slotDefault;
    }
    // Never go earlier than the slot's default time (prevents lunch at 09:15, etc.)
    const slotMin = timeToMinutes(slotDefault);
    const curMin  = timeToMinutes(cursor);
    if (curMin < slotMin) cursor = slotDefault;

    scheduledTimes.push(cursor);
    const durMin    = activitiesSorted[i].duration || 60;
    const travelMin = legs[i] ? Math.round(legs[i].durationSec / 60) : 0;
    cursor = addMinutes(cursor, durMin + travelMin) ?? cursor;
  }

  return (
    <div className="grid gap-4">
      {/* ── Map ── */}
      <div className="overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface shadow-[var(--shadow-md)]">
        <DayRouteMap
          key={`${destination}-day-${day.dayNumber}`}
          activities={activitiesSorted}
          destination={destination}
          height={260}
          onLegsResolved={setLegs}
          onCoordsResolved={setCoords}
        />
      </div>

      {/* ── Day selector (outside map card so overflow-hidden doesn't clip scroll) ── */}
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sorted.map((d) => {
          const active = d.dayNumber === selectedDayNum;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => { setSelectedDayNum(d.dayNumber); setLegs([]); setCoords([]); }}
              className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200"
              style={{
                background: active ? "var(--text)" : "var(--surface)",
                color: active ? "#fff" : "var(--text-muted)",
                border: `1.5px solid ${active ? "transparent" : "var(--border-md)"}`,
                boxShadow: active ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
              }}
            >
              Dia {d.dayNumber}
            </button>
          );
        })}
      </div>

      {/* ── Day heading ── */}
      <div className="px-1">
        <p className="micro">DIA {day.dayNumber}</p>
        <h3 className="display mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-text">
          {day.title}
        </h3>
      </div>

      {/* ── Activity cards + travel connectors ── */}
      <div className="grid">
        {activitiesSorted.map((activity, i) => {
          const color     = SLOT_COLORS[i] ?? "#0D9E7A";
          const label     = SLOT_LABELS[i] ?? `Activitat ${i + 1}`;
          const time      = scheduledTimes[i];
          const leg       = legs[i];
          const departAt  = addMinutes(scheduledTimes[i], activity.duration || 60) ?? "";
          const travelMin = leg ? Math.round(leg.durationSec / 60) : 0;
          const arriveAt  = addMinutes(departAt, travelMin) ?? "";
          const nextSlotAt = scheduledTimes[i + 1] ?? "";
          const freeMin   = arriveAt && nextSlotAt
            ? Math.max(0, timeToMinutes(nextSlotAt) - timeToMinutes(arriveAt))
            : 0;

          return (
            <React.Fragment key={activity.id}>
              <ActivityCard
                activity={activity}
                index={i}
                color={color}
                label={label}
                time={time}
                coord={coords[i] ?? null}
                destination={destination}
              />

              {/* Travel connector to next activity */}
              {leg && i < activitiesSorted.length - 1 && (
                <TravelConnector
                  leg={leg}
                  departAt={departAt}
                  arriveAt={arriveAt}
                  freeMin={freeMin}
                  nextSlotAt={nextSlotAt}
                />
              )}
            </React.Fragment>
          );
        })}

        {activitiesSorted.length === 0 && (
          <div className="rounded-[var(--r-lg)] border border-dashed border-border p-6 text-center text-sm text-muted">
            Encara no hi ha activitats per a aquest dia.
          </div>
        )}
      </div>
    </div>
  );
}
