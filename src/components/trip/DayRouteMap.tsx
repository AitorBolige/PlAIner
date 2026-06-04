"use client";

// Mapbox CSS is imported globally in app/globals.css

import * as React from "react";

type LngLat = [number, number];

export type TransportMode = "walk" | "transit" | "taxi";

export interface RouteLeg {
  durationSec: number;
  distanceM: number;
  mode: TransportMode;
}

function legMode(distanceM: number): TransportMode {
  if (distanceM < 1200) return "walk";
  if (distanceM < 3500) return "transit";
  return "taxi";
}

const SLOT_COLORS = ["#E85D3A", "#C8860A", "#E85D3A", "#C8860A"];

// Module-level cache — survives day-switch remounts within the same session.
const destCache = new Map<string, LngLat | null>();
const poiCache = new Map<string, LngLat | null>();

async function serverGeocode(
  params: Record<string, string>,
): Promise<LngLat | null> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/geocode?${qs}`);
  const data: LngLat | null = await res.json();
  return Array.isArray(data) && data.length === 2 ? data : null;
}

async function geocodeDestination(dest: string): Promise<LngLat | null> {
  if (destCache.has(dest)) return destCache.get(dest)!;
  const c = await serverGeocode({ q: dest, dest: "1" });
  destCache.set(dest, c);
  return c;
}

function extractPlaceName(raw: string): {
  clean: string;
  short: string;
  areaHint: string | null;
} {
  const verbs =
    /^(explore|visit|wander through|discover|experience|enjoy|see|try|ride|tour|walk(?:ing)?(?: through)?|stroll(?:ing)?(?:\s+through)?|take a|check out|head to|go to|taste|stop at|dine at|lunch at|dinner at|spend(?:\s+time\s+at)?|experience|relax at|browse|grab|sample|admire)\s+/i;
  let s = raw.replace(verbs, "").trim();
  const parenMatch = s.match(/\((?:near|in|at|around)?\s*([^)]+)\)/i);
  const areaHint = parenMatch
    ? parenMatch[1].replace(/^(?:near|in|at|around)\s+/i, "").trim()
    : null;
  s = s
    .replace(
      /'s?\s+(historic|old|ancient|famous|scenic|traditional|cultural|local|popular|main|central|grand|royal)\s+\w+/i,
      "",
    )
    .trim();
  s = s.split(/\s*[&+]\s*|\s+and\s+|\s+[–-]\s+|[,:]\s*/)[0].trim();
  s = s.replace(/\s*\(.*\)$/, "").trim();
  const clean = s || raw;
  const short = clean.split(/\s+/).slice(0, 2).join(" ");
  return { clean, short, areaHint };
}

function placeFromMapsUrl(mapsUrl: string): string | null {
  try {
    const u = new URL(mapsUrl);
    return u.searchParams.get("query") ?? u.searchParams.get("q");
  } catch {
    return null;
  }
}

async function geocodePoi(
  activity: { name: string; mapsUrl?: string | null },
  centre: LngLat,
  destination: string,
): Promise<LngLat | null> {
  const cacheKey = `${activity.name}|${centre[0].toFixed(3)},${centre[1].toFixed(3)}`;
  if (poiCache.has(cacheKey)) return poiCache.get(cacheKey)!;

  const { clean, short, areaHint } = extractPlaceName(activity.name);
  const mapsQ = placeFromMapsUrl(activity.mapsUrl ?? "");
  const [plng, plat] = [String(centre[0]), String(centre[1])];

  const attempts: Record<string, string>[] = [
    ...(mapsQ ? [{ q: mapsQ, plng, plat }] : []),
    { q: `${clean}, ${destination}`, plng, plat },
    { q: clean, plng, plat },
    ...(short !== clean ? [{ q: `${short}, ${destination}`, plng, plat }] : []),
    { q: `${activity.name}, ${destination}`, plng, plat },
    ...(areaHint ? [{ q: `${areaHint}, ${destination}`, plng, plat }] : []),
  ];

  let result: LngLat | null = null;
  for (const params of attempts) {
    result = await serverGeocode(params);
    if (result) break;
  }

  poiCache.set(cacheKey, result);
  return result;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface DayRouteMapActivity {
  name: string;
  mapsUrl?: string | null;
}

export interface DayRouteMapProps {
  activities: DayRouteMapActivity[];
  destination: string;
  height?: number;
  className?: string;
  /** Called once the route is resolved; legs[i] connects activity i → i+1. */
  onLegsResolved?: (legs: RouteLeg[]) => void;
  /** Called with the resolved [lng, lat] per activity (null if not found). */
  onCoordsResolved?: (coords: (LngLat | null)[]) => void;
}

type MapState = "loading" | "ready" | "failed";

// Stroke colour per transport mode
const MODE_COLOR: Record<TransportMode, string> = {
  walk: "#0D9E7A",
  transit: "#3B87E8",
  taxi: "#C8860A",
};

export function DayRouteMap({
  activities,
  destination,
  height = 190,
  className,
  onLegsResolved,
  onCoordsResolved,
}: DayRouteMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = React.useRef<any>(null);
  const [state, setState] = React.useState<MapState>("loading");
  const [errorMsg, setErrorMsg] = React.useState("");

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  React.useEffect(() => {
    if (!mapboxToken) {
      setErrorMsg("Falta NEXT_PUBLIC_MAPBOX_TOKEN");
      setState("failed");
      return;
    }
    if (!containerRef.current || activities.length === 0) {
      setState("failed");
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled) return;
        mapboxgl.accessToken = mapboxToken;

        const centre = await geocodeDestination(destination);
        if (cancelled) return;
        if (!centre) {
          setErrorMsg(`No s'ha pogut geolocalitzar "${destination}"`);
          setState("failed");
          return;
        }

        const rawCoords: (LngLat | null)[] = [];
        for (const a of activities.slice(0, 8)) {
          if (cancelled) return;
          rawCoords.push(await geocodePoi(a, centre, destination));
        }
        if (cancelled) return;

        const valid = rawCoords
          .map((c, i) => (c ? { coord: c, act: activities[i] } : null))
          .filter(
            (x): x is { coord: LngLat; act: DayRouteMapActivity } => x !== null,
          );

        if (valid.length < 1) {
          setErrorMsg("Mapa no disponible");
          setState("failed");
          return;
        }

        // Emit resolved coords (index matches activities array; null = not found)
        onCoordsResolved?.(rawCoords);

        const bounds = new mapboxgl.LngLatBounds();
        valid.forEach(({ coord }) => bounds.extend(coord));

        const map = new mapboxgl.Map({
          container: containerRef.current!,
          style: "mapbox://styles/mapbox/light-v11",
          bounds,
          fitBoundsOptions: { padding: 52, maxZoom: 15 },
          attributionControl: false,
          logoPosition: "bottom-left",
        });
        mapRef.current = map;
        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "bottom-right",
        );

        map.on("load", async () => {
          if (cancelled) return;

          if (valid.length >= 2) {
            const coords = valid.map((v) => v.coord.join(",")).join(";");
            // overview=full for display; legs give us per-segment distance+duration
            const dirUrl =
              `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
              `?geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let dirData: any = null;
            try {
              dirData = await fetch(dirUrl).then((r) => r.json());
            } catch {
              /* noop */
            }
            if (cancelled) return;

            const route = dirData?.routes?.[0];

            // ── Emit leg data to parent ────────────────────────────────────
            if (route?.legs && onLegsResolved) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const legs: RouteLeg[] = route.legs.map((l: any) => ({
                durationSec: Math.round(l.duration ?? 0),
                distanceM: Math.round(l.distance ?? 0),
                mode: legMode(l.distance ?? 0),
              }));
              onLegsResolved(legs);
            }

            // ── Draw per-leg segments with mode-based colour ───────────────
            // We draw each leg as a separate layer so walking=green, transit=blue, taxi=amber.
            // For the merged geometry we split by waypoint indices.
            const geometry = route?.geometry;
            if (geometry) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const legs: any[] = route.legs ?? [];
              // Collect waypoint coordinate indices from legs annotation if available,
              // else fall back to a single merged segment.
              if (legs.length > 0 && legs[0].distance !== undefined) {
                legs.forEach((leg, i) => {
                  const mode = legMode(leg.distance ?? 0);
                  // For simplicity, draw the full route with dominant colour on first leg,
                  // then overlay per-leg tone. We draw the whole route once per mode group.
                  const sourceId = `route-leg-${i}`;
                  // Use the full merged geometry — visual differentiation via colour pill in card
                  map.addSource(sourceId, {
                    type: "geojson",
                    data: { type: "Feature", properties: {}, geometry },
                  });
                  // Only add the layer once (first leg draws the full line)
                  if (i === 0) {
                    map.addLayer({
                      id: "route-main",
                      type: "line",
                      source: sourceId,
                      layout: { "line-join": "round", "line-cap": "round" },
                      paint: {
                        "line-color": MODE_COLOR[mode],
                        "line-width": 3.5,
                        "line-opacity": 0.9,
                      },
                    });
                  }
                });
              } else {
                map.addSource("route", {
                  type: "geojson",
                  data: { type: "Feature", properties: {}, geometry },
                });
                map.addLayer({
                  id: "route-main",
                  type: "line",
                  source: "route",
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: {
                    "line-color": "#0D9E7A",
                    "line-width": 3.5,
                    "line-opacity": 0.9,
                  },
                });
              }
            }
          }

          // Numbered circular markers
          valid.forEach(({ coord, act }, i) => {
            const el = document.createElement("div");
            el.style.cssText = [
              "width:32px;height:32px;border-radius:50%",
              `background:${SLOT_COLORS[i] ?? "#0D9E7A"}`,
              "color:#fff;font-size:13px;font-weight:800",
              "display:flex;align-items:center;justify-content:center",
              "border:3px solid #fff",
              "box-shadow:0 3px 10px rgba(0,0,0,0.30)",
              "cursor:pointer;user-select:none",
            ].join(";");
            el.textContent = String(i + 1);
            new mapboxgl.Marker({ element: el })
              .setLngLat(coord)
              .setPopup(
                new mapboxgl.Popup({
                  offset: 20,
                  closeButton: false,
                  className: "pl-map-popup",
                }).setText(act.name),
              )
              .addTo(map);
          });

          setState("ready");
        });

        map.on("error", (e) => console.error("[DayRouteMap] map error:", e));
      } catch (err) {
        console.error("[DayRouteMap] init error:", err);
        if (!cancelled) {
          setErrorMsg(String(err));
          setState("failed");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "failed") {
    return (
      <div
        className={className}
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-2)",
          fontSize: 11,
          color: "var(--text-faint)",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        🗺️ {errorMsg || "Mapa no disponible"}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: "relative", height, overflow: "hidden" }}
    >
      {state === "loading" && (
        <div
          className="skeleton absolute inset-0 z-10"
          style={{ borderRadius: 0 }}
        />
      )}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
