import { describe, it, expect } from "vitest";

import {
  sanitizeItineraryPreferences,
  buildItinerarySystemInstruction,
  buildItineraryUserPrompt,
  normalizeItineraryPayload,
  validateItinerary,
  validationFailureReason,
  sumItineraryActivitiesCost,
  isActivitySlot,
  isRestaurantSlot,
  GEMINI_SYSTEM_INSTRUCTION,
  MAX_ITINERARY_PREFERENCES_LENGTH,
  type ItineraryPayload,
} from "@/lib/itinerary";

// ─── Fixtures ───────────────────────────────────────────────────────────────

const validActivity = {
  name: "Belém Tower",
  description: "16th-century riverside fortress and UNESCO landmark.",
  estimated_cost_eur: 8,
  Maps_url: "https://www.google.com/maps/place/Bel%C3%A9m+Tower",
};

const validRestaurant = {
  name: "Cervejaria Ramiro",
  cuisine: "Seafood",
  estimated_cost_eur: 35,
  Maps_url: "https://www.google.com/maps/place/Ramiro",
};

function makeDay(n: number) {
  return {
    day_number: n,
    theme: `Day ${n} theme`,
    morning_activity: { ...validActivity },
    lunch_restaurant: { ...validRestaurant },
    afternoon_activity: { ...validActivity },
    dinner_restaurant: { ...validRestaurant },
  };
}

const validPayload: ItineraryPayload = {
  trip_title: "Lisbon weekend",
  days: [makeDay(1), makeDay(2)],
};

// ─── sanitizeItineraryPreferences ──────────────────────────────────────────

describe("sanitizeItineraryPreferences", () => {
  it("trims and returns the string", () => {
    expect(sanitizeItineraryPreferences("  vegan, slow travel  ")).toBe(
      "vegan, slow travel",
    );
  });

  it("returns empty string for non-string inputs", () => {
    expect(sanitizeItineraryPreferences(null)).toBe("");
    expect(sanitizeItineraryPreferences(undefined)).toBe("");
    expect(sanitizeItineraryPreferences(42)).toBe("");
    expect(sanitizeItineraryPreferences({ a: 1 })).toBe("");
  });

  it("caps the length at MAX_ITINERARY_PREFERENCES_LENGTH", () => {
    const long = "a".repeat(MAX_ITINERARY_PREFERENCES_LENGTH + 50);
    const out = sanitizeItineraryPreferences(long);
    expect(out.length).toBe(MAX_ITINERARY_PREFERENCES_LENGTH);
  });
});

// ─── buildItinerarySystemInstruction ───────────────────────────────────────

describe("buildItinerarySystemInstruction", () => {
  it("returns the base instruction when no profile is provided", () => {
    const out = buildItinerarySystemInstruction();
    expect(out).toContain(GEMINI_SYSTEM_INSTRUCTION);
    expect(out).toContain("CRITICAL");
    expect(out).not.toContain("USER TRAVEL PROFILE");

    const out2 = buildItinerarySystemInstruction("");
    expect(out2).toContain(GEMINI_SYSTEM_INSTRUCTION);
    expect(out2).not.toContain("USER TRAVEL PROFILE");
  });

  it("appends the user travel profile block when provided", () => {
    const out = buildItinerarySystemInstruction("vegan, slow travel");
    expect(out).toContain(GEMINI_SYSTEM_INSTRUCTION);
    expect(out).toContain("USER TRAVEL PROFILE");
    expect(out).toContain("vegan, slow travel");
  });
});

// ─── normalizeItineraryPayload ─────────────────────────────────────────────

describe("normalizeItineraryPayload", () => {
  it("accepts a well-formed payload", () => {
    const out = normalizeItineraryPayload(validPayload, "Lisbon", 2);
    expect(out).not.toBeNull();
    expect(out!.days).toHaveLength(2);
    expect(out!.days[0].day_number).toBe(1);
    expect(out!.days[1].day_number).toBe(2);
  });

  it("renumbers day_number to match position regardless of input", () => {
    const messy = {
      trip_title: "x",
      days: [makeDay(7), makeDay(99)],
    };
    const out = normalizeItineraryPayload(messy, "Lisbon", 2);
    expect(out!.days[0].day_number).toBe(1);
    expect(out!.days[1].day_number).toBe(2);
  });

  it("synthesizes a Maps_url when the model omits it", () => {
    const broken = {
      trip_title: "x",
      days: [
        {
          ...makeDay(1),
          morning_activity: {
            name: "Some Place",
            description: "...",
            estimated_cost_eur: 0,
            // no Maps_url
          },
        },
      ],
    };
    const out = normalizeItineraryPayload(broken, "Lisbon", 1);
    expect(out).not.toBeNull();
    expect(out!.days[0].morning_activity.Maps_url).toMatch(
      /^https:\/\/www\.google\.com\/maps\/search\/.+Lisbon/,
    );
  });

  it("returns null when a restaurant slot is missing its cuisine", () => {
    const broken = {
      trip_title: "x",
      days: [
        {
          ...makeDay(1),
          lunch_restaurant: { ...validRestaurant, cuisine: undefined },
        },
      ],
    };
    expect(normalizeItineraryPayload(broken, "Lisbon", 1)).toBeNull();
  });

  it("returns null when the day count is short", () => {
    const short = { trip_title: "x", days: [makeDay(1)] };
    expect(normalizeItineraryPayload(short, "Lisbon", 3)).toBeNull();
  });

  it("returns null for non-objects", () => {
    expect(normalizeItineraryPayload(null, "Lisbon", 1)).toBeNull();
    expect(normalizeItineraryPayload("nope", "Lisbon", 1)).toBeNull();
  });
});

// ─── validateItinerary + validationFailureReason ───────────────────────────

describe("validateItinerary", () => {
  it("accepts a valid payload", () => {
    expect(validateItinerary(validPayload, 2)).toBe(true);
  });

  it("rejects when days.length differs from expectedDays", () => {
    expect(validateItinerary(validPayload, 5)).toBe(false);
  });

  it("rejects when trip_title is missing", () => {
    const bad = { ...validPayload, trip_title: 42 as unknown as string };
    expect(validateItinerary(bad, 2)).toBe(false);
  });

  it("rejects when an activity has an invalid Maps_url", () => {
    const bad: ItineraryPayload = JSON.parse(JSON.stringify(validPayload));
    bad.days[0].morning_activity.Maps_url = "not a url";
    expect(validateItinerary(bad, 2)).toBe(false);
  });
});

describe("validationFailureReason", () => {
  it("describes a missing trip_title", () => {
    expect(validationFailureReason({ days: [] }, 0)).toContain("trip_title");
  });

  it("describes a day count mismatch", () => {
    expect(validationFailureReason(validPayload, 5)).toMatch(/days\.length/);
  });

  it("identifies the offending slot field", () => {
    const bad: ItineraryPayload = JSON.parse(JSON.stringify(validPayload));
    bad.days[0].lunch_restaurant.Maps_url = "";
    const reason = validationFailureReason(bad, 2);
    expect(reason).toContain("days[0]");
    expect(reason).toContain("Maps_url");
  });
});

// ─── Type guards ───────────────────────────────────────────────────────────

describe("type guards", () => {
  it("isActivitySlot recognizes a valid activity", () => {
    expect(isActivitySlot(validActivity)).toBe(true);
  });

  it("isActivitySlot rejects an object missing description", () => {
    const noDesc = { ...validActivity, description: undefined };
    expect(isActivitySlot(noDesc)).toBe(false);
  });

  it("isRestaurantSlot recognizes a valid restaurant", () => {
    expect(isRestaurantSlot(validRestaurant)).toBe(true);
  });

  it("isRestaurantSlot rejects an activity (no cuisine)", () => {
    expect(isRestaurantSlot(validActivity)).toBe(false);
  });
});

// ─── sumItineraryActivitiesCost ────────────────────────────────────────────

describe("sumItineraryActivitiesCost", () => {
  it("sums every slot across every day", () => {
    // 2 days × 4 slots × known costs (8 + 35 + 8 + 35) = 86 per day → 172
    expect(sumItineraryActivitiesCost(validPayload)).toBe(172);
  });

  it("rounds to the nearest integer", () => {
    const payload: ItineraryPayload = JSON.parse(JSON.stringify(validPayload));
    payload.days[0].morning_activity.estimated_cost_eur = 8.4;
    payload.days[0].afternoon_activity.estimated_cost_eur = 8.6;
    // 8.4 + 35 + 8.6 + 35 + 8 + 35 + 8 + 35 = 173 (already integer after rounding)
    expect(sumItineraryActivitiesCost(payload)).toBe(173);
  });

  it("returns 0 for an empty itinerary", () => {
    expect(sumItineraryActivitiesCost({ trip_title: "x", days: [] })).toBe(0);
  });
});

// ─── buildItineraryUserPrompt ──────────────────────────────────────────────

describe("buildItineraryUserPrompt", () => {
  it("includes destination, people, budget, days and date window", () => {
    const prompt = buildItineraryUserPrompt(
      "Lisbon",
      2,
      400,
      3,
      "2026-06-01",
      "2026-06-03",
    );
    expect(prompt).toContain("Lisbon");
    expect(prompt).toContain("group of 2");
    expect(prompt).toContain("3 days long");
    expect(prompt).toContain("400 EUR");
    expect(prompt).toContain("2026-06-01");
    expect(prompt).toContain("2026-06-03");
  });

  it("repeats the day count in the hard requirements block", () => {
    const prompt = buildItineraryUserPrompt(
      "Lisbon",
      1,
      200,
      4,
      "2026-06-01",
      "2026-06-04",
    );
    expect(prompt).toMatch(/exactly 4 objects/);
  });

  it("embeds the traveler profile when provided", () => {
    const prompt = buildItineraryUserPrompt(
      "Lisbon",
      2,
      400,
      2,
      "2026-06-01",
      "2026-06-02",
      "vegan, slow travel",
    );
    expect(prompt).toContain("vegan, slow travel");
    expect(prompt).toContain("PERSONALIZATION");
  });

  it("omits the personalization block when profile is empty", () => {
    const prompt = buildItineraryUserPrompt(
      "Lisbon",
      2,
      400,
      2,
      "2026-06-01",
      "2026-06-02",
    );
    expect(prompt).not.toContain("PERSONALIZATION");
  });
});
