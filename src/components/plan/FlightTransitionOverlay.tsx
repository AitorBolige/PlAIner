"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";

// ─── Airport lookup ───────────────────────────────────────────────────────────
const AIRPORT_COORDS: Record<string, [number, number]> = {
  BCN: [2.0785, 41.2971], MAD: [-3.5673, 40.4719], LIS: [-9.1354, 38.7742],
  LHR: [-0.4543, 51.4700], CDG: [2.5479, 49.0097], AMS: [4.7640, 52.3086],
  FCO: [12.2389, 41.7999], MXP: [8.7262, 45.6301], VIE: [16.5697, 48.1103],
  ZRH: [8.5492, 47.4647], MUC: [11.7861, 48.3537], FRA: [8.5706, 50.0333],
  DUB: [-6.2700, 53.4273], CPH: [12.6561, 55.6179], ATH: [23.9445, 37.9364],
  IST: [28.8141, 40.9769], DXB: [55.3644, 25.2532], JFK: [-73.7789, 40.6413],
  LAX: [-118.4085, 33.9425], NRT: [140.3864, 35.7647], SYD: [151.1772, -33.9461],
  PMI: [2.7388, 39.5517], TFS: [-16.5725, 28.0445], IBZ: [1.3731, 38.8729],
  SVQ: [-5.8931, 37.4180], VLC: [-0.4815, 39.4893], ALC: [-0.5582, 38.2822],
  BIO: [-2.9106, 43.3011], GRX: [-3.7774, 37.1887],
};

function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }

// Haversine distance in km
function haversineKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFlightTime(km: number): string {
  const hours = km / 850 + 0.5; // 850 km/h avg + 30min overhead
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60 / 10) * 10;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function greatCircleArc([lng1, lat1]: [number, number], [lng2, lat2]: [number, number], steps = 100): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const δ = 2 * Math.asin(Math.sqrt(
      Math.sin(toRad((lat2 - lat1) / 2)) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad((lng2 - lng1) / 2)) ** 2,
    ));
    if (δ < 0.0001) { pts.push([lng1 + (lng2 - lng1) * f, lat1 + (lat2 - lat1) * f]); continue; }
    const A = Math.sin((1 - f) * δ) / Math.sin(δ);
    const B = Math.sin(f * δ) / Math.sin(δ);
    const x = A * Math.cos(toRad(lat1)) * Math.cos(toRad(lng1)) + B * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2));
    const y = A * Math.cos(toRad(lat1)) * Math.sin(toRad(lng1)) + B * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2));
    const z = A * Math.sin(toRad(lat1)) + B * Math.sin(toRad(lat2));
    pts.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  return pts;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export interface FlightTransitionOverlayProps {
  originCode: string;
  originCity: string;
  destCity: string;
  destCoords: [number, number] | null;
  onComplete: () => void;
}

export function FlightTransitionOverlay({
  originCode,
  originCity,
  destCity,
  destCoords,
  onComplete,
}: FlightTransitionOverlayProps) {
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const planeRef = React.useRef<mapboxgl.Marker | null>(null);
  const rafRef = React.useRef<number>(0);
  const [visible, setVisible] = React.useState(true);
  const [status, setStatus] = React.useState("Preparant vol…");

  const origin: [number, number] = AIRPORT_COORDS[originCode] ?? [-3.5673, 40.4719];
  const dest: [number, number] = destCoords ?? [2.0785, 41.2971];

  const arc = React.useMemo(() => greatCircleArc(origin, dest, 120), [origin[0], dest[0]]); // eslint-disable-line
  const distKm = React.useMemo(() => haversineKm(origin, dest), [origin[0], dest[0]]); // eslint-disable-line
  const flightTime = estimateFlightTime(distKm);

  // Mid-point for initial camera + zoom level based on distance
  const midLng = lerp(origin[0], dest[0], 0.5);
  const midLat = lerp(origin[1], dest[1], 0.5) + (distKm > 5000 ? 8 : distKm > 2000 ? 4 : 2);
  const initZoom = distKm > 8000 ? 2.0 : distKm > 5000 ? 2.5 : distKm > 2000 ? 3.2 : distKm > 800 ? 4.0 : 5.0;

  React.useEffect(() => {
    if (!containerRef.current || !destCoords) return;
    if (!TOKEN) { setTimeout(() => { setVisible(false); onComplete(); }, 800); return; }

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [midLng, midLat],
      zoom: initZoom,
      pitch: 30,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      logoPosition: "bottom-left",
    });
    mapRef.current = map;

    setTimeout(() => map.resize(), 50);

    map.on("style.load", () => {
      // Origin marker
      const mkOrigin = document.createElement("div");
      mkOrigin.style.cssText = "width:13px;height:13px;border-radius:50%;background:#0D9E7A;box-shadow:0 0 0 4px rgba(13,158,122,0.25),0 2px 8px rgba(13,158,122,0.5)";
      new mapboxgl.Marker({ element: mkOrigin, anchor: "center" }).setLngLat(origin).addTo(map);

      // Dest marker (revealed on arrival)
      const mkDest = document.createElement("div");
      mkDest.style.cssText = "width:13px;height:13px;border-radius:50%;background:#18160f;box-shadow:0 0 0 4px rgba(24,22,15,0.15),0 2px 8px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.5s";
      new mapboxgl.Marker({ element: mkDest, anchor: "center" }).setLngLat(dest).addTo(map);

      // Plane marker
      const planeEl = document.createElement("div");
      planeEl.innerHTML = `<div id="pl" style="font-size:18px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 8px rgba(21,184,144,0.6))">✈</div>`;
      planeEl.style.cssText = "color:white;";
      const planeMkr = new mapboxgl.Marker({ element: planeEl, anchor: "center" }).setLngLat(arc[0]).addTo(map);
      planeRef.current = planeMkr;

      // Arc source
      map.addSource("arc", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({ id: "arc-glow", type: "line", source: "arc", paint: { "line-color": "#0D9E7A", "line-width": 10, "line-opacity": 0.18, "line-blur": 6 } });
      map.addLayer({ id: "arc-line", type: "line", source: "arc", paint: { "line-color": "#0D9E7A", "line-width": 2.5, "line-opacity": 1 } });

      setStatus("En vol");

      const FLIGHT_MS = 5000;
      let start: number | null = null;
      let completed = false;
      let lastCamUpdate = 0;

      function tick(ts: number) {
        if (completed) return;
        if (!start) start = ts;
        const t = Math.min((ts - start) / FLIGHT_MS, 1);
        const te = easeInOut(t);
        const idx = Math.min(Math.floor(te * (arc.length - 1)), arc.length - 2);
        const frac = te * (arc.length - 1) - idx;
        const lng = lerp(arc[idx][0], arc[idx + 1][0], frac);
        const lat = lerp(arc[idx][1], arc[idx + 1][1], frac);

        planeMkr.setLngLat([lng, lat]);

        (map.getSource("arc") as mapboxgl.GeoJSONSource)?.setData({
          type: "Feature", properties: {},
          geometry: { type: "LineString", coordinates: arc.slice(0, idx + 2) },
        });

        // Rotate plane toward direction of travel
        const nextIdx = Math.min(idx + 1, arc.length - 1);
        const dx = arc[nextIdx][0] - arc[idx][0];
        const dy = arc[nextIdx][1] - arc[idx][1];
        const angle = toDeg(Math.atan2(dy, dx)) - 45;
        const plIcon = planeEl.querySelector<HTMLElement>("#pl");
        if (plIcon) plIcon.style.transform = `rotate(${angle}deg)`;

        // Camera tracks the plane — update every 200ms to avoid jitter
        if (ts - lastCamUpdate > 200) {
          lastCamUpdate = ts;
          // Look slightly ahead of the plane
          const lookAhead = Math.min(idx + 8, arc.length - 1);
          const camLng = lerp(lng, arc[lookAhead][0], 0.4);
          const camLat = lerp(lat, arc[lookAhead][1], 0.4);
          // Zoom in gradually as we approach destination
          const camZoom = lerp(initZoom, initZoom + 1.5, te);
          const camPitch = lerp(25, 45, te);
          map.easeTo({
            center: [camLng, camLat],
            zoom: camZoom,
            pitch: camPitch,
            bearing: angle + 45, // camera faces direction of travel
            duration: 250,
            easing: (x) => x,
          });
        }

        if (t < 1) { rafRef.current = requestAnimationFrame(tick); return; }

        // Plane landed → vertical drop onto destination
        completed = true;
        mkDest.style.opacity = "1";
        setStatus("Aterrant…");
        planeMkr.setLngLat(dest);

        // Phase 1: pull up to high altitude above destination
        map.flyTo({
          center: dest,
          zoom: initZoom + 0.5,
          pitch: 0,
          bearing: 0,
          duration: 800,
          essential: true,
          easing: (x) => x,
        });

        // Phase 2: drop straight down with more zoom
        setTimeout(() => {
          map.flyTo({
            center: dest,
            zoom: Math.min(initZoom + 7, 13),
            pitch: 0,
            bearing: 0,
            duration: 1800,
            essential: true,
            easing: (x) => 1 - Math.pow(1 - x, 2.5),
          });
        }, 850);

        setTimeout(() => { setVisible(false); setTimeout(onComplete, 500); }, 2700);
      }

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => { cancelAnimationFrame(rafRef.current); map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: no token or no coords → skip after 1s
  React.useEffect(() => {
    if (destCoords && TOKEN) return;
    const t = setTimeout(() => { setVisible(false); setTimeout(onComplete, 300); }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destCoords]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex justify-center"
        >
          <div
            className="relative w-full max-w-[480px] overflow-hidden"
            style={{ height: "100dvh", background: "#f4f1ec" }}
          >
            {/* Mapbox fills the container */}
            <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

            {/* Top + bottom fade to PlAIner bg */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to bottom, #f4f1ec 0%, transparent 22%, transparent 72%, #f4f1ec 100%)",
            }} />

            {/* Top header */}
            <div style={{ position: "absolute", inset: "0 0 auto 0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 58, gap: 6, pointerEvents: "none" }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 24 }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "#18160f" }}>{originCity}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  style={{ color: "#0D9E7A", fontSize: 18 }}
                >✈</motion.span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "#18160f" }}>{destCity}</span>
              </motion.div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.45, duration: 0.35 }}
                style={{ height: 2, width: 36, borderRadius: 2, background: "#0D9E7A" }}
              />
            </div>

            {/* Bottom: flight time + status */}
            <div style={{ position: "absolute", inset: "auto 0 0 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 52, pointerEvents: "none" }}>
              {/* Flight time pill */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 999, padding: "9px 20px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <span style={{ fontSize: 15 }}>🕐</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0D9E7A" }}>{flightTime}</span>
                <span style={{ fontSize: 12, color: "#7a7570", fontWeight: 500 }}>vol estimat</span>
              </motion.div>

              {/* Status pill */}
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 999, padding: "5px 12px", backdropFilter: "blur(8px)",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#0D9E7A",
                  boxShadow: "0 0 5px rgba(13,158,122,0.6)",
                  animation: status === "En vol" ? "pdot 1.2s ease-in-out infinite" : "none",
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#7a7570", letterSpacing: "0.04em" }}>{status}</span>
              </motion.div>
            </div>

            <style>{`@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.5)}}`}</style>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
