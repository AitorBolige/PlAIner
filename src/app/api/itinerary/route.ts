import { NextRequest, NextResponse } from "next/server";

// Destination → Booking.com destination_id mapping (expand as needed)
const DEST_IDS: Record<string, string> = {
  lisbon: "-2167973", lisboa: "-2167973", lisbonne: "-2167973",
  paris: "-1456928",
  rome: "-126693", roma: "-126693",
  barcelona: "-372490",
  amsterdam: "-2140479",
  london: "-2601889",
  berlin: "-1746443",
  prague: "-553173", praga: "-553173",
  vienna: "-1995499", wien: "-1995499",
  budapest: "-850553",
  athens: "-814876", atenes: "-814876",
  florence: "-114149", firenze: "-114149",
  milan: "-126244", milà: "-126244",
  madrid: "-390625",
  seville: "-402849", sevilla: "-402849",
  porto: "-2170637",
  copenhagen: "-2745636", copenhaguen: "-2745636",
  stockholm: "-2673730",
  oslo: "-630866",
  helsinki: "-634963",
  brussels: "-1970800", brussel: "-1970800",
  zurich: "-2661786",
  geneva: "-2661810",
  dubrovnik: "-552695",
  split: "-552695",
  istanbul: "-755070",
  dubai: "-782831",
  tokyo: "-246227",
  kyoto: "-235402",
  bangkok: "-3218880",
  singapore: "-73635",
  bali: "-1671862",
  marrakech: "-38833",
  cairo: "-290692",
  new_york: "20088325",
  los_angeles: "20131825",
  miami: "20148292",
};

function findDestId(city: string): string | null {
  const key = city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");
  return DEST_IDS[key] ?? DEST_IDS[key.replace(/_/g, "")] ?? null;
}

type Activity = {
  id: string;
  name: string;
  type: string;
  duration: string;
  price: number | null;
  rating: number | null;
  description: string;
  bookingUrl: string | null;
  imageUrl: string | null;
};

type ItineraryDay = {
  day: number;
  date: string;
  theme: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
};

// Curated fallback activities per destination for offline / API-miss situations
const CURATED: Record<string, { activities: Activity[] }> = {
  lisbon: { activities: [
    { id:"l1", name:"Barrio de Alfama y Castillo de São Jorge", type:"tour", duration:"3h", price:0, rating:4.7, description:"Explora el barrio más antiguo de Lisboa, con calles empedradas, miradores y el castillo medieval.", bookingUrl:null, imageUrl:null },
    { id:"l2", name:"Pastelería Belém + Torre de Belém", type:"walk", duration:"2h", price:6, rating:4.8, description:"Prueba el pastel de nata original y visita la icónica torre junto al Tajo.", bookingUrl:null, imageUrl:null },
    { id:"l3", name:"Tram 28 histórico", type:"experience", duration:"1h", price:3, rating:4.5, description:"El tranvía más famoso de Lisboa atraviesa los barrios históricos con vistas increíbles.", bookingUrl:null, imageUrl:null },
    { id:"l4", name:"Mercado da Ribeira Time Out", type:"food", duration:"2h", price:20, rating:4.6, description:"El mejor food market de Lisboa con los top chefs del país.", bookingUrl:null, imageUrl:null },
    { id:"l5", name:"LX Factory", type:"culture", duration:"2h", price:0, rating:4.7, description:"Antigua fábrica reconvertida en espacio creativo con tiendas, restaurantes y arte.", bookingUrl:null, imageUrl:null },
    { id:"l6", name:"Mirador del Parque Eduardo VII", type:"walk", duration:"1.5h", price:0, rating:4.5, description:"Las mejores vistas panorámicas de Lisboa desde las alturas del Marqués de Pombal.", bookingUrl:null, imageUrl:null },
  ]},
  paris: { activities: [
    { id:"p1", name:"Tour Eiffel", type:"landmark", duration:"2h", price:26, rating:4.7, description:"El símbolo de París, mejor visitarlo al amanecer para evitar las colas.", bookingUrl:null, imageUrl:null },
    { id:"p2", name:"Musée du Louvre", type:"museum", duration:"3h", price:17, rating:4.8, description:"Uno de los museos más grandes del mundo, hogar de la Mona Lisa.", bookingUrl:null, imageUrl:null },
    { id:"p3", name:"Paseo por Le Marais", type:"walk", duration:"2h", price:0, rating:4.6, description:"El barrio más trendy de París con galerías, tiendas vintage y la Place des Vosges.", bookingUrl:null, imageUrl:null },
    { id:"p4", name:"Crucero por el Sena", type:"tour", duration:"1.5h", price:15, rating:4.6, description:"La mejor manera de ver los monumentos de París desde el agua.", bookingUrl:null, imageUrl:null },
    { id:"p5", name:"Montmartre y Sacré-Cœur", type:"walk", duration:"2.5h", price:0, rating:4.7, description:"El barrio bohemio con artistas, cafés y vistas espectaculares.", bookingUrl:null, imageUrl:null },
    { id:"p6", name:"Palais Royal y Galerías cubiertas", type:"walk", duration:"1.5h", price:0, rating:4.5, description:"Los pasajes del siglo XIX, perfectos para perderse entre librerías y joyerías.", bookingUrl:null, imageUrl:null },
  ]},
};

const GENERIC_ACTIVITIES: Activity[] = [
  { id:"g1", name:"Free walking tour", type:"tour", duration:"3h", price:0, rating:4.5, description:"La mejor manera de descubrir la ciudad con guías locales expertos.", bookingUrl:null, imageUrl:null },
  { id:"g2", name:"Mercado local de la ciudad", type:"food", duration:"2h", price:15, rating:4.4, description:"Prueba los sabores auténticos de la gastronomía local.", bookingUrl:null, imageUrl:null },
  { id:"g3", name:"Barrio histórico + catedral", type:"walk", duration:"2.5h", price:0, rating:4.5, description:"Pasea por el casco histórico y visita la catedral principal de la ciudad.", bookingUrl:null, imageUrl:null },
  { id:"g4", name:"Museo Nacional de Arte", type:"museum", duration:"2.5h", price:12, rating:4.6, description:"La colección más importante de arte del país en un edificio imponente.", bookingUrl:null, imageUrl:null },
  { id:"g5", name:"Parque central + jardines", type:"walk", duration:"1.5h", price:0, rating:4.4, description:"Paseo relajante por los jardines más emblemáticos de la ciudad.", bookingUrl:null, imageUrl:null },
  { id:"g6", name:"Barrio gastronómico", type:"food", duration:"2h", price:25, rating:4.6, description:"Cena en el barrio más animado con los mejores restaurantes locales.", bookingUrl:null, imageUrl:null },
];

function buildItinerary(activities: Activity[], days: number, city: string, startDate: string): ItineraryDay[] {
  const pool = [...activities];
  const itinerary: ItineraryDay[] = [];
  const themes = ["Descoberta", "Cultura i art", "Gastronomia", "Natura i passeig", "Vida local", "Relax i compres", "Barris amagats"];

  const start = new Date(startDate);

  for (let d = 0; d < days; d++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + d);
    const dateStr = dayDate.toLocaleDateString("ca-ES", { weekday:"long", day:"numeric", month:"long" });

    const pick = () => pool.length > 0 ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : GENERIC_ACTIVITIES[d % GENERIC_ACTIVITIES.length];

    itinerary.push({
      day: d + 1,
      date: dateStr,
      theme: themes[d % themes.length],
      morning: pick(),
      afternoon: pick(),
      evening: pick(),
    });
  }
  return itinerary;
}

async function fetchAttractions(city: string, destId: string): Promise<Activity[]> {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) return [];

  try {
    const url = new URL("https://booking-com15.p.rapidapi.com/api/v1/attraction/searchAttractions");
    url.searchParams.set("id", destId);
    url.searchParams.set("sortBy", "trending");
    url.searchParams.set("currency_code", "EUR");
    url.searchParams.set("languagecode", "es");
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        "x-rapidapi-key": key,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const items: unknown[] = (json?.data?.products ?? json?.data?.attractions ?? []);

    return items.slice(0, 18).map((item: unknown, i: number) => {
      const it = item as Record<string, unknown>;
      const pricing = it.representativePrice as Record<string, unknown> | null ?? null;
      return {
        id: String(it.id ?? i),
        name: String(it.name ?? it.title ?? `Activitat ${i + 1}`),
        type: String((it.primaryLabel as Record<string,unknown>)?.text ?? it.type ?? "tour"),
        duration: String((it.duration as Record<string,unknown>)?.text ?? "2h"),
        price: pricing ? Number(pricing.chargeAmount ?? 0) : null,
        rating: it.reviewsStats ? Number((it.reviewsStats as Record<string,unknown>).combinedNumericStats ? ((it.reviewsStats as Record<string,unknown>).combinedNumericStats as Record<string,unknown>).average : null) : null,
        description: String(it.shortDescription ?? it.description ?? ""),
        bookingUrl: String(it.url ?? it.bookingUrl ?? ""),
        imageUrl: it.primaryPhoto ? String((it.primaryPhoto as Record<string,unknown>).small ?? "") : null,
      } as Activity;
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") ?? "";
  const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "3"), 10);
  const startDate = req.nextUrl.searchParams.get("startDate") ?? new Date().toISOString().slice(0, 10);

  if (!city) return NextResponse.json({ ok: false, error: "city required" }, { status: 400 });

  const cityKey = city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const destId = findDestId(city);

  let activities: Activity[] = [];

  // Try RapidAPI first
  if (destId) {
    activities = await fetchAttractions(city, destId);
  }

  // Fall back to curated or generic
  if (activities.length < 6) {
    const curated = CURATED[cityKey] ?? CURATED[cityKey.replace(/\s/g,"")];
    activities = curated?.activities ?? GENERIC_ACTIVITIES;
  }

  const itinerary = buildItinerary(activities, days, city, startDate);

  return NextResponse.json({ ok: true, city, days, itinerary });
}
