"use client";

import * as React from "react";
import { Mic, Square, Loader2 } from "lucide-react";

import { usePlan } from "@/components/plan/PlanProvider";
import { toast } from "@/components/ui/Toast";
import { DESTINATIONS, getDestinationImage, type Destination } from "@/lib/destinations";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  daysBetween,
  parseInputDate,
  TRANSPORT_OPTIONS,
} from "@/lib/plan";

type Phase = "idle" | "rec" | "proc";

interface VoicePlan {
  destination: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  people: number | null;
  budget: number | null;
  budgetIsTotal: boolean;
  transport: string | null;
  preferences: string | null;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return c.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

function blobToB64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result);
      res(s.slice(s.indexOf(",") + 1));
    };
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function synthDestination(city: string, country: string | null): Destination {
  const match = DESTINATIONS.find(
    (d) =>
      d.city.toLowerCase() === city.toLowerCase() ||
      d.city.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(d.city.toLowerCase()),
  );
  if (match) return match;
  const img = getDestinationImage(city, "card");
  return {
    id: "voice",
    city,
    country: country ?? "",
    countryCode: "",
    continent: "",
    priceFrom: 0,
    tag: "",
    tagColor: "#0D9E7A",
    description: "",
    heroImage: getDestinationImage(city, "hero"),
    cardImage: img,
    emoji: "",
  };
}

export function VoiceButton() {
  const plan = usePlan();
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const mimeRef = React.useRef("");
  const [phase, setPhase] = React.useState<Phase>("idle");

  React.useEffect(
    () => () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function release() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function applyPlan(p: VoicePlan) {
    if (p.destination) plan.setDestination(synthDestination(p.destination, p.country));
    if (p.startDate && p.endDate) {
      const s = parseInputDate(p.startDate);
      const e = parseInputDate(p.endDate);
      if (s && e && e >= s) plan.setDates({ start: s, end: e, days: daysBetween(s, e) });
    }
    const ppl = p.people && p.people > 0 ? Math.round(p.people) : plan.people;
    if (p.people && p.people > 0) plan.setPeople(ppl);
    if (p.budget && p.budget > 0) {
      let perPerson = p.budgetIsTotal && ppl > 0 ? p.budget / ppl : p.budget;
      perPerson = Math.round(perPerson / BUDGET_STEP) * BUDGET_STEP;
      perPerson = Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, perPerson));
      plan.setBudget(perPerson);
    }
    if (p.transport) {
      const t = TRANSPORT_OPTIONS.find((o) => o.id === p.transport);
      if (t) plan.setTransport(t);
    }
    if (p.preferences) plan.setPreferences(p.preferences);
  }

  async function send(blob: Blob) {
    try {
      const audio = await blobToB64(blob);
      let lang = "ca";
      try {
        lang = localStorage.getItem("pl-lang") || "ca";
      } catch {
        /* ignore */
      }
      const res = await fetch("/api/voice-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio, mimeType: mimeRef.current || "audio/webm", lang }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.plan) {
        toast.error(data?.error ?? "No s'ha pogut interpretar.");
        setPhase("idle");
        return;
      }
      applyPlan(data.plan as VoicePlan);
      toast.success("Formulari omplert!");
      setPhase("idle");
    } catch {
      toast.error("Error de connexió.");
      setPhase("idle");
    }
  }

  async function start() {
    if (phase === "proc") return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Permet l'accés al micròfon per parlar.");
      return;
    }
    streamRef.current = stream;
    mimeRef.current = pickMime();
    chunksRef.current = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeRef.current ? { mimeType: mimeRef.current } : undefined);
    } catch {
      release();
      toast.error("No s'ha pogut gravar.");
      return;
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      release();
      const blob = new Blob(chunksRef.current, { type: mimeRef.current || "audio/webm" });
      if (blob.size < 800) {
        setPhase("idle");
        toast.error("No t'he sentit. Parla un parell de segons.");
        return;
      }
      void send(blob);
    };
    recorderRef.current = recorder;
    setPhase("rec");
    recorder.start();
  }

  function stop() {
    if (recorderRef.current?.state === "recording") {
      setPhase("proc");
      recorderRef.current.stop();
    }
  }

  const isRec = phase === "rec";
  const isProc = phase === "proc";

  return (
    <div className="mx-4 mb-3.5">
      <button
        type="button"
        onClick={isRec ? stop : isProc ? undefined : start}
        className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-[18px] px-[18px] py-3.5 text-left text-white"
        style={{
          background: isRec
            ? "linear-gradient(135deg, #0D9E7A 0%, #0a7d61 100%)"
            : "linear-gradient(135deg, #0D9E7A 0%, #1a6b9a 100%)",
          boxShadow: isRec
            ? "0 14px 38px rgba(13,158,122,0.40)"
            : "0 12px 30px rgba(13,158,122,0.28)",
          cursor: isProc ? "default" : "pointer",
        }}
      >
        <span
          className="relative flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          {isRec ? (
            <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/70" />
          ) : null}
          {isProc ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isRec ? (
            <Square size={18} fill="currentColor" />
          ) : (
            <Mic size={21} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="display block text-[15px] font-extrabold tracking-[-0.01em]">
            {isRec ? "Escoltant… toca per acabar" : isProc ? "Pensant el teu pla…" : "Parla i la IA ho omple per tu"}
          </span>
          {!isRec && !isProc ? (
            <span className="block text-xs opacity-85">Ex: «Roma 4 dies al juny, 800 €»</span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
