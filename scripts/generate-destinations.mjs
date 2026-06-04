import fs from "fs";

const TAGS = ["Recomanat", "Popular", "Premium", "Oferta", "Clàssic", "Trending", "Icònic", "Romàntic"];
const COLORS = ["#0D9E7A", "#E85D3A", "#3B87E8", "#C8860A", "#7B61FF"];

/** Verified Unsplash photo IDs — city-specific, fetched from Unsplash search. */
const VERIFIED_PHOTOS = {
  "barcelona": {
    "hero": "photo-1650964827770-421afa7960ac",
    "card": "photo-1735424325493-7dec695219c4"
  },
  "london": {
    "hero": "photo-1681407979872-0a4cbde28391",
    "card": "photo-1625756475700-f8e8396172c0"
  },
  "amsterdam": {
    "hero": "photo-1534351590666-13e3e96b5017",
    "card": "photo-1584003564911-a7a321c84e1c"
  },
  "berlin": {
    "hero": "photo-1587330979470-3595ac045ab0",
    "card": "photo-1560969184-10fe8719e047"
  },
  "prague": {
    "hero": "photo-1564511287568-54483b52a35e",
    "card": "photo-1600623471616-8c1966c91ff6"
  },
  "vienna": {
    "hero": "photo-1516550893923-42d28e5677af",
    "card": "photo-1519923041107-e4dc8d9193da"
  },
  "budapest": {
    "hero": "photo-1616432902940-b7a1acbc60b3",
    "card": "photo-1610752400564-c97cbbb5cfba"
  },
  "dubai": {
    "hero": "photo-1512453979798-5ea266f8880c",
    "card": "photo-1651467606797-e1c660cf3fda"
  },
  "istanbul": {
    "hero": "photo-1691446930608-98466a4bdd0f",
    "card": "photo-1580139644189-14a08f064717"
  },
  "cairo": {
    "hero": "photo-1553913861-c0fddf2619ee",
    "card": "photo-1539768942893-daf53e448371"
  },
  "cape-town": {
    "hero": "photo-1588455471455-4b28e9ab3cd5",
    "card": "photo-1604763655221-b98ebdac6ddf"
  },
  "nairobi": {
    "hero": "photo-1669127300649-940337f1487e",
    "card": "photo-1643913224222-17cc6adb2dfc"
  },
  "bangkok": {
    "hero": "photo-1563492065599-3520f775eeed",
    "card": "photo-1510379872535-9310dc6fd6a7"
  },
  "singapore": {
    "hero": "photo-1525625293386-3f8f99389edd",
    "card": "photo-1496939376851-89342e90adcd"
  },
  "hong-kong": {
    "hero": "photo-1620015092538-e33c665fc181",
    "card": "photo-1536599018102-9f803c140fc1"
  },
  "seoul": {
    "hero": "photo-1535189043414-47a3c49a0bed",
    "card": "photo-1506816561089-5cc37b3aa9b0"
  },
  "beijing": {
    "hero": "photo-1614555383820-941c466f1b52",
    "card": "photo-1577706881850-bf7c7d8906a5"
  },
  "shanghai": {
    "hero": "photo-1545893835-abaa50cbe628",
    "card": "photo-1612756336279-b9eb5b6b71d9"
  },
  "delhi": {
    "hero": "photo-1587474260584-136574528ed5",
    "card": "photo-1592639296346-560c37a0f711"
  },
  "mumbai": {
    "hero": "photo-1595658658481-d53d3f999875",
    "card": "photo-1573143950521-36ef5345dae9"
  },
  "sydney": {
    "hero": "photo-1624138784614-87fd1b6528f8",
    "card": "photo-1506973035872-a4ec16b8e8d9"
  },
  "melbourne": {
    "hero": "photo-1595434971780-79d5c20c5090",
    "card": "photo-1545044846-351ba102b6d5"
  },
  "auckland": {
    "hero": "photo-1595125990323-885cec5217ff",
    "card": "photo-1507699622108-4be3abd695ad"
  },
  "los-angeles": {
    "hero": "photo-1534253893894-10d024888e49",
    "card": "photo-1589053739346-ed32227546a4"
  },
  "san-francisco": {
    "hero": "photo-1521747116042-5a810fda9664",
    "card": "photo-1719858403364-83f7442a197e"
  },
  "chicago": {
    "hero": "photo-1477959858617-67f85cf4f1df",
    "card": "photo-1714662660476-022bfd34cf44"
  },
  "miami": {
    "hero": "photo-1562517634-baa2da3acfbf",
    "card": "photo-1543968332-f99478b1ebdc"
  },
  "mexico-city": {
    "hero": "photo-1564975930846-3da8c44284a5",
    "card": "photo-1705891848979-ef4dcccc3437"
  },
  "cancun": {
    "hero": "photo-1602088113235-229c19758e9f",
    "card": "photo-1565358720137-55235e0878a2"
  },
  "rio-de-janeiro": {
    "hero": "photo-1594387295585-34ba732932c8",
    "card": "photo-1604664474914-39713aa96dbf"
  },
  "buenos-aires": {
    "hero": "photo-1706170421190-48b12aa10f5e",
    "card": "photo-1678838032358-d5ef71b283db"
  },
  "lima": {
    "hero": "photo-1660521844005-015733ce411e",
    "card": "photo-1693492157127-4a1f3c945aa5"
  },
  "bogota": {
    "hero": "photo-1568632234157-ce7aecd03d0d",
    "card": "photo-1512617835784-a92626c0a554"
  },
  "havana": {
    "hero": "photo-1584098181992-e7f35b51f85a",
    "card": "photo-1748646848389-fbf2a42d5b1b"
  },
  "montreal": {
    "hero": "photo-1519178251-5390a0fb6a3f",
    "card": "photo-1545956146-d70420cd4320"
  },
  "vancouver": {
    "hero": "photo-1730661906876-18bfc6e95f2f",
    "card": "photo-1553855804-5ccc88ae0a2b"
  },
  "toronto": {
    "hero": "photo-1569982615761-66697da68502",
    "card": "photo-1632857997897-9418428d7368"
  },
  "reykjavik": {
    "hero": "photo-1606130503037-6a8ef67c9d2d",
    "card": "photo-1465353471565-b77e538f34c9"
  },
  "copenhagen": {
    "hero": "photo-1561113500-8f4ad4f80a93",
    "card": "photo-1722624225640-f80790628f07"
  },
  "stockholm": {
    "hero": "photo-1508189860359-777d945909ef",
    "card": "photo-1588653818221-2651ec1a6423"
  },
  "oslo": {
    "hero": "photo-1725993486972-f569d8038915",
    "card": "photo-1703534645782-b76687c3c3d1"
  },
  "helsinki": {
    "hero": "photo-1538332576228-eb5b4c4de6f5",
    "card": "photo-1568008842610-6642e5afe517"
  },
  "warsaw": {
    "hero": "photo-1553422734-fd8dd260a116",
    "card": "photo-1607427293702-036933bbf746"
  },
  "krakow": {
    "hero": "photo-1563177978-4c5ffc081b2a",
    "card": "photo-1577133192629-5140c5371590"
  },
  "athens": {
    "hero": "photo-1603565816030-6b389eeb23cb",
    "card": "photo-1555993539-1732b0258235"
  },
  "dubrovnik": {
    "hero": "photo-1555990793-da11153b2473",
    "card": "photo-1575540291670-8d3b26f7d327"
  },
  "venice": {
    "hero": "photo-1566984991763-91b985a3f9c2",
    "card": "photo-1578507840562-370632c7559f"
  },
  "florence": {
    "hero": "photo-1687817997684-c9335cce7c5c",
    "card": "photo-1691319683356-c8ac7f6647c1"
  },
  "milan": {
    "hero": "photo-1610016302534-6f67f1c968d8",
    "card": "photo-1572602648934-1d98de6dab48"
  },
  "nice": {
    "hero": "photo-1643914729809-4aa59fdc4c17",
    "card": "photo-1521309033026-f3438b7c4264"
  }
};

const cities = [
  { id: "barcelona", city: "Barcelona", country: "Espanya", cc: "ES", cont: "Europa", price: 420, desc: "Gaudí, platges mediterrànies i tapas al Barri Gòtic", hero: "photo-1583422409516-2895a77efded", card: "photo-1562883676-796263fd4352", emoji: "🇪🇸", iata: "BCN", loc: { ca: "Barcelona", es: "Barcelona", en: "Barcelona", de: "Barcelona", fr: "Barcelone", it: "Barcellona", pt: "Barcelona", ar: "برشلونة", zh: "巴塞罗那", hi: "बार्सिलोना" }, vars: ["barcelona", "barcelone", "barcellona"] },
  { id: "london", city: "Londres", country: "Regne Unit", cc: "GB", cont: "Europa", price: 680, desc: "Big Ben, teatre i mercats vintage al East End", hero: "photo-1513635269977-fa7beb992874", card: "photo-1529655683826-5b13f2074ed9", emoji: "🇬🇧", iata: "LHR", loc: { ca: "Londres", es: "Londres", en: "London", de: "London", fr: "Londres", it: "Londra", pt: "Londres", ar: "لندن", zh: "伦敦", hi: "लंदन" }, vars: ["london", "londres", "londra"] },
  { id: "amsterdam", city: "Amsterdam", country: "Països Baixos", cc: "NL", cont: "Europa", price: 590, desc: "Canales, bicicletes i museus de mestres", hero: "photo-1534351590656-254e9de1d136", card: "photo-1528909514055-37fd9e472178", emoji: "🇳🇱", iata: "AMS", loc: { ca: "Amsterdam", es: "Ámsterdam", en: "Amsterdam", de: "Amsterdam", fr: "Amsterdam", it: "Amsterdam", pt: "Amesterdão", ar: "أمستردام", zh: "阿姆斯特丹", hi: "एम्स्टर्डम" }, vars: ["amsterdam"] },
  { id: "berlin", city: "Berlín", country: "Alemanya", cc: "DE", cont: "Europa", price: 620, desc: "Història viva, art urbà i vida nocturna infinita", hero: "photo-1560963184-9feba909b586", card: "photo-1587330979470-3595af96a466", emoji: "🇩🇪", iata: "BER", loc: { ca: "Berlín", es: "Berlín", en: "Berlin", de: "Berlin", fr: "Berlin", it: "Berlino", pt: "Berlim", ar: "برlin", zh: "柏林", hi: "बर्लिन" }, vars: ["berlin", "berlino", "berlim"] },
  { id: "prague", city: "Praga", country: "Txèquia", cc: "CZ", cont: "Europa", price: 540, desc: "Castell gòtic, cervesa artesana i pont de Carles", hero: "photo-1541841651914-5368d5672840", card: "photo-1519676860729-636353ff7978", emoji: "🇨🇿", iata: "PRG", loc: { ca: "Praga", es: "Praga", en: "Prague", de: "Prag", fr: "Prague", it: "Praga", pt: "Praga", ar: "براغ", zh: "布拉格", hi: "प्राग" }, vars: ["prague", "praga", "prag"] },
  { id: "vienna", city: "Viena", country: "Àustria", cc: "AT", cont: "Europa", price: 710, desc: "Palauos imperials, cafès vienèsos i vals clàssic", hero: "photo-1516550805091-8a0985c1f638", card: "photo-1607790210452-82e8a7c3c3c3", emoji: "🇦🇹", iata: "VIE", loc: { ca: "Viena", es: "Viena", en: "Vienna", de: "Wien", fr: "Vienne", it: "Vienna", pt: "Viena", ar: "فيenna", zh: "维也纳", hi: "वियना" }, vars: ["vienna", "viena", "wien", "vienne"] },
  { id: "budapest", city: "Budapest", country: "Hongria", cc: "HU", cont: "Europa", price: 480, desc: "Banys termals, Danubi il·luminat i ruïnes bars", hero: "photo-1541845602337-5c59d4c20d4c", card: "photo-1541742429971-0df3b2185d1a", emoji: "🇭🇺", iata: "BUD", loc: { ca: "Budapest", es: "Budapest", en: "Budapest", de: "Budapest", fr: "Budapest", it: "Budapest", pt: "Budapeste", ar: "بudapest", zh: "布达佩斯", hi: "बुडापेस्ट" }, vars: ["budapest", "budapeste"] },
  { id: "dubai", city: "Dubai", country: "EAU", cc: "AE", cont: "Àsia", price: 1200, desc: "Gratacels futuristes, desert i luxe àrab", hero: "photo-1512453979798-5ea266f8880c", card: "photo-1518684079-177caa7a9300", emoji: "🇦🇪", iata: "DXB", loc: { ca: "Dubai", es: "Dubái", en: "Dubai", de: "Dubai", fr: "Dubaï", it: "Dubai", pt: "Dubai", ar: "دبي", zh: "迪拜", hi: "दुबई" }, vars: ["dubai", "dubái"] },
  { id: "istanbul", city: "Istanbul", country: "Turquia", cc: "TR", cont: "Europa", price: 650, desc: "Mesquita blava, bazars i pont entre continents", hero: "photo-1524231757912-21f4fe3a7200", card: "photo-1527838837500-f11da7043124", emoji: "🇹🇷", iata: "IST", loc: { ca: "Istanbul", es: "Estambul", en: "Istanbul", de: "Istanbul", fr: "Istanbul", it: "Istanbul", pt: "Istambul", ar: "إسطنبول", zh: "伊斯坦布尔", hi: "इस्तांबुल" }, vars: ["istanbul", "estambul", "istambul"] },
  { id: "cairo", city: "El Caire", country: "Egipte", cc: "EG", cont: "Àfrica", price: 780, desc: "Piràmides de Giza, Nil i tresors faraònics", hero: "photo-1572256894668-4c278a98f9e2", card: "photo-1539768942893-87959708144e", emoji: "🇪🇬", iata: "CAI", loc: { ca: "El Caire", es: "El Cairo", en: "Cairo", de: "Kairo", fr: "Le Caire", it: "Il Cairo", pt: "Cairo", ar: "القاهرة", zh: "开罗", hi: "काहिरा" }, vars: ["cairo", "el caire", "el cairo", "kairo"] },
  { id: "cape-town", city: "Ciutat del Cap", country: "Sud-àfrica", cc: "ZA", cont: "Àfrica", price: 1350, desc: "Taula Mountain, vinyes i costa de l'Indic", hero: "photo-1580060839134-75ac5c2d93ff", card: "photo-1520256437865-176a551d5a2e", emoji: "🇿🇦", iata: "CPT", loc: { ca: "Ciutat del Cap", es: "Ciudad del Cabo", en: "Cape Town", de: "Kapstadt", fr: "Le Cap", it: "Città del Capo", pt: "Cidade do Cabo", ar: "كيب تاون", zh: "开普敦", hi: "केप टाउन" }, vars: ["cape-town", "cape town", "ciutat del cap", "ciudad del cabo", "kapstadt"] },
  { id: "nairobi", city: "Nairobi", country: "Kenya", cc: "KE", cont: "Àfrica", price: 1180, desc: "Safari urbà, parcs nacionals i cultura masaai", hero: "photo-1611348584986-b9781739627e", card: "photo-1604984448627-14199d36adc3", emoji: "🇰🇪", iata: "NBO", loc: { ca: "Nairobi", es: "Nairobi", en: "Nairobi", de: "Nairobi", fr: "Nairobi", it: "Nairobi", pt: "Nairóbi", ar: "نairobi", zh: "内罗毕", hi: "नairobi" }, vars: ["nairobi"] },
  { id: "bangkok", city: "Bangkok", country: "Tailàndia", cc: "TH", cont: "Àsia", price: 980, desc: "Temples daurats, street food i mercats flotants", hero: "photo-1508009603885-50cf7c579365", card: "photo-1563492065599-3520f775eeed", emoji: "🇹🇭", iata: "BKK", loc: { ca: "Bangkok", es: "Bangkok", en: "Bangkok", de: "Bangkok", fr: "Bangkok", it: "Bangkok", pt: "Banguecoque", ar: "بانkok", zh: "曼谷", hi: "बैंकॉक" }, vars: ["bangkok", "banguecoque"] },
  { id: "singapore", city: "Singapur", country: "Singapur", cc: "SG", cont: "Àsia", price: 1250, desc: "Jardins futuristes, hawkers i skyline ultramodern", hero: "photo-1525626920920-3d6ff4af75b7", card: "photo-1546414366-e988912171b7", emoji: "🇸🇬", iata: "SIN", loc: { ca: "Singapur", es: "Singapur", en: "Singapore", de: "Singapur", fr: "Singapour", it: "Singapore", pt: "Singapura", ar: "سنغافورة", zh: "新加坡", hi: "सिंगापुर" }, vars: ["singapore", "singapur", "singapour", "singapura"] },
  { id: "hong-kong", city: "Hong Kong", country: "Xina", cc: "HK", cont: "Àsia", price: 1100, desc: "Rascacels, dim sum i vistes des de Victoria Peak", hero: "photo-1536599018102-241f1410e00d", card: "photo-1518509562904-7fc6b7f40617", emoji: "🇭🇰", iata: "HKG", loc: { ca: "Hong Kong", es: "Hong Kong", en: "Hong Kong", de: "Hongkong", fr: "Hong Kong", it: "Hong Kong", pt: "Hong Kong", ar: "هونغ كong", zh: "香港", hi: "हांगकांग" }, vars: ["hong-kong", "hong kong", "hongkong"] },
  { id: "seoul", city: "Seül", country: "Corea del Sud", cc: "KR", cont: "Àsia", price: 1150, desc: "K-pop, palauos reials i barri de Gangnam", hero: "photo-1517157599199-27989697a1da", card: "photo-1534275731402-4058b1fb76e3", emoji: "🇰🇷", iata: "ICN", loc: { ca: "Seül", es: "Seúl", en: "Seoul", de: "Seoul", fr: "Séoul", it: "Seul", pt: "Seul", ar: "سoul", zh: "首尔", hi: "सियोल" }, vars: ["seoul", "seul", "séoul"] },
  { id: "beijing", city: "Pequín", country: "Xina", cc: "CN", cont: "Àsia", price: 1050, desc: "Ciutat Prohibida, Muralla Xinesa i hutongs antics", hero: "photo-1508804185872-ca966a542e92", card: "photo-1547981609-812a8b5a0a6a", emoji: "🇨🇳", iata: "PEK", loc: { ca: "Pequín", es: "Pekín", en: "Beijing", de: "Peking", fr: "Pékin", it: "Pechino", pt: "Pequim", ar: "بekin", zh: "北京", hi: "बीजिंग" }, vars: ["beijing", "pequín", "pekin", "peking", "pechino", "pequim"] },
  { id: "shanghai", city: "Xangai", country: "Xina", cc: "CN", cont: "Àsia", price: 1020, desc: "Bund neoclàssic, torres futuristes i metro infinit", hero: "photo-1545893835-0d8955f621c1", card: "photo-1548910345-4b4a9770e8b8", emoji: "🇨🇳", iata: "PVG", loc: { ca: "Xangai", es: "Shanghái", en: "Shanghai", de: "Shanghai", fr: "Shanghai", it: "Shanghai", pt: "Xangai", ar: "shanghai", zh: "上海", hi: "शंघाई" }, vars: ["shanghai", "xangai", "shangai"] },
  { id: "delhi", city: "Nova Delhi", country: "Índia", cc: "IN", cont: "Àsia", price: 920, desc: "Fort Vermell, temples i caos encantador", hero: "photo-1587474260614-425826fb686c", card: "photo-1524492412937-9c73f375f544", emoji: "🇮🇳", iata: "DEL", loc: { ca: "Nova Delhi", es: "Nueva Delhi", en: "New Delhi", de: "Neu-Delhi", fr: "New Delhi", it: "Nuova Delhi", pt: "Nova Deli", ar: "delhi", zh: "新德里", hi: "नई दिल्ली" }, vars: ["delhi", "new delhi", "nova delhi", "nueva delhi"] },
  { id: "mumbai", city: "Bombai", country: "Índia", cc: "IN", cont: "Àsia", price: 890, desc: "Bollywood, Gateway of India i mercats colorits", hero: "photo-1564507592333-60612e996af8", card: "photo-1570168007281-ba1140a27e6f", emoji: "🇮🇳", iata: "BOM", loc: { ca: "Bombai", es: "Mumbai", en: "Mumbai", de: "Mumbai", fr: "Mumbai", it: "Mumbai", pt: "Bombaim", ar: "mumbai", zh: "孟买", hi: "मुंबई" }, vars: ["mumbai", "bombai", "bombaim"] },
  { id: "sydney", city: "Sydney", country: "Austràlia", cc: "AU", cont: "Oceania", price: 1650, desc: "Opera House, platges d'or i badia espectacular", hero: "photo-1506973035872-a4ec16b8e786", card: "photo-1523482580672-1099758f3671", emoji: "🇦🇺", iata: "SYD", loc: { ca: "Sydney", es: "Sídney", en: "Sydney", de: "Sydney", fr: "Sydney", it: "Sydney", pt: "Sydney", ar: "sydney", zh: "悉尼", hi: "सिडनी" }, vars: ["sydney", "sídney", "sidney"] },
  { id: "melbourne", city: "Melbourne", country: "Austràlia", cc: "AU", cont: "Oceania", price: 1580, desc: "Cafès hipsters, street art i Great Ocean Road", hero: "photo-1514391194647-4e85610e9c2a", card: "photo-1506976788708-39d8b12b5be3", emoji: "🇦🇺", iata: "MEL", loc: { ca: "Melbourne", es: "Melbourne", en: "Melbourne", de: "Melbourne", fr: "Melbourne", it: "Melbourne", pt: "Melbourne", ar: "melbourne", zh: "墨尔本", hi: "मेलबर्न" }, vars: ["melbourne"] },
  { id: "auckland", city: "Auckland", country: "Nova Zelanda", cc: "NZ", cont: "Oceania", price: 1720, desc: "Volcans, vela i porta d'entrada a la natura kiwi", hero: "photo-1540962351504-0304e9030df9", card: "photo-1507692047038-3c812a576f86", emoji: "🇳🇿", iata: "AKL", loc: { ca: "Auckland", es: "Auckland", en: "Auckland", de: "Auckland", fr: "Auckland", it: "Auckland", pt: "Auckland", ar: "auckland", zh: "奥克兰", hi: "ऑकलैंड" }, vars: ["auckland"] },
  { id: "los-angeles", city: "Los Angeles", country: "EUA", cc: "US", cont: "Amèrica", price: 1320, desc: "Hollywood, platges de California i palmeres infinites", hero: "photo-1515894209671-62c653e282ec", card: "photo-1534190760163-5877401607e7", emoji: "🇺🇸", iata: "LAX", loc: { ca: "Los Angeles", es: "Los Ángeles", en: "Los Angeles", de: "Los Angeles", fr: "Los Angeles", it: "Los Angeles", pt: "Los Angeles", ar: "los angeles", zh: "洛杉矶", hi: "लॉस एंजिल्स" }, vars: ["los-angeles", "los angeles"] },
  { id: "san-francisco", city: "San Francisco", country: "EUA", cc: "US", cont: "Amèrica", price: 1380, desc: "Golden Gate, cable cars i Silicon Valley", hero: "photo-1501594907655-ac7c896cc295", card: "photo-1489821881117-5940cc7630b8", emoji: "🇺🇸", iata: "SFO", loc: { ca: "San Francisco", es: "San Francisco", en: "San Francisco", de: "San Francisco", fr: "San Francisco", it: "San Francisco", pt: "São Francisco", ar: "san francisco", zh: "旧金山", hi: "सैन फ्रांसिस्को" }, vars: ["san-francisco", "san francisco", "são francisco"] },
  { id: "chicago", city: "Chicago", country: "EUA", cc: "US", cont: "Amèrica", price: 1280, desc: "Arquitectura art déco, deep dish pizza i jazz", hero: "photo-1485951720904-a219f246585a", card: "photo-1494523634680-489789ed5540", emoji: "🇺🇸", iata: "ORD", loc: { ca: "Chicago", es: "Chicago", en: "Chicago", de: "Chicago", fr: "Chicago", it: "Chicago", pt: "Chicago", ar: "chicago", zh: "芝加哥", hi: "शिकागो" }, vars: ["chicago"] },
  { id: "miami", city: "Miami", country: "EUA", cc: "US", cont: "Amèrica", price: 1180, desc: "Art Deco, platges tropicals i vida nocturna llatina", hero: "photo-1506966953602-c20cc11f75e3", card: "photo-1514217904023-081431ff6b4b", emoji: "🇺🇸", iata: "MIA", loc: { ca: "Miami", es: "Miami", en: "Miami", de: "Miami", fr: "Miami", it: "Miami", pt: "Miami", ar: "ميامي", zh: "迈阿密", hi: "मियामी" }, vars: ["miami"] },
  { id: "mexico-city", city: "Ciutat de Mèxic", country: "Mèxic", cc: "MX", cont: "Amèrica", price: 950, desc: "Tacos, Frida Kahlo i arquitectura precolombina", hero: "photo-1518654950459-37f3164aa9ea", card: "photo-1526409713299-0312a4a5be44", emoji: "🇲🇽", iata: "MEX", loc: { ca: "Ciutat de Mèxic", es: "Ciudad de México", en: "Mexico City", de: "Mexiko-Stadt", fr: "Mexico", it: "Città del Messico", pt: "Cidade do México", ar: "mexico city", zh: "墨西哥城", hi: "मेक्सिको सिटी" }, vars: ["mexico-city", "mexico city", "ciudad de mexico", "ciutat de mexic", "mexiko-stadt"] },
  { id: "cancun", city: "Cancún", country: "Mèxic", cc: "MX", cont: "Amèrica", price: 1050, desc: "Carib turquesa, ruïnes maies i resorts de somni", hero: "photo-1579368233728-56025f769290", card: "photo-1555109308-0e7d4e5e8b5a", emoji: "🇲🇽", iata: "CUN", loc: { ca: "Cancún", es: "Cancún", en: "Cancun", de: "Cancún", fr: "Cancún", it: "Cancún", pt: "Cancún", ar: "cancun", zh: "坎昆", hi: "कैनकुन" }, vars: ["cancun", "cancún"] },
  { id: "rio-de-janeiro", city: "Rio de Janeiro", country: "Brasil", cc: "BR", cont: "Amèrica", price: 1150, desc: "Crist Redemptor, Copacabana i samba al carnaval", hero: "photo-1483728642387-6c3dd035fa95", card: "photo-1548013146-72479768bada", emoji: "🇧🇷", iata: "GIG", loc: { ca: "Rio de Janeiro", es: "Río de Janeiro", en: "Rio de Janeiro", de: "Rio de Janeiro", fr: "Rio de Janeiro", it: "Rio de Janeiro", pt: "Rio de Janeiro", ar: "rio", zh: "里约热内卢", hi: "रियो" }, vars: ["rio-de-janeiro", "rio de janeiro", "rio"] },
  { id: "buenos-aires", city: "Buenos Aires", country: "Argentina", cc: "AR", cont: "Amèrica", price: 1080, desc: "Tango, bistecs argentins i barri de La Boca", hero: "photo-1589903304766-9b6c715c367b", card: "photo-1612355208817-8c4d2f2c2b2b", emoji: "🇦🇷", iata: "EZE", loc: { ca: "Buenos Aires", es: "Buenos Aires", en: "Buenos Aires", de: "Buenos Aires", fr: "Buenos Aires", it: "Buenos Aires", pt: "Buenos Aires", ar: "buenos aires", zh: "布宜诺斯艾利斯", hi: "ब्यूनस आयर्स" }, vars: ["buenos-aires", "buenos aires"] },
  { id: "lima", city: "Lima", country: "Perú", cc: "PE", cont: "Amèrica", price: 1020, desc: "Ceviche premiat, Miraflores i història inca", hero: "photo-1587595432828-fb59a79143cb", card: "photo-1531968455001-8742464e6d76", emoji: "🇵🇪", iata: "LIM", loc: { ca: "Lima", es: "Lima", en: "Lima", de: "Lima", fr: "Lima", it: "Lima", pt: "Lima", ar: "lima", zh: "利马", hi: "लीमा" }, vars: ["lima"] },
  { id: "bogota", city: "Bogotà", country: "Colòmbia", cc: "CO", cont: "Amèrica", price: 980, desc: "La Candelaria, cafè d'altura i Monserrate", hero: "photo-1564851469569-bb371b185c3b", card: "photo-1592419047466-d253292cb597", emoji: "🇨🇴", iata: "BOG", loc: { ca: "Bogotà", es: "Bogotá", en: "Bogota", de: "Bogotá", fr: "Bogota", it: "Bogotà", pt: "Bogotá", ar: "bogota", zh: "波哥大", hi: "बोगोटा" }, vars: ["bogota", "bogotá", "bogotà"] },
  { id: "havana", city: "L'Havana", country: "Cuba", cc: "CU", cont: "Amèrica", price: 890, desc: "Cadillacs vintage, salsa i mojitos a la Malecón", hero: "photo-1561214115-f2f134cc4912", card: "photo-1515638348639-f5e089612d1e", emoji: "🇨🇺", iata: "HAV", loc: { ca: "L'Havana", es: "La Habana", en: "Havana", de: "Havanna", fr: "La Havane", it: "L'Avana", pt: "Havana", ar: "havana", zh: "哈瓦那", hi: "हवाना" }, vars: ["havana", "l'havana", "la habana", "havanna", "avana"] },
  { id: "montreal", city: "Montreal", country: "Canadà", cc: "CA", cont: "Amèrica", price: 1120, desc: "Mont Royal, francès quebequès i jazz festival", hero: "photo-1519179143618-b9461188870e", card: "photo-1553537389-ee99a0a47d5a", emoji: "🇨🇦", iata: "YUL", loc: { ca: "Montreal", es: "Montreal", en: "Montreal", de: "Montreal", fr: "Montréal", it: "Montreal", pt: "Montreal", ar: "montreal", zh: "蒙特利尔", hi: "मॉन्ट्रियल" }, vars: ["montreal", "montréal"] },
  { id: "vancouver", city: "Vancouver", country: "Canadà", cc: "CA", cont: "Amèrica", price: 1280, desc: "Muntanyes i oceà, Stanley Park i sushi fresc", hero: "photo-1559517282-d9503539a5a6", card: "photo-1577972225127-491dd4710529", emoji: "🇨🇦", iata: "YVR", loc: { ca: "Vancouver", es: "Vancouver", en: "Vancouver", de: "Vancouver", fr: "Vancouver", it: "Vancouver", pt: "Vancouver", ar: "vancouver", zh: "温哥华", hi: "वैंकूवर" }, vars: ["vancouver"] },
  { id: "toronto", city: "Toronto", country: "Canadà", cc: "CA", cont: "Amèrica", price: 1150, desc: "CN Tower, barri multicultural i llacs cristal·lins", hero: "photo-1517935702185-3fbb818bc08c", card: "photo-1557932262-3d71b2f2c2c2", emoji: "🇨🇦", iata: "YYZ", loc: { ca: "Toronto", es: "Toronto", en: "Toronto", de: "Toronto", fr: "Toronto", it: "Toronto", pt: "Toronto", ar: "toronto", zh: "多伦多", hi: "टोरonto" }, vars: ["toronto"] },
  { id: "reykjavik", city: "Reykjavík", country: "Islàndia", cc: "IS", cont: "Europa", price: 1450, desc: "Aurora boreal, geysers i aventura àrtica", hero: "photo-1486931643691-cb91d4f81e76", card: "photo-1504829857797-f480d1f0e769", emoji: "🇮🇸", iata: "KEF", loc: { ca: "Reykjavík", es: "Reykjavík", en: "Reykjavik", de: "Reykjavík", fr: "Reykjavik", it: "Reykjavík", pt: "Reiquiavique", ar: "ريكيافيك", zh: "雷克雅未克", hi: "रेक्याविक" }, vars: ["reykjavik", "reykjavík", "reiquiavique"] },
  { id: "copenhagen", city: "Copenhaguen", country: "Dinamarca", cc: "DK", cont: "Europa", price: 980, desc: "Nyhavn colorit, hygge danès i bicicletes everywhere", hero: "photo-1513622470522-26c3c8a854bc", card: "photo-1559126123-0d0155e2c7d4", emoji: "🇩🇰", iata: "CPH", loc: { ca: "Copenhaguen", es: "Copenhague", en: "Copenhagen", de: "Kopenhagen", fr: "Copenhague", it: "Copenaghen", pt: "Copenhaga", ar: "كوبnhagen", zh: "哥本哈根", hi: "कोपेनहेगन" }, vars: ["copenhagen", "copenhaguen", "copenhague", "kopenhagen", "copenaghen"] },
  { id: "stockholm", city: "Estocolm", country: "Suècia", cc: "SE", cont: "Europa", price: 920, desc: "Arquitectura nòrdica, illes del Bàltic i design escandinau", hero: "photo-1509356844750-b0f7dadce9b1", card: "photo-1513611300099-8eee78593b6a", emoji: "🇸🇪", iata: "ARN", loc: { ca: "Estocolm", es: "Estocolmo", en: "Stockholm", de: "Stockholm", fr: "Stockholm", it: "Stoccolma", pt: "Estocolmo", ar: "stockholm", zh: "斯德哥尔摩", hi: "स्टॉकहोlm" }, vars: ["stockholm", "estocolm", "estocolmo", "stoccolma"] },
  { id: "oslo", city: "Oslo", country: "Noruega", cc: "NO", cont: "Europa", price: 1080, desc: "Fiords, museu Munch i natura nòrdica salvatge", hero: "photo-1571683813406-4c8f5e2c2c2c", card: "photo-1588668214400-def20a7c6e2f", emoji: "🇳🇴", iata: "OSL", loc: { ca: "Oslo", es: "Oslo", en: "Oslo", de: "Oslo", fr: "Oslo", it: "Oslo", pt: "Oslo", ar: "oslo", zh: "奥斯陆", hi: "ओslo" }, vars: ["oslo"] },
  { id: "helsinki", city: "Hèlsinki", country: "Finlàndia", cc: "FI", cont: "Europa", price: 890, desc: "Saunes finlandeses, disseny nòrdic i arxipèlag bàltic", hero: "photo-1538335496681-99b776e367e7", card: "photo-1493225457124-a3eb161ffa5f", emoji: "🇫🇮", iata: "HEL", loc: { ca: "Hèlsinki", es: "Helsinki", en: "Helsinki", de: "Helsinki", fr: "Helsinki", it: "Helsinki", pt: "Helsínquia", ar: "helsinki", zh: "赫尔辛基", hi: "हेलसिंकी" }, vars: ["helsinki", "helsínquia"] },
  { id: "warsaw", city: "Varsòvia", country: "Polònia", cc: "PL", cont: "Europa", price: 460, desc: "Ciutat vella reconstruïda, història polonesa i pierogi", hero: "photo-1519192243975-40733087793e", card: "photo-1591951668350-155a3cf1b951", emoji: "🇵🇱", iata: "WAW", loc: { ca: "Varsòvia", es: "Varsovia", en: "Warsaw", de: "Warschau", fr: "Varsovie", it: "Varsavia", pt: "Varsóvia", ar: "warsaw", zh: "华沙", hi: "वarsaw" }, vars: ["warsaw", "varsovia", "varsòvia", "warschau", "varsovie", "varsavia"] },
  { id: "krakow", city: "Cracòvia", country: "Polònia", cc: "PL", cont: "Europa", price: 440, desc: "Plaça del Mercat medieval, castells i cultura jueva", hero: "photo-1591951668350-155a3cf1b951", card: "photo-1552728088-6a8f2c2c2c2c", emoji: "🇵🇱", iata: "KRK", loc: { ca: "Cracòvia", es: "Cracovia", en: "Krakow", de: "Krakau", fr: "Cracovie", it: "Cracovia", pt: "Cracóvia", ar: "krakow", zh: "克拉科夫", hi: "कrakow" }, vars: ["krakow", "cracovia", "cracòvia", "krakau", "cracovie"] },
  { id: "athens", city: "Atenes", country: "Grècia", cc: "GR", cont: "Europa", price: 620, desc: "Acròpolis, tavernes i postes de sol a la Plaka", hero: "photo-1555993539-1732b0258235", card: "photo-1579574070940-be7bbe2f2f2f", emoji: "🇬🇷", iata: "ATH", loc: { ca: "Atenes", es: "Atenas", en: "Athens", de: "Athen", fr: "Athènes", it: "Atene", pt: "Atenas", ar: "أثينا", zh: "雅典", hi: "एथेंस" }, vars: ["athens", "atenes", "atenas", "athen", "atene", "athènes"] },
  { id: "dubrovnik", city: "Dubrovnik", country: "Croàcia", cc: "HR", cont: "Europa", price: 780, desc: "Muralla medieval, Adriàtic turquesa i escenes de GoT", hero: "photo-1555993766-41c8c4c4c4c4", card: "photo-1562424116-b87359c723d4", emoji: "🇭🇷", iata: "DBV", loc: { ca: "Dubrovnik", es: "Dubrovnik", en: "Dubrovnik", de: "Dubrovnik", fr: "Dubrovnik", it: "Dubrovnik", pt: "Dubrovnik", ar: "dubrovnik", zh: "杜布罗夫尼克", hi: "डubrovnik" }, vars: ["dubrovnik"] },
  { id: "venice", city: "Venècia", country: "Itàlia", cc: "IT", cont: "Europa", price: 820, desc: "Canals romàntics, gondoles i Piazza San Marco", hero: "photo-1514896945-9f0bed746d7d", card: "photo-1498422633726-6a9a992eb1b2", emoji: "🇮🇹", iata: "VCE", loc: { ca: "Venècia", es: "Venecia", en: "Venice", de: "Venedig", fr: "Venise", it: "Venezia", pt: "Veneza", ar: "venice", zh: "威尼斯", hi: "वेनिस" }, vars: ["venice", "venecia", "venècia", "venedig", "venise", "venezia", "veneza"] },
  { id: "florence", city: "Florència", country: "Itàlia", cc: "IT", cont: "Europa", price: 760, desc: "Duomo, Uffizi i renaixement a cada cantonada", hero: "photo-1497170750286-853444eb6a7f", card: "photo-1544881607-9964-2c2c2c2c2c2c", emoji: "🇮🇹", iata: "FLR", loc: { ca: "Florència", es: "Florencia", en: "Florence", de: "Florenz", fr: "Florence", it: "Firenze", pt: "Florença", ar: "florence", zh: "佛罗伦萨", hi: "फ्लोरेंस" }, vars: ["florence", "florencia", "florència", "florenz", "firenze", "florença"] },
  { id: "milan", city: "Milà", country: "Itàlia", cc: "IT", cont: "Europa", price: 740, desc: "Moda italiana, Duomo gòtic i aperitivo milanès", hero: "photo-1513586184384-b2395850511f", card: "photo-1516483635261-47e0efb17ec0", emoji: "🇮🇹", iata: "MXP", loc: { ca: "Milà", es: "Milán", en: "Milan", de: "Mailand", fr: "Milan", it: "Milano", pt: "Milão", ar: "milan", zh: "米兰", hi: "मिलान" }, vars: ["milan", "milà", "milán", "milano", "milão", "mailand"] },
  { id: "nice", city: "Niça", country: "França", cc: "FR", cont: "Europa", price: 680, desc: "Costa Blava, promenade i sol mediterrani tot l'any", hero: "photo-1493225457124-a3eb161ffa5f", card: "photo-1497846313833-841ad3b106d2", emoji: "🇫🇷", iata: "NCE", loc: { ca: "Niça", es: "Niza", en: "Nice", de: "Nizza", fr: "Nice", it: "Nizza", pt: "Nice", ar: "nice", zh: "尼斯", hi: "नाइस" }, vars: ["nice", "niça", "niza", "nizza"] },
];

const countryLocales = {
  ES: { ca: "Espanya", es: "España", en: "Spain", de: "Spanien", fr: "Espagne", it: "Spagna", pt: "Espanha", ar: "إسبانيا", zh: "西班牙", hi: "स्पेन" },
  GB: { ca: "Regne Unit", es: "Reino Unido", en: "United Kingdom", de: "Vereinigtes Königreich", fr: "Royaume-Uni", it: "Regno Unito", pt: "Reino Unido", ar: "المملكة المتحدة", zh: "英国", hi: "यूनाइटेड किंगडम" },
  NL: { ca: "Països Baixos", es: "Países Bajos", en: "Netherlands", de: "Niederlande", fr: "Pays-Bas", it: "Paesi Bassi", pt: "Países Baixos", ar: "هolanda", zh: "荷兰", hi: "नीदरलैंड" },
  DE: { ca: "Alemanya", es: "Alemania", en: "Germany", de: "Deutschland", fr: "Allemagne", it: "Germania", pt: "Alemanha", ar: "ألمانيا", zh: "德国", hi: "जर्मनी" },
  CZ: { ca: "Txèquia", es: "Chequia", en: "Czechia", de: "Tschechien", fr: "Tchéquie", it: "Cechia", pt: "Chéquia", ar: "التشيك", zh: "捷克", hi: "चेकिया" },
  AT: { ca: "Àustria", es: "Austria", en: "Austria", de: "Österreich", fr: "Autriche", it: "Austria", pt: "Áustria", ar: "النمسا", zh: "奥地利", hi: "ऑस्ट्रिया" },
  HU: { ca: "Hongria", es: "Hungría", en: "Hungary", de: "Ungarn", fr: "Hongrie", it: "Ungheria", pt: "Hungria", ar: "المجر", zh: "匈牙利", hi: "हंगरी" },
  AE: { ca: "EAU", es: "EAU", en: "UAE", de: "VAE", fr: "Émirats arabes unis", it: "EAU", pt: "EAU", ar: "الإمارات", zh: "阿联酋", hi: "यूएई" },
  TR: { ca: "Turquia", es: "Turquía", en: "Turkey", de: "Türkei", fr: "Turquie", it: "Turchia", pt: "Turquia", ar: "تركيا", zh: "土耳其", hi: "तुर्की" },
  EG: { ca: "Egipte", es: "Egipto", en: "Egypt", de: "Ägypten", fr: "Égypte", it: "Egitto", pt: "Egito", ar: "مصر", zh: "埃及", hi: "मिस्र" },
  ZA: { ca: "Sud-àfrica", es: "Sudáfrica", en: "South Africa", de: "Südafrika", fr: "Afrique du Sud", it: "Sudafrica", pt: "África do Sul", ar: "جنوب أفريقيا", zh: "南非", hi: "दक्षिण अफ्रीका" },
  KE: { ca: "Kenya", es: "Kenia", en: "Kenya", de: "Kenia", fr: "Kenya", it: "Kenya", pt: "Quénia", ar: "كينيا", zh: "肯尼亚", hi: "केन्या" },
  TH: { ca: "Tailàndia", es: "Tailandia", en: "Thailand", de: "Thailand", fr: "Thaïlande", it: "Thailandia", pt: "Tailândia", ar: "تايلاند", zh: "泰国", hi: "थाईलैंड" },
  SG: { ca: "Singapur", es: "Singapur", en: "Singapore", de: "Singapur", fr: "Singapour", it: "Singapore", pt: "Singapura", ar: "سنغافورة", zh: "新加坡", hi: "सिंगापुर" },
  HK: { ca: "Hong Kong", es: "Hong Kong", en: "Hong Kong", de: "Hongkong", fr: "Hong Kong", it: "Hong Kong", pt: "Hong Kong", ar: "هونغ كong", zh: "香港", hi: "हांगकांग" },
  KR: { ca: "Corea del Sud", es: "Corea del Sur", en: "South Korea", de: "Südkorea", fr: "Corée du Sud", it: "Corea del Sud", pt: "Coreia do Sul", ar: "كorea", zh: "韩国", hi: "दक्षिण कोरिया" },
  CN: { ca: "Xina", es: "China", en: "China", de: "China", fr: "Chine", it: "Cina", pt: "China", ar: "الصين", zh: "中国", hi: "चीन" },
  IN: { ca: "Índia", es: "India", en: "India", de: "Indien", fr: "Inde", it: "India", pt: "Índia", ar: "الهند", zh: "印度", hi: "भारत" },
  AU: { ca: "Austràlia", es: "Australia", en: "Australia", de: "Australien", fr: "Australie", it: "Australia", pt: "Austrália", ar: "أستراليا", zh: "澳大利亚", hi: "ऑस्ट्रेलिया" },
  NZ: { ca: "Nova Zelanda", es: "Nueva Zelanda", en: "New Zealand", de: "Neuseeland", fr: "Nouvelle-Zélande", it: "Nuova Zelanda", pt: "Nova Zelanda", ar: "نيوزيلندا", zh: "新西兰", hi: "न्यूज़ीलैंड" },
  MX: { ca: "Mèxic", es: "México", en: "Mexico", de: "Mexiko", fr: "Mexique", it: "Messico", pt: "México", ar: "المكسيك", zh: "墨西哥", hi: "मेक्सिको" },
  BR: { ca: "Brasil", es: "Brasil", en: "Brazil", de: "Brasilien", fr: "Brésil", it: "Brasile", pt: "Brasil", ar: "البرازيل", zh: "巴西", hi: "ब्राज़ील" },
  AR: { ca: "Argentina", es: "Argentina", en: "Argentina", de: "Argentinien", fr: "Argentine", it: "Argentina", pt: "Argentina", ar: "الأرgentina", zh: "阿根廷", hi: "अर्जेंटीना" },
  PE: { ca: "Perú", es: "Perú", en: "Peru", de: "Peru", fr: "Pérou", it: "Perù", pt: "Peru", ar: "بeru", zh: "秘鲁", hi: "पेरू" },
  CO: { ca: "Colòmbia", es: "Colombia", en: "Colombia", de: "Kolumbien", fr: "Colombie", it: "Colombia", pt: "Colômbia", ar: "كolombia", zh: "哥伦比亚", hi: "कोलंबिया" },
  CU: { ca: "Cuba", es: "Cuba", en: "Cuba", de: "Kuba", fr: "Cuba", it: "Cuba", pt: "Cuba", ar: "كuba", zh: "古巴", hi: "क्यूबा" },
  CA: { ca: "Canadà", es: "Canadá", en: "Canada", de: "Kanada", fr: "Canada", it: "Canada", pt: "Canadá", ar: "كanada", zh: "加拿大", hi: "कनाडा" },
  IS: { ca: "Islàndia", es: "Islandia", en: "Iceland", de: "Island", fr: "Islande", it: "Islanda", pt: "Islândia", ar: "آيسلندا", zh: "冰岛", hi: "आइसलैंड" },
  DK: { ca: "Dinamarca", es: "Dinamarca", en: "Denmark", de: "Dänemark", fr: "Danemark", it: "Danimarca", pt: "Dinamarca", ar: "الدنmark", zh: "丹麦", hi: "डेनमार्क" },
  SE: { ca: "Suècia", es: "Suecia", en: "Sweden", de: "Schweden", fr: "Suède", it: "Svezia", pt: "Suécia", ar: "السوeden", zh: "瑞典", hi: "स्वीडन" },
  NO: { ca: "Noruega", es: "Noruega", en: "Norway", de: "Norwegen", fr: "Norvège", it: "Norvegia", pt: "Noruega", ar: "الnorway", zh: "挪威", hi: "नॉर्वे" },
  FI: { ca: "Finlàndia", es: "Finlandia", en: "Finland", de: "Finnland", fr: "Finlande", it: "Finlandia", pt: "Finlândia", ar: "فinland", zh: "芬兰", hi: "फिनलैंड" },
  PL: { ca: "Polònia", es: "Polonia", en: "Poland", de: "Polen", fr: "Pologne", it: "Polonia", pt: "Polónia", ar: "بoland", zh: "波兰", hi: "पोलैंड" },
  HR: { ca: "Croàcia", es: "Croacia", en: "Croatia", de: "Kroatien", fr: "Croatie", it: "Croazia", pt: "Croácia", ar: "كroatia", zh: "克罗地亚", hi: "क्रोएशिया" },
};

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function img(id, w) {
  return `https://images.unsplash.com/${id}?w=${w}&q=${w > 800 ? 85 : 80}&fit=crop&crop=center`;
}

console.log("Count:", cities.length);

for (const c of cities) {
  const photos = VERIFIED_PHOTOS[c.id];
  if (!photos) throw new Error(`Missing VERIFIED_PHOTOS for ${c.id}`);
  c.hero = photos.hero;
  c.card = photos.card;
}

let destTs = `/** 50 additional curated destinations. */\nexport const EXTRA_DESTINATIONS = [\n`;
cities.forEach((c, i) => {
  const tag = TAGS[i % TAGS.length];
  const color = COLORS[i % COLORS.length];
  destTs += `  {
    id: "${c.id}",
    city: "${esc(c.city)}",
    country: "${esc(c.country)}",
    countryCode: "${c.cc}",
    continent: "${c.cont}",
    priceFrom: ${c.price},
    tag: "${tag}",
    tagColor: "${color}",
    description: "${esc(c.desc)}",
    heroImage: "${img(c.hero, 1200)}",
    cardImage: "${img(c.card, 600)}",
    emoji: "${c.emoji}",
  },
`;
});
destTs += `];\n`;

let i18nTs = `type DestinationLocale = "ca" | "es" | "en" | "de" | "fr" | "it" | "pt" | "ar" | "zh" | "hi";\n\nexport type CityLocales = Record<string, Record<DestinationLocale, string>>;\n\nexport const EXTRA_CITY_LOCALES: CityLocales = {\n`;
cities.forEach((c) => {
  const loc = c.loc;
  i18nTs += `  "${c.id}": { ca: "${esc(loc.ca)}", es: "${esc(loc.es)}", en: "${esc(loc.en)}", de: "${esc(loc.de)}", fr: "${esc(loc.fr)}", it: "${esc(loc.it)}", pt: "${esc(loc.pt)}", ar: "${esc(loc.ar)}", zh: "${esc(loc.zh)}", hi: "${esc(loc.hi)}" },\n`;
});
i18nTs += `};\n\nexport const EXTRA_CITY_VARIANTS: Record<string, string> = {\n`;
const seenVariants = new Set();
cities.forEach((c) => {
  const all = [...c.vars, c.id];
  all.forEach((v) => {
    const key = v.toLowerCase();
    if (seenVariants.has(key)) return;
    seenVariants.add(key);
    i18nTs += `  "${esc(key)}": "${c.id}",\n`;
  });
});
i18nTs += `};\n\nexport const EXTRA_COUNTRY_CODES: Record<string, Record<DestinationLocale, string>> = {\n`;
Object.entries(countryLocales).forEach(([cc, loc]) => {
  i18nTs += `  ${cc}: { ca: "${esc(loc.ca)}", es: "${esc(loc.es)}", en: "${esc(loc.en)}", de: "${esc(loc.de)}", fr: "${esc(loc.fr)}", it: "${esc(loc.it)}", pt: "${esc(loc.pt)}", ar: "${esc(loc.ar)}", zh: "${esc(loc.zh)}", hi: "${esc(loc.hi)}" },\n`;
});
i18nTs += `};\n\n/** Extra city id / variant → IATA for flight lookup. */\nexport const EXTRA_FLIGHT_IATA: Record<string, string> = {\n`;
const seenIata = new Set();
cities.forEach((c) => {
  const entries = [c.id, ...c.vars];
  entries.forEach((v) => {
    const key = v.toLowerCase();
    if (seenIata.has(key)) return;
    seenIata.add(key);
    i18nTs += `  "${esc(key)}": "${c.iata}",\n`;
  });
});
i18nTs += `};\n`;

fs.writeFileSync("src/lib/destinations-extra.ts", destTs);
fs.writeFileSync("src/lib/destination-i18n-data.ts", i18nTs);
console.log("Written src/lib/destinations-extra.ts and src/lib/destination-i18n-data.ts");

async function verifyUrls(file) {
  const text = fs.readFileSync(file, "utf8");
  const urls = [...text.matchAll(/https:\/\/images\.unsplash\.com\/[^"]+/g)].map((m) => m[0]);
  let bad = 0;
  for (const url of urls) {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) {
      bad++;
      console.error("BAD", r.status, url);
    }
  }
  if (bad) throw new Error(`${bad} broken image URLs in ${file}`);
  console.log(`Verified ${urls.length} image URLs in ${file}`);
}

(async () => {
  await verifyUrls("src/lib/destinations-extra.ts");
})();
