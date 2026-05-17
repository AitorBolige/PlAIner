"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, MapPin, Calendar, Users, Wallet } from "lucide-react";

const STEPS = [
  { icon: MapPin, text: "Analitzant la destinació...", duration: 1200 },
  { icon: Calendar, text: "Optimitzant les dates...", duration: 1000 },
  { icon: Users, text: "Ajustant al teu perfil...", duration: 1000 },
  { icon: Wallet, text: "Calculant el pressupost real...", duration: 1200 },
  { icon: Sparkles, text: "Construint el teu itinerari...", duration: 2000 },
] as const;

export function GeneratingScreen({
  destination,
  heroImage,
  /** When provided, progress follows real work instead of a fixed timer (parent unmounts when done). */
  blockingWork,
}: {
  destination: string;
  heroImage?: string;
  blockingWork?: Promise<unknown>;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (blockingWork) {
      const stepInterval = window.setInterval(() => {
        setCurrentStep((i) => (i + 1) % STEPS.length);
      }, 1500);
      const progressInterval = window.setInterval(() => {
        setProgress((p) => Math.min(p + 1.2, 92));
      }, 100);
      let cancelled = false;
      blockingWork.finally(() => {
        window.clearInterval(stepInterval);
        window.clearInterval(progressInterval);
        if (!cancelled) setProgress(100);
      });
      return () => {
        cancelled = true;
        window.clearInterval(stepInterval);
        window.clearInterval(progressInterval);
      };
    }

    let elapsed = 0;
    const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);

    STEPS.forEach((step, i) => {
      window.setTimeout(() => setCurrentStep(i), elapsed);
      elapsed += step.duration;
    });

    const interval = window.setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 95));
    }, 80);

    const hardStop = window.setTimeout(() => {
      setProgress((p) => Math.max(p, 92));
    }, totalDuration);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(hardStop);
    };
  }, [blockingWork]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Image
          src={
            heroImage ||
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=85&fit=crop&crop=center"
          }
          alt={destination}
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
            animation: "slowZoom 8s ease-out forwards",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "24px",
            right: "24px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
              marginBottom: "6px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Preparant el teu viatge a
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "42px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
            }}
          >
            {destination}
          </h1>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          padding: "28px 24px 48px",
          borderRadius: "28px 28px 0 0",
          marginTop: "-28px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone = !blockingWork && i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 0",
                  opacity: isDone ? 0.4 : isActive ? 1 : 0.25,
                  transition: "opacity 400ms ease",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: isDone
                      ? "var(--green-subtle)"
                      : isActive
                        ? "var(--green-subtle)"
                        : "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 300ms",
                  }}
                >
                  {isDone ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--green)"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <Icon
                      size={14}
                      color={isActive ? "var(--green)" : "var(--text-faint)"}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  {step.text}
                </p>
                {isActive ? (
                  <div
                    style={{ marginLeft: "auto", display: "flex", gap: "3px" }}
                  >
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: "var(--green)",
                          animation: `dotPulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--r-pill)",
            height: "6px",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--green), #4CD4A8)",
              borderRadius: "var(--r-pill)",
              transition: "width 300ms ease",
            }}
          />
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "var(--text-faint)",
          }}
        >
          {blockingWork
            ? "Connexió amb vols i hotels en viu; el temps depèn de les APIs."
            : "Això pot trigar uns segons..."}
        </p>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes slowZoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}
