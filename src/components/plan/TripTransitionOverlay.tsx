"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import type { Offer, OfferMetadata } from "@/components/plan/PlanProvider";

// ─── Airport → coords + city name ────────────────────────────────────────────
const AIRPORTS: Record<string, { coords: [number, number]; city: string }> = {
  BCN: { coords: [2.0785, 41.2971],    city: "Barcelona"   },
  MAD: { coords: [-3.5673, 40.4719],   city: "Madrid"      },
  LIS: { coords: [-9.1354, 38.7742],   city: "Lisboa"      },
  LHR: { coords: [-0.4543, 51.4700],   city: "Londres"     },
  CDG: { coords: [2.5479, 49.0097],    city: "París"       },
  AMS: { coords: [4.7640, 52.3086],    city: "Amsterdam"   },
  FCO: { coords: [12.2389, 41.7999],   city: "Roma"        },
  MXP: { coords: [8.7262, 45.6301],    city: "Milà"        },
  VIE: { coords: [16.5697, 48.1103],   city: "Viena"       },
  ZRH: { coords: [8.5492, 47.4647],    city: "Zuric"       },
  MUC: { coords: [11.7861, 48.3537],   city: "Munic"       },
  FRA: { coords: [8.5706, 50.0333],    city: "Frankfurt"   },
  DUB: { coords: [-6.2700, 53.4273],   city: "Dublín"      },
  CPH: { coords: [12.6561, 55.6179],   city: "Copenhaguen" },
  ATH: { coords: [23.9445, 37.9364],   city: "Atenes"      },
  IST: { coords: [28.8141, 40.9769],   city: "Istanbul"    },
  DXB: { coords: [55.3644, 25.2532],   city: "Dubai"       },
  JFK: { coords: [-73.7789, 40.6413],  city: "Nova York"   },
  LAX: { coords: [-118.4085, 33.9425], city: "Los Angeles" },
  NRT: { coords: [140.3864, 35.7647],  city: "Tòquio"      },
  SYD: { coords: [151.1772, -33.9461], city: "Sydney"      },
  PMI: { coords: [2.7388, 39.5517],    city: "Palma"       },
  TFS: { coords: [-16.5725, 28.0445],  city: "Tenerife"    },
  IBZ: { coords: [1.3731, 38.8729],    city: "Eivissa"     },
  SVQ: { coords: [-5.8931, 37.4180],   city: "Sevilla"     },
  VLC: { coords: [-0.4815, 39.4893],   city: "València"    },
  ALC: { coords: [-0.5582, 38.2822],   city: "Alacant"     },
  BIO: { coords: [-2.9106, 43.3011],   city: "Bilbao"      },
  GRX: { coords: [-3.7774, 37.1887],   city: "Granada"     },
  BRU: { coords: [4.4844, 50.9008],    city: "Brussel·les" },
  HEL: { coords: [24.9630, 60.3183],   city: "Hèlsinki"    },
  OSL: { coords: [11.1004, 60.1939],   city: "Oslo"        },
  ARN: { coords: [17.9186, 59.6519],   city: "Estocolm"    },
  WAW: { coords: [20.9679, 52.1657],   city: "Varsòvia"    },
  PRG: { coords: [14.2600, 50.1008],   city: "Praga"       },
  BUD: { coords: [19.2556, 47.4298],   city: "Budapest"    },
  DEN: { coords: [-104.6737, 39.8561], city: "Denver"      },
  ORD: { coords: [-87.9048, 41.9742],  city: "Chicago"     },
  MIA: { coords: [-80.2870, 25.7959],  city: "Miami"       },
  GRU: { coords: [-46.4731, -23.4356], city: "São Paulo"   },
  EZE: { coords: [-58.5358, -34.8222], city: "Buenos Aires"},
  BOG: { coords: [-74.1469, 4.7016],   city: "Bogotà"      },
  MEX: { coords: [-99.0721, 19.4363],  city: "Mèxic DF"    },
  JNB: { coords: [28.2460, -26.1367],  city: "Johannesburg"},
  CAI: { coords: [31.4056, 30.1219],   city: "El Caire"    },
  SIN: { coords: [103.9915, 1.3644],   city: "Singapur"    },
  HKG: { coords: [113.9145, 22.3080],  city: "Hong Kong"   },
  PEK: { coords: [116.5974, 40.0799],  city: "Pequín"      },
  BKK: { coords: [100.7501, 13.6811],  city: "Bangkok"     },
  DEL: { coords: [77.1025, 28.5562],   city: "Nova Delhi"  },
  DPS: { coords: [115.1670, -8.7482],  city: "Bali"        },
  CGK: { coords: [106.6559, -6.1256],  city: "Jakarta"     },
  KUL: { coords: [101.7098, 2.7456],   city: "Kuala Lumpur"},
  MNL: { coords: [121.0200, 14.5086],  city: "Manila"      },
  SVO: { coords: [37.4146, 55.9726],   city: "Moscou"      },
};

// Fallback: IATA code → coords (for unknown codes)
function airportCoords(code: string): [number, number] {
  return AIRPORTS[code]?.coords ?? [-3.5673, 40.4719];
}
function airportCity(code: string): string {
  return AIRPORTS[code]?.city ?? code;
}

// ─── Math helpers ─────────────────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function haversineKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFlightTime(km: number): string {
  const h = Math.floor(km / 850 + 0.5);
  const m = Math.round(((km / 850 + 0.5) - h) * 60 / 10) * 10;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function greatCircleArc([lng1, lat1]: [number, number], [lng2, lat2]: [number, number], steps = 120): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const f = i / steps;
    const δ = 2 * Math.asin(Math.sqrt(
      Math.sin(toRad((lat2 - lat1) / 2)) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad((lng2 - lng1) / 2)) ** 2,
    ));
    if (δ < 0.0001) return [lng1 + (lng2 - lng1) * f, lat1 + (lat2 - lat1) * f] as [number, number];
    const A = Math.sin((1 - f) * δ) / Math.sin(δ), B = Math.sin(f * δ) / Math.sin(δ);
    const x = A * Math.cos(toRad(lat1)) * Math.cos(toRad(lng1)) + B * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2));
    const y = A * Math.cos(toRad(lat1)) * Math.sin(toRad(lng1)) + B * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2));
    const z = A * Math.sin(toRad(lat1)) + B * Math.sin(toRad(lat2));
    return [toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))] as [number, number];
  });
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
type Phase = "flying" | "city" | "hotel-select" | "hotel-zoom" | "done";

export interface TripTransitionOverlayProps {
  /** The flight offer selected by the user. Metadata fields drive the animation. */
  flightOffer?: Offer | null;
  /** IATA code fallback when flightOffer.metadata.originCode is absent. */
  originCode: string;
  destCity: string;
  /** Geocoded destination coords (used when metadata.destCode is absent). */
  destCoords: [number, number] | null;
  hotels: Offer[];
  onHotelSelected: (hotel: Offer) => void;
  onComplete: () => void;
}

export function TripTransitionOverlay({
  flightOffer, originCode, destCity, destCoords,
  hotels, onHotelSelected, onComplete,
}: TripTransitionOverlayProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const planeRef = React.useRef<mapboxgl.Marker | null>(null);
  const pinRef = React.useRef<mapboxgl.Marker | null>(null);
  const rafRef = React.useRef<number>(0);
  const planeElRef = React.useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = React.useState<Phase>("flying");
  const [visible, setVisible] = React.useState(true);
  const [flightStatus, setFlightStatus] = React.useState("En vol");
  const [selectedHotel, setSelectedHotel] = React.useState<Offer | null>(null);

  // ── Derive flight parameters: prefer real metadata, fall back to IATA lookup ─
  const meta: OfferMetadata = flightOffer?.metadata ?? {};
  const realOriginCode = meta.originCode ?? originCode;
  const realDestCode   = meta.destCode ?? null;

  const origin: [number, number] = airportCoords(realOriginCode);
  const resolvedOriginCity = airportCity(realOriginCode);

  // Destination coords: real destCode airport > geocoded city > default
  const dest: [number, number] = (() => {
    if (realDestCode) return airportCoords(realDestCode);
    return destCoords ?? [2.0785, 41.2971];
  })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const arc = React.useMemo(() => greatCircleArc(origin, dest), [origin[0], origin[1], dest[0], dest[1]]);
  const distKm = haversineKm(origin, dest);

  // Flight time: real metadata > estimated from distance
  const flightTime = meta.durationMinutes
    ? formatMinutes(meta.durationMinutes)
    : estimateFlightTime(distKm);

  // Stop info label
  const stopLabel = meta.stops != null
    ? meta.stops === 0
      ? "Vol directe"
      : meta.stops === 1
        ? `1 escala${meta.layoverCodes?.length ? ` · ${meta.layoverCodes.map(c => airportCity(c)).join(", ")}` : ""}`
        : `${meta.stops} escales${meta.layoverCodes?.length ? ` · ${meta.layoverCodes.map(c => airportCity(c)).join(", ")}` : ""}`
    : null;
  const initZoom = distKm > 8000 ? 2.0 : distKm > 5000 ? 2.5 : distKm > 2000 ? 3.2 : distKm > 800 ? 4.0 : 5.0;
  const midLng = lerp(origin[0], dest[0], 0.5);
  const midLat = lerp(origin[1], dest[1], 0.5) + (distKm > 5000 ? 8 : distKm > 2000 ? 4 : 2);

  // Geocode hotel: real coords from metadata > Nominatim by address > by name+city
  async function geocodeHotel(hotel: Offer): Promise<[number, number] | null> {
    const hm = hotel.metadata;
    if (typeof hm?.lat === "number" && typeof hm?.lng === "number") {
      return [hm.lng, hm.lat];
    }
    try {
      const query = hm?.address
        ? encodeURIComponent(hm.address)
        : encodeURIComponent(`${hotel.title}, ${destCity}`);
      const r = await fetch(`/api/geocode?q=${query}&dest=1`);
      const d = await r.json() as [number, number] | null;
      return Array.isArray(d) && d.length === 2 ? d : null;
    } catch { return null; }
  }

  // ─── Init map + fly animation ─────────────────────────────────────────────
  React.useEffect(() => {
    // We need: a container, a token, and a valid route (destCode from metadata OR geocoded coords)
    const hasRoute = realDestCode !== null || destCoords !== null;
    if (!containerRef.current || !TOKEN || !hasRoute) {
      setTimeout(() => { setVisible(false); onComplete(); }, 800);
      return;
    }

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
      logoPosition: "bottom-right",
    });
    mapRef.current = map;
    setTimeout(() => map.resize(), 50);

    map.on("style.load", () => {
      // Origin dot
      const mkO = Object.assign(document.createElement("div"), { style: "width:13px;height:13px;border-radius:50%;background:#0D9E7A;box-shadow:0 0 0 4px rgba(13,158,122,0.25),0 2px 8px rgba(13,158,122,0.5)" });
      new mapboxgl.Marker({ element: mkO, anchor: "center" }).setLngLat(origin).addTo(map);

      // Dest dot (hidden until landing)
      const mkD = Object.assign(document.createElement("div"), { style: "width:13px;height:13px;border-radius:50%;background:#18160f;box-shadow:0 0 0 4px rgba(24,22,15,0.15),0 2px 8px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.5s" });
      new mapboxgl.Marker({ element: mkD, anchor: "center" }).setLngLat(dest).addTo(map);

      // Plane
      const planeEl = document.createElement("div");
      planeEl.innerHTML = `<div id="pl" style="font-size:18px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 8px rgba(13,158,122,0.5))">✈</div>`;
      planeEl.style.color = "#18160f";
      planeElRef.current = planeEl;
      const planeMkr = new mapboxgl.Marker({ element: planeEl, anchor: "center" }).setLngLat(arc[0]).addTo(map);
      planeRef.current = planeMkr;

      // Arc
      map.addSource("arc", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } });
      map.addLayer({ id: "arc-glow", type: "line", source: "arc", paint: { "line-color": "#0D9E7A", "line-width": 10, "line-opacity": 0.18, "line-blur": 6 } });
      map.addLayer({ id: "arc-line", type: "line", source: "arc", paint: { "line-color": "#0D9E7A", "line-width": 2.5, "line-opacity": 1 } });

      // ── Fly animation ──────────────────────────────────────────────────────
      const FLIGHT_MS = 5000;
      let start: number | null = null, lastCam = 0, done = false;

      function tick(ts: number) {
        if (done) return;
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

        const ni = Math.min(idx + 1, arc.length - 1);
        const angle = toDeg(Math.atan2(arc[ni][1] - arc[idx][1], arc[ni][0] - arc[idx][0])) - 45;
        const plIcon = planeEl.querySelector<HTMLElement>("#pl");
        if (plIcon) plIcon.style.transform = `rotate(${angle}deg)`;

        if (ts - lastCam > 200) {
          lastCam = ts;
          const la = Math.min(idx + 8, arc.length - 1);
          map.easeTo({
            center: [lerp(lng, arc[la][0], 0.4), lerp(lat, arc[la][1], 0.4)],
            zoom: lerp(initZoom, initZoom + 1.5, te),
            pitch: lerp(25, 45, te),
            bearing: angle + 45,
            duration: 250, easing: x => x,
          });
        }

        if (t < 1) { rafRef.current = requestAnimationFrame(tick); return; }

        // Landed → vertical drop onto city
        done = true;
        mkD.style.opacity = "1";
        setFlightStatus("Aterrant…");
        planeMkr.setLngLat(dest);
        planeEl.style.opacity = "0";

        map.flyTo({ center: dest, zoom: initZoom + 0.5, pitch: 0, bearing: 0, duration: 700, essential: true, easing: x => x });
        setTimeout(() => {
          map.flyTo({
            center: dest, zoom: Math.min(initZoom + 7, 13),
            pitch: 0, bearing: 0, duration: 1800, essential: true,
            easing: x => 1 - Math.pow(1 - x, 2.5),
          });
          // Enable map interaction for hotel phase (or skip if no hotels)
          setTimeout(() => {
            map.dragPan.disable();
            if (hotels.length === 0) {
              setVisible(false);
              setTimeout(onComplete, 480);
            } else {
              setPhase("hotel-select");
            }
          }, 1900);
        }, 750);
      }

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => { cancelAnimationFrame(rafRef.current); map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Hotel selected: geocode + fly to hotel ───────────────────────────────
  async function handleHotelSelect(hotel: Offer) {
    if (!mapRef.current) return;
    setSelectedHotel(hotel);
    setPhase("hotel-zoom");
    onHotelSelected(hotel);

    const map = mapRef.current;
    const hotelCoords = await geocodeHotel(hotel);
    const target: [number, number] = hotelCoords ?? dest;

    // Fly to neighborhood (zoom 15)
    map.flyTo({
      center: target, zoom: 15,
      pitch: 0, bearing: 0,
      duration: 1800, essential: true,
      easing: x => 1 - Math.pow(1 - x, 2.5),
    });

    // Drop pin after map arrives
    setTimeout(() => {
      const pinEl = document.createElement("div");
      pinEl.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:default;transform:translateY(-100px);opacity:0;transition:transform 0.6s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s";
      pinEl.innerHTML = `
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(145deg,#0D9E7A,#0a7d61);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(13,158,122,0.45),0 2px 8px rgba(0,0,0,0.12);border:3px solid white;font-size:20px">🏨</div>
        <div style="width:3px;height:14px;background:linear-gradient(to bottom,#0D9E7A,transparent);border-radius:2px"></div>
      `;
      const pinMkr = new mapboxgl.Marker({ element: pinEl, anchor: "bottom" }).setLngLat(target).addTo(map);
      pinRef.current = pinMkr;

      // Trigger drop animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pinEl.style.transform = "translateY(0)";
          pinEl.style.opacity = "1";
        });
      });

      // Complete after pin settles
      setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 480);
      }, 1400);
    }, 1900);
  }

  const isHotelPhase = phase === "hotel-select" || phase === "hotel-zoom";

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
          <div className="relative w-full max-w-[480px] overflow-hidden" style={{ height: "100dvh", background: "#f4f1ec" }}>

            {/* Map — always full screen */}
            <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

            {/* Gradient edges */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to bottom, #f4f1ec 0%, transparent 20%, transparent 68%, #f4f1ec 100%)",
            }} />

            {/* ── FLIGHT PHASE UI ─────────────────────────────────────────── */}
            <AnimatePresence>
              {phase === "flying" && (
                <motion.div
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  {/* Route header */}
                  <div style={{ position: "absolute", inset: "0 0 auto 0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 58, gap: 6 }}>
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "#18160f" }}>{resolvedOriginCity}</span>
                      <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} style={{ color: "#0D9E7A", fontSize: 18 }}>✈</motion.span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "#18160f" }}>{destCity}</span>
                    </motion.div>
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.45, duration: 0.35 }} style={{ height: 2, width: 36, borderRadius: 2, background: "#0D9E7A" }} />
                  </div>

                  {/* Bottom: time + status */}
                  <div style={{ position: "absolute", inset: "auto 0 0 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 52 }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                      style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, padding: "9px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                      <span style={{ fontSize: 15 }}>🕐</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0D9E7A" }}>{flightTime}</span>
                      <span style={{ fontSize: 12, color: "#7a7570", fontWeight: 500 }}>{meta.durationMinutes ? "durada" : "vol estimat"}</span>
                    </motion.div>
                    {stopLabel && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 999, padding: "5px 14px", backdropFilter: "blur(8px)" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#7a7570" }}>{stopLabel}</span>
                      </motion.div>
                    )}
                    <motion.div key={flightStatus} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 999, padding: "5px 12px", backdropFilter: "blur(8px)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0D9E7A", boxShadow: "0 0 5px rgba(13,158,122,0.6)", animation: "pdot 1.2s ease-in-out infinite" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#7a7570", letterSpacing: "0.04em" }}>{flightStatus}</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── HOTEL SELECT PHASE UI ───────────────────────────────────── */}
            <AnimatePresence>
              {isHotelPhase && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  {/* Top label */}
                  <div style={{ position: "absolute", inset: "0 0 auto 0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 56, pointerEvents: "none" }}>
                    <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#0D9E7A" }}>
                      {destCity}
                    </motion.p>
                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                      style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#18160f", marginTop: 2 }}>
                      On t&apos;allotges?
                    </motion.p>
                  </div>

                  {/* Hotel cards list — scrollable bottom sheet */}
                  {phase === "hotel-select" && (
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.1 }}
                      style={{
                        position: "absolute", inset: "auto 0 0 0",
                        background: "linear-gradient(to bottom, transparent 0%, #f4f1ec 12%)",
                        paddingTop: 24,
                      }}
                    >
                      <div style={{ maxHeight: "62dvh", overflowY: "auto", padding: "0 16px 32px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {hotels.map((hotel) => (
                            <HotelCard
                              key={hotel.id}
                              hotel={hotel}
                              onSelect={() => handleHotelSelect(hotel)}
                              disabled={phase !== "hotel-select"}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Hotel zoom phase — show selected card */}
                  {phase === "hotel-zoom" && selectedHotel && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      style={{ position: "absolute", inset: "auto 0 0 0", padding: "0 16px 48px" }}
                    >
                      <div style={{
                        background: "#fff", borderRadius: 20, padding: 16,
                        boxShadow: "0 16px 48px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        {selectedHotel.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedHotel.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(13,158,122,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏨</div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {selectedHotel.provider && <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0D9E7A", margin: 0 }}>{selectedHotel.provider}</p>}
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#18160f", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedHotel.title}</p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: "#0D9E7A", margin: 0 }}>€{Math.round(selectedHotel.price)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          <style>{`@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.5)}}`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Hotel card sub-component ─────────────────────────────────────────────────
function HotelCard({ hotel, onSelect, disabled }: { hotel: Offer; onSelect: () => void; disabled: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onSelect}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      style={{
        width: "100%", textAlign: "left", background: "#fff",
        border: "1px solid rgba(0,0,0,0.07)", borderRadius: 18,
        padding: "12px 14px", cursor: disabled ? "default" : "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      {hotel.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hotel.imageUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(13,158,122,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏨</div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        {hotel.provider && <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7a7570", margin: 0 }}>{hotel.provider}</p>}
        <p style={{ fontSize: 13, fontWeight: 700, color: "#18160f", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hotel.title}</p>
        {hotel.rating != null && (
          <p style={{ fontSize: 11, color: "#7a7570", margin: "2px 0 0" }}>★ {hotel.rating.toFixed(1)}{hotel.reviewCount ? ` · ${hotel.reviewCount.toLocaleString()}` : ""}</p>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#0D9E7A", margin: 0 }}>€{Math.round(hotel.price)}</p>
        {hotel.availabilityText && <p style={{ fontSize: 10, color: "#7a7570", margin: "1px 0 0" }}>{hotel.availabilityText}</p>}
      </div>
    </motion.button>
  );
}
