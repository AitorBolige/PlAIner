import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  buildItinerarySystemInstruction,
  buildItineraryUserPrompt,
  type ItineraryPayload,
  normalizeItineraryPayload,
  sanitizeItineraryPreferences,
  sumItineraryActivitiesCost,
  validateItinerary,
  validationFailureReason,
} from "@/lib/itinerary";
import { rateLimit } from "@/lib/rate-limit";

const ITINERARY_RATE_LIMIT = 5;
const ITINERARY_RATE_WINDOW_MS = 60_000;

const MAX_DAYS = 14;
// Mirror /api/voice-plan: try the model available on the current key/project
// first, then fall back if it hits its daily quota.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const LOG_PREFIX = "[api/itinerary]";

const debugEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.GEMINI_DEBUG === "1" ||
  process.env.GEMINI_DEBUG === "true";

function geminiLog(message: string, data?: Record<string, unknown>) {
  if (!debugEnabled) return;
  if (data !== undefined) {
    console.log(LOG_PREFIX, message, data);
  } else {
    console.log(LOG_PREFIX, message);
  }
}

function geminiError(
  message: string,
  err: unknown,
  data?: Record<string, unknown>,
) {
  const base: Record<string, unknown> = {
    ...data,
    error: serializeGeminiError(err),
  };
  console.error(LOG_PREFIX, message, base);
}

function serializeGeminiError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { raw: String(err) };
  }
  const out: Record<string, unknown> = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
  const extra = err as Error & {
    status?: number;
    statusText?: string;
    errorDetails?: unknown;
  };
  if (extra.status !== undefined) out.status = extra.status;
  if (extra.statusText !== undefined) out.statusText = extra.statusText;
  if (extra.errorDetails !== undefined) out.errorDetails = extra.errorDetails;
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A hard daily/free-tier quota error won't clear on retry — switch models instead. */
function isQuotaError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes("quota") || msg.includes("exceeded your current");
}

function isOverloaded(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    status === 503 ||
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

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inclusiveDays(startDate: string, endDate: string): number | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) return null;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export async function POST(req: NextRequest) {
  const requestId = `itin-${Date.now().toString(36)}`;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `itinerary:${session.user.id}`,
    ITINERARY_RATE_LIMIT,
    ITINERARY_RATE_WINDOW_MS,
  );
  if (!rl.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rl.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  geminiLog("request received", { requestId, userId: session.user.id });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    geminiError("GEMINI_API_KEY missing", new Error("not configured"), {
      requestId,
    });
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 },
    );
  }

  geminiLog("API key present", {
    requestId,
    keyPrefix: `${apiKey.slice(0, 8)}…`,
    keyLength: apiKey.length,
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (parseBodyErr) {
    geminiError("invalid JSON body", parseBodyErr, { requestId });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const destination = String(body.destination ?? body.city ?? "").trim();
  const startDate = String(body.startDate ?? "").trim();
  const endDate = String(body.endDate ?? "").trim();
  const people = Number(body.people);
  const remainingBudget = Number(body.remainingBudget ?? body.budgetMax);
  const preferences = sanitizeItineraryPreferences(
    body.preferences ?? body.travelPreferences,
  );
  const travelerAgeGroups = Array.isArray(body.travelerAgeGroups)
    ? body.travelerAgeGroups.map(String)
    : undefined;
  const locale = String(body.locale || "ca").trim().toLowerCase();

  if (!destination) {
    geminiLog("validation failed", {
      requestId,
      reason: "destination required",
    });
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 },
    );
  }
  if (!startDate || !endDate) {
    geminiLog("validation failed", {
      requestId,
      reason: "startDate and endDate required",
    });
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(people) || people < 1) {
    geminiLog("validation failed", {
      requestId,
      reason: "invalid people",
      people,
    });
    return NextResponse.json(
      { error: "people must be a positive number" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(remainingBudget) || remainingBudget < 0) {
    geminiLog("validation failed", {
      requestId,
      reason: "invalid remainingBudget",
      remainingBudget,
    });
    return NextResponse.json(
      { error: "remainingBudget must be a non-negative number" },
      { status: 400 },
    );
  }

  const days = inclusiveDays(startDate, endDate);
  if (days === null) {
    geminiLog("validation failed", {
      requestId,
      reason: "invalid date range",
      startDate,
      endDate,
    });
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  if (days > MAX_DAYS) {
    geminiLog("validation failed", {
      requestId,
      reason: "trip too long",
      days,
      maxDays: MAX_DAYS,
    });
    return NextResponse.json(
      { error: `Trip length cannot exceed ${MAX_DAYS} days` },
      { status: 400 },
    );
  }

  geminiLog("calling Gemini", {
    requestId,
    models: GEMINI_MODELS,
    destination,
    startDate,
    endDate,
    people,
    remainingBudget,
    days,
    preferencesLength: preferences.length,
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = buildItinerarySystemInstruction(preferences, locale);

    const prompt = buildItineraryUserPrompt(
      destination,
      people,
      remainingBudget,
      days,
      startDate,
      endDate,
      preferences,
      travelerAgeGroups,
    );
    geminiLog("prompt built", {
      requestId,
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 200),
    });

    // Try each model in order; if one is out of daily quota, fall back to next.
    const generate = async () => {
      let lastErr: unknown;
      for (let i = 0; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i];
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: { responseMimeType: "application/json" },
        });
        try {
          return await withRetry(() => model.generateContent(prompt));
        } catch (err) {
          lastErr = err;
          const hasNext = i < GEMINI_MODELS.length - 1;
          geminiLog("model failed", {
            requestId,
            model: modelName,
            quota: isQuotaError(err),
            tryingNext: hasNext,
          });
          if (hasNext) continue;
          throw err;
        }
      }
      throw lastErr;
    };

    const startedAt = Date.now();
    const result = await generate();
    const elapsedMs = Date.now() - startedAt;

    const text = result.response.text();
    const candidates = result.response.candidates?.length ?? 0;
    const finishReason = result.response.candidates?.[0]?.finishReason;

    geminiLog("Gemini response received", {
      requestId,
      elapsedMs,
      responseLength: text.length,
      candidates,
      finishReason,
      responsePreview: text.slice(0, 300),
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      geminiError("JSON.parse failed on model output", parseErr, {
        requestId,
        responsePreview: text.slice(0, 500),
      });
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 502 },
      );
    }

    const normalized = normalizeItineraryPayload(parsed, destination, days);
    const candidate = normalized ?? parsed;

    if (!validateItinerary(candidate, days)) {
      const reason = validationFailureReason(parsed, days);
      geminiError("itinerary schema validation failed", new Error(reason), {
        requestId,
        reason,
        normalized: normalized != null,
        parsedPreview: JSON.stringify(parsed).slice(0, 500),
        lastDayPreview: JSON.stringify(
          (parsed as { days?: unknown[] })?.days?.[days - 1],
        ).slice(0, 800),
      });
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 502 },
      );
    }

    const itinerary = (normalized ?? candidate) as ItineraryPayload;
    const activitiesTotal = sumItineraryActivitiesCost(itinerary);
    if (activitiesTotal > remainingBudget) {
      geminiError(
        "itinerary exceeded remainingBudget",
        new Error("overspend"),
        {
          requestId,
          remainingBudget,
          activitiesTotal,
        },
      );
      return NextResponse.json(
        {
          error: "Generated itinerary exceeds the remaining activities budget",
        },
        { status: 502 },
      );
    }

    geminiLog("itinerary OK", {
      requestId,
      trip_title: itinerary.trip_title,
      dayCount: itinerary.days.length,
      activitiesTotal,
      remainingBudget,
    });

    return NextResponse.json(itinerary, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message.toLowerCase()
        : String(err).toLowerCase();
    const isRateLimit =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate");

    geminiError(
      isRateLimit ? "Gemini rate limit / quota error" : "Gemini call failed",
      err,
      { requestId, classifiedAsRateLimit: isRateLimit },
    );

    if (isRateLimit) {
      return NextResponse.json(
        { error: "AI service rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Failed to generate itinerary. Please try again later." },
      { status: 503 },
    );
  }
}
