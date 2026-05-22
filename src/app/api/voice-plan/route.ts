import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TRANSCRIPT = 500;
const MAX_AUDIO_B64 = 8_000_000; // ~6MB of audio once decoded
const LOG_PREFIX = "[api/voice-plan]";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOverloaded(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    msg.includes("503") ||
    msg.includes("overload") ||
    msg.includes("high demand") ||
    msg.includes("unavailable")
  );
}

/** Retry transient Gemini overload (503) with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isOverloaded(err) || i === attempts - 1) throw err;
      await sleep(500 * 2 ** i);
    }
  }
  throw lastErr;
}

/**
 * Shape the model is asked to return. We keep it flat and tolerant: any field
 * may be null when the user did not mention it, and the client decides how to
 * fill the gaps (sensible defaults / asking again).
 */
type ParsedPlan = {
  destination: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  people: number | null;
  budget: number | null;
  budgetIsTotal: boolean;
  transport: "plane" | "train" | "bus" | "car" | null;
  preferences: string | null;
};

const TRANSPORT_VALUES = ["plane", "train", "bus", "car"] as const;
const LANG_NAMES: Record<string, string> = {
  ca: "Catalan",
  es: "Spanish",
  en: "English",
};

function isIsoOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && ISO_DATE.test(value));
}

function coerceParsed(raw: unknown): ParsedPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isIsoOrNull(r.startDate) || !isIsoOrNull(r.endDate)) return null;

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const transport =
    typeof r.transport === "string" &&
    (TRANSPORT_VALUES as readonly string[]).includes(r.transport)
      ? (r.transport as ParsedPlan["transport"])
      : null;

  return {
    destination: str(r.destination),
    country: str(r.country),
    startDate: r.startDate ?? null,
    endDate: r.endDate ?? null,
    people: num(r.people),
    budget: num(r.budget),
    budgetIsTotal: r.budgetIsTotal === true,
    transport,
    preferences: str(r.preferences),
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`voice-plan:${session.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    transcript?: unknown;
    audio?: unknown;
    mimeType?: unknown;
    lang?: unknown;
  } | null;

  const langCode = typeof body?.lang === "string" ? body.lang : "ca";
  const langName = LANG_NAMES[langCode] ?? "Catalan";

  const transcript = String(body?.transcript ?? "").trim();
  const audio = typeof body?.audio === "string" ? body.audio : "";
  const mimeType =
    typeof body?.mimeType === "string" && body.mimeType
      ? body.mimeType.split(";")[0] // Gemini wants the bare type, no codecs
      : "audio/webm";

  if (!transcript && !audio) {
    return NextResponse.json(
      { error: "transcript or audio is required" },
      { status: 400 },
    );
  }
  if (transcript && transcript.length > MAX_TRANSCRIPT) {
    return NextResponse.json({ error: "transcript too long" }, { status: 400 });
  }
  if (audio && audio.length > MAX_AUDIO_B64) {
    return NextResponse.json({ error: "audio too long" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const systemInstruction = [
    "You extract structured travel-plan parameters from a short spoken request.",
    "The user speaks naturally in Spanish, Catalan or English.",
    `Today's date is ${today}. Resolve relative dates ("next weekend", "en junio", "this summer") to concrete calendar dates relative to today.`,
    "Return ONLY a JSON object with these exact keys:",
    `- destination: city name (string) or null. Write it in ${langName}.`,
    `- country: country name (string) or null. Write it in ${langName}.`,
    "- startDate: ISO date YYYY-MM-DD or null",
    "- endDate: ISO date YYYY-MM-DD or null",
    "- people: positive integer (number of travellers) or null",
    "- budget: the budget amount in EUR the user mentioned, as a number, or null",
    "- budgetIsTotal: boolean. true if that budget is meant for the whole trip / all travellers combined; false if it is per person. When ambiguous, default to false (per person).",
    "- transport: one of \"plane\", \"train\", \"bus\", \"car\" if a transport mode is mentioned (avió/avión→plane, tren→train, bus/autobús/ferri→bus, cotxe/coche→car), otherwise null",
    `- preferences: a short free-text summary of interests/style mentioned, written in ${langName}, or null`,
    "Rules: if only a duration is given (e.g. '4 days') and a start date can be inferred, compute endDate so the trip spans that many days inclusive. If no year is given, assume the soonest future occurrence. Never invent a destination that was not mentioned. Output strictly valid JSON, no markdown.",
  ].join("\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction,
      generationConfig: { responseMimeType: "application/json" },
    });

    // Audio path: send the recorded clip to Gemini (multimodal) so it both
    // transcribes and extracts the plan — this avoids the browser speech
    // service that some networks block. Text path: send the typed request.
    const request = audio
      ? [
          {
            inlineData: { mimeType, data: audio },
          },
          {
            text: "Transcribe this spoken travel request and extract the JSON parameters as instructed.",
          },
        ]
      : transcript;

    const result = await withRetry(() => model.generateContent(request));
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
    }

    const plan = coerceParsed(parsed);
    if (!plan) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
    }

    return NextResponse.json({ plan }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    const isRateLimit =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate");
    console.error(LOG_PREFIX, "Gemini call failed", err);
    return NextResponse.json(
      { error: "Failed to interpret your request. Please try again." },
      { status: isRateLimit ? 429 : 503 },
    );
  }
}
