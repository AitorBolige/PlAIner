import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

const requestSchema = z.object({
  destination: z.string().min(2).max(120),
  startDate: z.string().min(10).max(10), // YYYY-MM-DD
  endDate: z.string().min(10).max(10),
  people: z.number().int().min(1).max(12),
  budgetMax: z.number().int().min(200).max(5000),
});

const aiSchema = z.object({
  destination: z.string(),
  totalCost: z.number(),
  flightCost: z.number(),
  hotelCost: z.number(),
  activitiesCost: z.number(),
  dailyCostEstimate: z.number(),
  days: z
    .array(
      z.object({
        dayNumber: z.number().int().min(1),
        title: z.string(),
        activities: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            startTime: z.string(),
            duration: z.number().int(),
            cost: z.number(),
            category: z.enum([
              "transport",
              "accommodation",
              "food",
              "attraction",
              "experience",
            ]),
            order: z.number().int(),
          })
        ),
      })
    )
    .min(1),
});

const systemPrompt = `Ets un expert en planificació de viatges premium. El teu objectiu és generar itineraris altament personalitzats basant-te en el perfil de l'usuari.

SEMPRE retorna un JSON estructurat amb aquest format exacte:
{
"destination": "string",
"totalCost": number,
"flightCost": number,
"hotelCost": number,
"activitiesCost": number,
"dailyCostEstimate": number,
"days": [
{
"dayNumber": number,
"title": "string",
"activities": [
{
"name": "string",
"description": "string",
"startTime": "HH:MM",
"duration": number (minuts),
"cost": number,
"category": "transport|accommodation|food|attraction|experience",
"order": number
}
]
}
] }

Regles:

El cost total MAI ha de superar el pressupost indicat

Les activitats han de ser reals i adequades per a la destinació

Adapta el ritme al segment d'edat (jove = intensiu, sènior = calmat)

Inclou sempre esmorzar, dinar i sopar com a activitats de cost estimat

Afegeix transport local entre activitats quan sigui necessari

El to de les descripcions ha de ser inspiracional però concret`;

async function generateOnce(params: {
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  budgetMax: number;
  userProfile: {
    ageGroup: string | null;
    travelStyles: string[];
  };
  strictness: "normal" | "tight";
}) {
  const { destination, startDate, endDate, people, budgetMax, userProfile, strictness } =
    params;

  const tightening =
    strictness === "tight"
      ? `IMPORTANT: Ajusta costos agressivament a la baixa. Mantén el total amb un marge del 10% per sota del pressupost.`
      : `IMPORTANT: Mantén el total dins del pressupost indicat sense superar-lo.`;

  const userPrompt = [
    `Destinació: ${destination}`,
    `Dates: ${startDate} a ${endDate}`,
    `Persones: ${people}`,
    `Pressupost màxim (EUR): ${budgetMax}`,
    `Segment d'edat: ${userProfile.ageGroup ?? "no_indicat"}`,
    `Estils: ${userProfile.travelStyles.length ? userProfile.travelStyles.join(", ") : "no_indicat"}`,
    tightening,
    `Torna només el JSON. Sense text extra.`,
  ].join("\n");

  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message?.content ?? "";
  const parsedJson = JSON.parse(content) as unknown;
  return aiSchema.parse(parsedJson);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsedReq = requestSchema.safeParse(json);
  if (!parsedReq.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ageGroup: true, travelStyles: true },
  });

  const userProfile = {
    ageGroup: user?.ageGroup ?? null,
    travelStyles: user?.travelStyles ?? [],
  };

  const { destination, startDate, endDate, people, budgetMax } = parsedReq.data;

  let itinerary:
    | z.infer<typeof aiSchema>
    | null = null;

  const attempts: Array<"normal" | "tight"> = ["normal", "tight"];
  for (const strictness of attempts) {
    try {
      const next = await generateOnce({
        destination,
        startDate,
        endDate,
        people,
        budgetMax,
        userProfile,
        strictness,
      });

      if (next.totalCost <= budgetMax) {
        itinerary = next;
        break;
      }
    } catch {
      // try next attempt
    }
  }

  if (!itinerary) {
    return NextResponse.json(
      { error: "Could not generate a valid itinerary." },
      { status: 502 }
    );
  }

  const trip = await prisma.trip.create({
    data: {
      userId: session.user.id,
      destination: itinerary.destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalCost: itinerary.totalCost,
      flightCost: itinerary.flightCost,
      hotelCost: itinerary.hotelCost,
      activitiesCost: itinerary.activitiesCost,
      dailyCost: itinerary.dailyCostEstimate,
      status: "draft",
      isSurprise: false,
      days: {
        create: itinerary.days
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((d) => ({
            dayNumber: d.dayNumber,
            title: d.title,
            activities: {
              create: d.activities
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((a) => ({
                  name: a.name,
                  description: a.description,
                  startTime: a.startTime,
                  duration: a.duration,
                  cost: a.cost,
                  category: a.category,
                  order: a.order,
                })),
            },
          })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ tripId: trip.id });
}

