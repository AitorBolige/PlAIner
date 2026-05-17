"use client";

import * as React from "react";
import { ArrowLeft, Bookmark, Check, Loader2 } from "lucide-react";
import { Destination } from "@/lib/destinations";

export type BuilderStep = "flight" | "hotel" | "summary";

interface BuilderViewProps {
  destination: Destination;
  dates: { start: Date; end: Date; days: number };
  budget: number;
  people: number;
  onBack: () => void;
  onComplete: (tripData: any) => Promise<void>;
}

export function BuilderView({ destination, dates, budget, people, onBack, onComplete }: BuilderViewProps) {
  const [step, setStep] = React.useState<BuilderStep>("flight");
  const [saving, setSaving] = React.useState(false);

  // Mocks
  const hasFlights = false; // As requested, show the empty state for flights

  const totalBudget = budget * people;

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onComplete({
        destination: destination.city,
        country: destination.country,
        imageUrl: destination.img || destination.heroImage,
        startDate: dates.start.toISOString(),
        endDate: dates.end.toISOString(),
        people,
        totalCost: totalBudget,
        flightCost: 0,
        hotelCost: 0,
        activitiesCost: 0,
        dailyCost: Math.round(totalBudget / Math.max(1, dates.days)),
        status: "draft",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="pl-app pl-fadein"
      style={{
        width: "100%",
        maxWidth: 430,
        height: "100dvh",
        margin: "0 auto",
        position: "relative",
        background: "var(--bg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          className="pl-tap"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="display" style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
            {destination.city}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {dates.days} dies · {people} persones · {budget.toLocaleString("ca")} €/p.
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 20px", flex: 1, overflowY: "auto" }}>
        {/* Main Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #112F28 0%, #0D9E7A 100%)",
            borderRadius: 24,
            padding: "24px 20px",
            color: "#fff",
            marginBottom: 20,
            boxShadow: "0 8px 32px rgba(13,158,122,0.15)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
            CONSTRUEIX EL VIATGE
          </div>
          <div className="display" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", marginTop: 4, marginBottom: 24 }}>
            {step === "flight" ? "Tria el teu vol" : step === "hotel" ? "Tria l'hotel" : "Resum del viatge"}
          </div>

          {/* Stepper */}
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {/* Line connecting steps */}
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 2, background: "rgba(0,0,0,0.2)", zIndex: 0 }} />
            
            {(["flight", "hotel", "summary"] as BuilderStep[]).map((s, i) => {
              const active = step === s;
              const past = ["flight", "hotel", "summary"].indexOf(step) > i;
              
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: active ? "#112F28" : past ? "#0D9E7A" : "#fff",
                      color: active ? "#fff" : past ? "#fff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      boxShadow: active ? "0 0 0 4px rgba(255,255,255,0.2)" : "none",
                      border: past ? "2px solid #fff" : "none",
                    }}
                  >
                    {past ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: active || past ? "#fff" : "rgba(255,255,255,0.6)" }}>
                    {s === "flight" ? "Vol" : s === "hotel" ? "Hotel" : "Resum"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {step === "flight" && (
          <div className="pl-fadein">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { airline: "Vueling", time: "08:30 - 10:45", price: "+0 €", id: 1 },
                { airline: "Ryanair", time: "14:15 - 16:30", price: "+12 €", id: 2 },
                { airline: "Iberia", time: "18:00 - 20:15", price: "+45 €", id: 3 },
              ].map((flight) => (
                <div
                  key={flight.id}
                  onClick={() => setStep("hotel")}
                  className="pl-tap"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{flight.time}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{flight.airline} · Directe</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--green)" }}>{flight.price}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("hotel")}
              className="pl-tap"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 9999,
                background: "transparent",
                color: "var(--text-muted)",
                fontWeight: 600,
                fontSize: 14,
                marginTop: 16,
                border: "1px solid var(--border)",
              }}
            >
              Continuar sense vol
            </button>
          </div>
        )}

        {step === "hotel" && (
          <div className="pl-fadein">
             <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { name: "NH Collection Istanbul", rating: "4.5★", desc: "A prop del centre", price: "+0 €", id: 1 },
                { name: "Hilton Bosphorus", rating: "4.8★", desc: "Vistes al mar", price: "+120 €", id: 2 },
              ].map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={() => setStep("summary")}
                  className="pl-tap"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{hotel.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{hotel.rating} · {hotel.desc}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--green)" }}>{hotel.price}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("summary")}
              className="pl-tap"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 9999,
                background: "transparent",
                color: "var(--text-muted)",
                fontWeight: 600,
                fontSize: 14,
                marginTop: 16,
                border: "1px solid var(--border)",
              }}
            >
              Continuar sense hotel
            </button>
          </div>
        )}

        {step === "summary" && (
          <div className="pl-fadein">
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 24,
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Destí</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{destination.city}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Dates</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{dates.start.toLocaleDateString()} - {dates.end.toLocaleDateString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Passatgers</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{people}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Estimat</span>
                <span className="display" style={{ fontWeight: 800, fontSize: 22, color: "var(--green)" }}>{totalBudget.toLocaleString("ca")} €</span>
              </div>
            </div>

            <button
              disabled={saving}
              onClick={handleComplete}
              className="pl-tap"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 9999,
                background: "var(--green)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "var(--shadow-cta)",
                border: "none",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Guardant...</>
              ) : (
                <><Bookmark size={18} /> Guardar el meu viatge</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
