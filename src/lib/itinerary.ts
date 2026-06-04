import type { Prisma } from "@prisma/client";

export type ActivitySlot = {
  name: string;
  description: string;
  estimated_cost_eur: number;
  Maps_url: string;
};

export type RestaurantSlot = {
  name: string;
  cuisine: string;
  estimated_cost_eur: number;
  Maps_url: string;
};

export type ItineraryDay = {
  day_number: number;
  theme: string;
  morning_activity: ActivitySlot;
  lunch_restaurant: RestaurantSlot;
  afternoon_activity: ActivitySlot;
  dinner_restaurant: RestaurantSlot;
};

export type ItineraryPayload = {
  trip_title: string;
  days: ItineraryDay[];
};

export const ITINERARY_SLOT_KEYS = [
  "morning_activity",
  "lunch_restaurant",
  "afternoon_activity",
  "dinner_restaurant",
] as const;

export type ItinerarySlotKey = (typeof ITINERARY_SLOT_KEYS)[number];

const SLOT_START_TIME: Record<ItinerarySlotKey, string> = {
  morning_activity: "Matí",
  lunch_restaurant: "Dinar",
  afternoon_activity: "Tarda",
  dinner_restaurant: "Sopar",
};

export const GEMINI_SYSTEM_INSTRUCTION = `You are an expert, local travel agent. Create realistic, highly personalized daily itineraries with specific, real venues.

CRITICAL: Lunch and Dinner must be FULL, sit-down meals at actual restaurants. DO NOT suggest bakeries, cafes, or dessert shops (e.g., Pastéis de Belém) for main meals. Put famous snacks and desserts as 'morning_activity' or 'afternoon_activity' instead.

For every activity and restaurant, provide a real Google Maps URL (https://www.google.com/maps/...) in Maps_url.

BUDGET RULE (CRITICAL): The user message gives a remainingBudget — the ONLY money left for meals and activities (morning_activity, lunch_restaurant, afternoon_activity, dinner_restaurant). Flight and hotel are already paid and must NOT be included in your costs. Add up every estimated_cost_eur across all days and slots; that total MUST be less than or equal to remainingBudget. Never overspend. If the budget is tight, choose free or low-cost activities and modest restaurants. Aim to finish 5–10% under the cap when possible.

DATES: When the user message includes trip dates, align each day_number with that calendar date and favor festivals, seasonal events, markets, holidays, and time-specific happenings that occur during that exact window.`;

export const MAX_ITINERARY_PREFERENCES_LENGTH = 280;

export function sanitizeItineraryPreferences(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_ITINERARY_PREFERENCES_LENGTH);
}

export function buildItinerarySystemInstruction(
  preferences?: string,
  locale: string = "ca",
): string {
  const profile = sanitizeItineraryPreferences(preferences);
  const langName =
    locale === "en" ? "English" : locale === "es" ? "Spanish" : "Catalan";
  const langRule = `CRITICAL: You must write the entire output (including trip_title, themes, activity names, activity descriptions, restaurant names, and cuisines) in the ${langName} language. Do NOT use any other language.`;
  const baseInstruction = `${GEMINI_SYSTEM_INSTRUCTION}\n\n${langRule}`;
  if (!profile) return baseInstruction;
  return `${baseInstruction}

USER TRAVEL PROFILE (highest priority for venue choice): "${profile}"
Heavily tailor every morning_activity, lunch_restaurant, afternoon_activity, and dinner_restaurant to match this profile (diet, interests, pace, nightlife, family-friendly, etc.). Still obey: sit-down lunch/dinner rule, write in ${langName}, valid Maps_url, exact JSON schema, and remainingBudget hard cap.`;
}

function isValidMapsUrl(v: unknown): boolean {
  if (typeof v !== "string" || !v.trim()) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function coerceCost(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v))
    return Math.max(0, Math.round(v));
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  return 0;
}

function readMapsUrl(o: Record<string, unknown>): string {
  const raw =
    o.Maps_url ?? o.maps_url ?? o.mapsUrl ?? o.map_url ?? o.Map_url ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function fallbackMapsUrl(name: string, destination: string): string {
  const q = [name.trim(), destination.trim()].filter(Boolean).join(" ");
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function normalizePlaceSlot(
  raw: unknown,
  destination: string,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const name = typeof src.name === "string" ? src.name.trim() : "";
  if (!name) return null;

  let mapsUrl = readMapsUrl(src);
  if (!isValidMapsUrl(mapsUrl)) {
    mapsUrl = fallbackMapsUrl(name, destination);
  }

  const out: Record<string, unknown> = {
    name,
    estimated_cost_eur: coerceCost(src.estimated_cost_eur),
    Maps_url: mapsUrl,
  };

  if (typeof src.description === "string") {
    out.description = src.description.trim();
  }
  if (typeof src.cuisine === "string") {
    out.cuisine = src.cuisine.trim();
  }

  return out;
}

function normalizeItineraryDay(
  raw: unknown,
  destination: string,
  dayIndex: number,
): ItineraryDay | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const dayNumber =
    typeof src.day_number === "number"
      ? src.day_number
      : typeof src.day_number === "string"
        ? Number(src.day_number)
        : dayIndex + 1;
  const theme =
    typeof src.theme === "string" && src.theme.trim()
      ? src.theme.trim()
      : `Day ${dayNumber}`;

  const morning = normalizePlaceSlot(src.morning_activity, destination);
  const lunch = normalizePlaceSlot(src.lunch_restaurant, destination);
  const afternoon = normalizePlaceSlot(src.afternoon_activity, destination);
  const dinner = normalizePlaceSlot(src.dinner_restaurant, destination);

  if (!morning?.description || typeof morning.description !== "string")
    return null;
  if (!lunch?.cuisine || typeof lunch.cuisine !== "string") return null;
  if (!afternoon?.description || typeof afternoon.description !== "string") {
    return null;
  }
  if (!dinner?.cuisine || typeof dinner.cuisine !== "string") return null;

  const slots = [morning, lunch, afternoon, dinner];
  for (const slot of slots) {
    if (!isValidMapsUrl(slot.Maps_url)) return null;
  }

  return {
    day_number: dayNumber,
    theme,
    morning_activity: morning as ActivitySlot,
    lunch_restaurant: lunch as RestaurantSlot,
    afternoon_activity: afternoon as ActivitySlot,
    dinner_restaurant: dinner as RestaurantSlot,
  };
}

/** Coerce common Gemini field variants before strict validation. */
export function normalizeItineraryPayload(
  data: unknown,
  destination: string,
  expectedDays: number,
): ItineraryPayload | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.trip_title !== "string" || !Array.isArray(o.days)) return null;

  const days: ItineraryDay[] = [];
  for (let i = 0; i < expectedDays; i++) {
    const normalized = normalizeItineraryDay(o.days[i], destination, i);
    if (!normalized) return null;
    days.push({ ...normalized, day_number: i + 1 });
  }

  return {
    trip_title: o.trip_title.trim() || `Trip to ${destination}`,
    days,
  };
}

function isPlaceSlotBase(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.estimated_cost_eur === "number" &&
    isValidMapsUrl(o.Maps_url)
  );
}

export function isActivitySlot(v: unknown): v is ActivitySlot {
  if (!isPlaceSlotBase(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.description === "string";
}

export function isRestaurantSlot(v: unknown): v is RestaurantSlot {
  if (!isPlaceSlotBase(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.cuisine === "string";
}

export function isItineraryDay(v: unknown): v is ItineraryDay {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.day_number === "number" &&
    typeof o.theme === "string" &&
    isActivitySlot(o.morning_activity) &&
    isRestaurantSlot(o.lunch_restaurant) &&
    isActivitySlot(o.afternoon_activity) &&
    isRestaurantSlot(o.dinner_restaurant)
  );
}

export function validateItinerary(
  data: unknown,
  expectedDays: number,
): data is ItineraryPayload {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (typeof o.trip_title !== "string" || !Array.isArray(o.days)) return false;
  if (o.days.length !== expectedDays) return false;
  return o.days.every(isItineraryDay);
}

function describeSlotFailure(
  slotKey: string,
  slot: unknown,
  kind: "activity" | "restaurant",
): string | null {
  if (!slot || typeof slot !== "object")
    return `${slotKey} missing or not an object`;
  const o = slot as Record<string, unknown>;
  if (typeof o.name !== "string" || !o.name.trim())
    return `${slotKey}.name invalid`;
  const cost = o.estimated_cost_eur;
  if (typeof cost !== "number" || !Number.isFinite(cost)) {
    return `${slotKey}.estimated_cost_eur invalid (got ${typeof cost})`;
  }
  const maps = readMapsUrl(o);
  if (!isValidMapsUrl(maps)) return `${slotKey}.Maps_url invalid or missing`;
  if (kind === "activity" && typeof o.description !== "string") {
    return `${slotKey}.description missing`;
  }
  if (kind === "restaurant" && typeof o.cuisine !== "string") {
    return `${slotKey}.cuisine missing`;
  }
  return null;
}

export function validationFailureReason(
  data: unknown,
  expectedDays: number,
): string {
  if (!data || typeof data !== "object") return "response is not an object";
  const o = data as Record<string, unknown>;
  if (typeof o.trip_title !== "string") return "missing or invalid trip_title";
  if (!Array.isArray(o.days)) return "days is not an array";
  if (o.days.length !== expectedDays) {
    return `days.length is ${o.days.length}, expected ${expectedDays}`;
  }
  for (let i = 0; i < o.days.length; i++) {
    const day = o.days[i];
    if (!day || typeof day !== "object") return `days[${i}] is not an object`;
    const d = day as Record<string, unknown>;
    if (typeof d.day_number !== "number")
      return `days[${i}].day_number invalid`;
    if (typeof d.theme !== "string") return `days[${i}].theme invalid`;
    const slots: [string, "activity" | "restaurant"][] = [
      ["morning_activity", "activity"],
      ["lunch_restaurant", "restaurant"],
      ["afternoon_activity", "activity"],
      ["dinner_restaurant", "restaurant"],
    ];
    for (const [key, kind] of slots) {
      const err = describeSlotFailure(key, d[key], kind);
      if (err) return `days[${i}].${err}`;
    }
    if (!isItineraryDay(day)) return `days[${i}] failed schema validation`;
  }
  return "unknown validation failure";
}

function buildDayCalendarLines(startDate: string, days: number): string {
  const start = new Date(`${startDate}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return "";
  const lines: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    lines.push(`  - Day ${i + 1}: ${d.toISOString().slice(0, 10)}`);
  }
  return lines.join("\n");
}

const AGE_GROUP_LABELS: Record<string, string> = {
  minor: "minor (under 18)",
  young: "young adult (18-30)",
  adult: "adult (31-60)",
  senior: "senior (60+)",
};

function buildAgeGroupBlock(ageGroups?: string[]): string {
  if (!ageGroups || ageGroups.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const g of ageGroups) {
    const label = AGE_GROUP_LABELS[g] ?? g;
    counts[label] = (counts[label] || 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([label, count]) => `${count} ${label}`,
  );
  let block = `\nTraveler ages: ${parts.join(", ")}.`;
  const hasMinor = ageGroups.includes("minor");
  const hasSenior = ageGroups.includes("senior");
  const hasYoung = ageGroups.includes("young");
  if (hasMinor) {
    block +=
      "\nIMPORTANT: There are minors in the group. Avoid bars, nightclubs, and venues with age restrictions. Prefer family-friendly activities and restaurants.";
  }
  if (hasSenior) {
    block +=
      "\nIMPORTANT: There are seniors in the group. Prefer accessible venues, avoid steep climbs and long walks. Include rest-friendly schedules.";
  }
  if (hasYoung && !hasMinor) {
    block +=
      "\nThe group includes young adults — feel free to include vibrant nightlife, trendy restaurants, and adventure activities.";
  }
  return block + "\n";
}

export function buildItineraryUserPrompt(
  destination: string,
  people: number,
  remainingBudget: number,
  days: number,
  startDate: string,
  endDate: string,
  preferences?: string,
  travelerAgeGroups?: string[],
): string {
  const profile = sanitizeItineraryPreferences(preferences);
  const profileBlock = profile
    ? `\nTraveler profile (must shape every venue and theme): "${profile}"\n`
    : "";
  const calendarLines = buildDayCalendarLines(startDate, days);
  const dateBlock =
    startDate && endDate
      ? `\nTrip dates: ${startDate} to ${endDate} (${days} days, inclusive). Match day_number to these calendar dates:\n${calendarLines}\nPrioritize festivals, seasonal events, markets, holidays, and other happenings that occur during this period.\n`
      : "";
  const ageBlock = buildAgeGroupBlock(travelerAgeGroups);

  return `Create a daily itinerary for ${destination} for a group of ${people}. The trip is ${days} days long.${dateBlock}${ageBlock}
Flight and hotel are already booked and paid separately. You have exactly ${remainingBudget} EUR remaining for ALL food and activities on this trip — this is a hard cap for the whole group across every day.${profileBlock}
Return ONLY valid JSON matching this exact structure (no markdown, no extra keys):
{
  "trip_title": "string",
  "days": [
    {
      "day_number": 1,
      "theme": "string",
      "morning_activity": { "name": "string", "description": "string", "estimated_cost_eur": 0, "Maps_url": "string" },
      "lunch_restaurant": { "name": "string", "cuisine": "string", "estimated_cost_eur": 0, "Maps_url": "string" },
      "afternoon_activity": { "name": "string", "description": "string", "estimated_cost_eur": 0, "Maps_url": "string" },
      "dinner_restaurant": { "name": "string", "cuisine": "string", "estimated_cost_eur": 0, "Maps_url": "string" }
    }
  ]
}
Requirements:
- The "days" array must contain exactly ${days} objects.
- day_number must run from 1 to ${days} in order.
- Keep estimated_cost_eur realistic per activity/restaurant for the whole group; use 0 for free activities.
- Use the exact key Maps_url (capital M) for every slot. Every Maps_url must be a valid https:// Google Maps link for that venue.
- Every activity needs description; every restaurant needs cuisine. All ${days} days must be complete with all four slots.
- When trip dates are provided, theme each day around what is actually on during that calendar date (festivals, fairs, concerts, public holidays, seasonal highlights).
- HARD BUDGET: The sum of every estimated_cost_eur (all slots on all ${days} days) must be \u2264 ${remainingBudget} EUR. Do not exceed ${remainingBudget} EUR under any circumstances.${
    profile
      ? `\n- PERSONALIZATION: Reflect the traveler profile in every slot \u2014 restaurant choices (diet/cuisine), activities (interests), and day themes.`
      : ""
  }`;
}

export function sumItineraryActivitiesCost(
  itinerary: ItineraryPayload,
): number {
  let total = 0;
  for (const day of itinerary.days) {
    for (const key of ITINERARY_SLOT_KEYS) {
      const slot = day[key];
      if (slot && typeof slot.estimated_cost_eur === "number") {
        total += slot.estimated_cost_eur;
      }
    }
  }
  return Math.round(total);
}

type SlotItem = ActivitySlot | RestaurantSlot;

function slotToActivityCreate(
  slotKey: ItinerarySlotKey,
  item: SlotItem,
  order: number,
): Prisma.ActivityUncheckedCreateWithoutDayInput {
  const isRestaurant =
    slotKey === "lunch_restaurant" || slotKey === "dinner_restaurant";
  return {
    name: item.name,
    description: isRestaurant
      ? (item as RestaurantSlot).cuisine
      : (item as ActivitySlot).description,
    startTime: SLOT_START_TIME[slotKey],
    cost: item.estimated_cost_eur,
    category: slotKey,
    mapsUrl: item.Maps_url,
    order,
  };
}

export function mapItineraryToDaysCreate(
  itinerary: ItineraryPayload,
): Prisma.DayUncheckedCreateWithoutTripInput[] {
  return itinerary.days.map((day) => ({
    dayNumber: day.day_number,
    title: day.theme,
    activities: {
      create: ITINERARY_SLOT_KEYS.map((slotKey, order) =>
        slotToActivityCreate(slotKey, day[slotKey], order),
      ),
    },
  }));
}

type DayWithActivities = {
  dayNumber: number;
  title: string;
  activities: {
    name: string;
    description: string | null;
    startTime: string | null;
    cost: number;
    category: string | null;
    mapsUrl: string | null;
    order: number;
  }[];
};

export function prismaDaysToItinerary(
  tripTitle: string,
  days: DayWithActivities[],
): ItineraryPayload {
  return {
    trip_title: tripTitle,
    days: days
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((day) => {
        const sorted = day.activities.slice().sort((a, b) => a.order - b.order);
        const getSlot = (
          key: ItinerarySlotKey,
        ): ActivitySlot | RestaurantSlot => {
          const act =
            sorted.find((a) => a.category === key) ??
            sorted[ITINERARY_SLOT_KEYS.indexOf(key)];
          const maps = act?.mapsUrl ?? "";
          const cost = act?.cost ?? 0;
          const name = act?.name ?? "";
          if (key === "lunch_restaurant" || key === "dinner_restaurant") {
            return {
              name,
              cuisine: act?.description ?? "",
              estimated_cost_eur: cost,
              Maps_url: maps,
            };
          }
          return {
            name,
            description: act?.description ?? "",
            estimated_cost_eur: cost,
            Maps_url: maps,
          };
        };

        return {
          day_number: day.dayNumber,
          theme: day.title,
          morning_activity: getSlot("morning_activity") as ActivitySlot,
          lunch_restaurant: getSlot("lunch_restaurant") as RestaurantSlot,
          afternoon_activity: getSlot("afternoon_activity") as ActivitySlot,
          dinner_restaurant: getSlot("dinner_restaurant") as RestaurantSlot,
        };
      }),
  };
}
