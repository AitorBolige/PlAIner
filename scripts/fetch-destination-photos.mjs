/**
 * Fetches city-specific Unsplash photos via the public search API,
 * verifies URLs, and writes VERIFIED_PHOTOS into generate-destinations.mjs.
 */
import fs from "fs";

const SEARCH_NAMES = {
  barcelona: "barcelona spain sagrada familia",
  london: "london big ben skyline",
  amsterdam: "amsterdam canals netherlands",
  berlin: "berlin brandenburg gate",
  prague: "prague charles bridge",
  vienna: "vienna austria city",
  budapest: "budapest parliament danube",
  dubai: "dubai skyline burj khalifa",
  istanbul: "istanbul blue mosque",
  cairo: "cairo pyramids egypt",
  "cape-town": "cape town table mountain",
  nairobi: "nairobi kenya city",
  bangkok: "bangkok thailand temple",
  singapore: "singapore marina bay",
  "hong-kong": "hong kong skyline",
  seoul: "seoul korea city",
  beijing: "beijing forbidden city",
  shanghai: "shanghai skyline bund",
  delhi: "new delhi india gate",
  mumbai: "mumbai gateway of india",
  sydney: "sydney opera house",
  melbourne: "melbourne australia city",
  auckland: "auckland new zealand skyline",
  "los-angeles": "los angeles hollywood sign",
  "san-francisco": "san francisco golden gate",
  chicago: "chicago skyline",
  miami: "miami beach art deco",
  "mexico-city": "mexico city zocalo",
  cancun: "cancun beach caribbean",
  "rio-de-janeiro": "rio de janeiro christ redeemer",
  "buenos-aires": "buenos aires obelisco",
  lima: "lima peru miraflores",
  bogota: "bogota colombia city",
  havana: "havana cuba old town",
  montreal: "montreal canada city",
  vancouver: "vancouver canada skyline",
  toronto: "toronto cn tower",
  reykjavik: "reykjavik iceland",
  copenhagen: "copenhagen nyhavn",
  stockholm: "stockholm sweden city",
  oslo: "oslo norway fjord",
  helsinki: "helsinki finland cathedral",
  warsaw: "warsaw poland old town",
  krakow: "krakow poland market square",
  athens: "athens acropolis greece",
  dubrovnik: "dubrovnik croatia old town",
  venice: "venice italy canal gondola",
  florence: "florence italy duomo",
  milan: "milan italy duomo cathedral",
  nice: "nice france promenade anglais",
};

function parsePhotoId(url) {
  if (!url || !url.includes("images.unsplash.com/photo-")) return null;
  const m = url.match(/photo-\d+-[a-f0-9]+/i);
  return m ? m[0] : null;
}

async function searchPhotos(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Search failed for "${query}": ${res.status}`);
  const data = await res.json();
  const ids = [];
  for (const r of data.results ?? []) {
    const raw = r.urls?.raw ?? r.urls?.regular ?? "";
    if (raw.includes("plus.unsplash.com")) continue;
    const id = parsePhotoId(raw);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function verifyPhotoId(photoId) {
  const url = `https://images.unsplash.com/${photoId}?w=600&q=80&fit=crop&crop=center`;
  const res = await fetch(url, { redirect: "follow" });
  return res.ok;
}

async function pickPhotos(cityId, query) {
  const ids = await searchPhotos(query);
  const verified = [];
  for (const id of ids) {
    if (await verifyPhotoId(id)) verified.push(id);
    if (verified.length >= 2) break;
  }
  if (verified.length < 2) {
    throw new Error(`Not enough verified photos for ${cityId} (query: ${query})`);
  }
  return { hero: verified[0], card: verified[1] };
}

async function main() {
  const photos = {};
  for (const [cityId, query] of Object.entries(SEARCH_NAMES)) {
    process.stdout.write(`Fetching ${cityId}… `);
    photos[cityId] = await pickPhotos(cityId, query);
    console.log(photos[cityId].hero, photos[cityId].card);
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = "scripts/verified-photos.json";
  fs.writeFileSync(outPath, JSON.stringify(photos, null, 2) + "\n");
  console.log(`\nWrote ${outPath}`);

  // Patch generate-destinations.mjs
  const genPath = "scripts/generate-destinations.mjs";
  let gen = fs.readFileSync(genPath, "utf8");
  const block = `/** Verified Unsplash photo IDs — city-specific, fetched from Unsplash search. */\nconst VERIFIED_PHOTOS = ${JSON.stringify(photos, null, 2)};\n`;
  gen = gen.replace(/\/\*\* Verified Unsplash photo IDs[\s\S]*?^};\n/m, block);
  fs.writeFileSync(genPath, gen);
  console.log(`Updated ${genPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
