"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import type { Offer } from "@/components/plan/PlanProvider";
import { useLocale } from "@/lib/i18n-client";
import type { Locale } from "@/lib/i18n";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export interface HotelTransitionOverlayProps {
  hotel: Offer;
  destCity: string;
  destCoords: [number, number] | null;
  onComplete: () => void;
  initialLocale?: Locale;
}

export function HotelTransitionOverlay({
  hotel,
  destCity,
  destCoords,
  onComplete,
  initialLocale,
}: HotelTransitionOverlayProps) {
  const { t } = useLocale(initialLocale);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const [visible, setVisible] = React.useState(true);
  const [pinDropped, setPinDropped] = React.useState(false);

  const coords: [number, number] = destCoords ?? [2.154, 41.39];

  React.useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: coords,
      zoom: 13,
      pitch: 40,
      bearing: -10,
      interactive: false,
      attributionControl: false,
      logoPosition: "bottom-right",
    });
    mapRef.current = map;

    map.on("load", () => {
      setTimeout(() => {
        setPinDropped(true);
        map.flyTo({
          center: coords, zoom: 14.5, pitch: 52, bearing: 8,
          duration: 2200, essential: true,
          easing: (x) => 1 - Math.pow(1 - x, 3),
        });
      }, 500);
    });

    const done = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 480);
    }, 4000);

    return () => {
      clearTimeout(done);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback if no destCoords
  React.useEffect(() => {
    if (destCoords) return;
    const t = setTimeout(() => { setVisible(false); setTimeout(onComplete, 400); }, 1000);
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
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="relative w-full max-w-[480px] overflow-hidden bg-bg"
            style={{ height: "100dvh" }}
          >
            {/* Map — bottom 60% of screen */}
            <div ref={containerRef} className="absolute inset-0" />

            {/* Top gradient fade so the header sits cleanly */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-44"
              style={{ background: "linear-gradient(to bottom, var(--bg) 30%, transparent 100%)" }}
            />

            {/* Bottom gradient */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
              style={{ background: "linear-gradient(to top, var(--bg) 40%, transparent 100%)" }}
            />

            {/* Hotel name header */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-16">
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 24 }}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--green)]"
              >
                {destCity}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 280, damping: 22 }}
                className="display mt-1 text-center text-xl font-extrabold tracking-[-0.02em] text-text"
                style={{ maxWidth: 280 }}
              >
                {hotel.title}
              </motion.p>
              {hotel.rating != null && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-1.5 text-xs text-muted"
                >
                  {"★".repeat(Math.round(hotel.rating))} {hotel.rating.toFixed(1)}
                  {hotel.reviewCount ? ` · ${hotel.reviewCount.toLocaleString()} ${t.opinionsWord}` : ""}
                </motion.p>
              )}
            </div>

            {/* Pin drop — centered on screen */}
            <AnimatePresence>
              {pinDropped && (
                <motion.div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{ paddingBottom: "6%" }}
                >
                  {/* Shadow */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.2 }}
                    transition={{ delay: 0.22, duration: 0.28, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      width: 44,
                      height: 10,
                      borderRadius: "50%",
                      background: "#000",
                      top: "50%",
                      marginTop: 30,
                    }}
                  />

                  {/* Pin */}
                  <motion.div
                    initial={{ y: -280, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                      mass: 0.85,
                    }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-full ring-[3px] ring-white"
                      style={{
                        background: "linear-gradient(145deg, #0D9E7A 0%, #0a7d61 100%)",
                        boxShadow: "0 8px 32px rgba(13,158,122,0.5), 0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>🏨</span>
                    </div>
                    {/* Needle */}
                    <div
                      style={{
                        width: 3,
                        height: 18,
                        background: "linear-gradient(to bottom, #0D9E7A, transparent)",
                        borderRadius: 2,
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom card */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 280, damping: 26 }}
              className="absolute inset-x-4 bottom-10 overflow-hidden rounded-[20px] bg-surface ring-1 ring-border"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-3 p-4">
                {hotel.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hotel.imageUrl}
                    alt=""
                    className="h-[60px] w-[60px] flex-none rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-xl text-2xl"
                    style={{ background: "var(--green-subtle)" }}
                  >
                    🏨
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {hotel.provider && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--green)]">
                      {hotel.provider}
                    </p>
                  )}
                  <p className="truncate text-sm font-bold text-text">{hotel.title}</p>
                  {hotel.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{hotel.description}</p>
                  )}
                </div>
                <div className="flex-none text-right">
                  <p className="text-base font-extrabold text-[color:var(--green)]">
                    {hotel.price > 0 ? `€${Math.round(hotel.price)}` : ""}
                  </p>
                  {hotel.availabilityText && (
                    <p className="text-[10px] text-muted">{hotel.availabilityText}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
