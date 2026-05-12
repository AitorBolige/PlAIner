export interface Destination {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  continent: string;
  priceFrom: number;
  tag: string;
  tagColor: string;
  description: string;
  // Unsplash photo IDs curados manualmente — todos verificados
  heroImage: string;
  cardImage: string;
  emoji: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "lisbon",
    city: "Lisboa",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europa",
    priceFrom: 720,
    tag: "Recomanat",
    tagColor: "#0D9E7A",
    description: "Trams, pastéis de nata i tramontana atlàntica",
    heroImage:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=600&q=80&fit=crop&crop=center",
    emoji: "🇵🇹",
  },
  {
    id: "rome",
    city: "Roma",
    country: "Itàlia",
    countryCode: "IT",
    continent: "Europa",
    priceFrom: 850,
    tag: "Popular",
    tagColor: "#E85D3A",
    description: "Historia, pizza al forn de llenya i passeggiata",
    heroImage:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1515542622106-078bda31a6b6?w=600&q=80&fit=crop&crop=center",
    emoji: "🇮🇹",
  },
  {
    id: "tokyo",
    city: "Tòquio",
    country: "Japó",
    countryCode: "JP",
    continent: "Àsia",
    priceFrom: 1800,
    tag: "Premium",
    tagColor: "#3B87E8",
    description: "Neons, temples zen i ramen a les 3am",
    heroImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80&fit=crop&crop=center",
    emoji: "🇯🇵",
  },
  {
    id: "marrakech",
    city: "Marràqueix",
    country: "Marroc",
    countryCode: "MA",
    continent: "Àfrica",
    priceFrom: 640,
    tag: "Oferta",
    tagColor: "#C8860A",
    description: "Souks, jardins secrets i cel estrellat al Sàhara",
    heroImage:
      "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop&crop=center",
    emoji: "🇲🇦",
  },
  {
    id: "paris",
    city: "París",
    country: "França",
    countryCode: "FR",
    continent: "Europa",
    priceFrom: 950,
    tag: "Clàssic",
    tagColor: "#7B61FF",
    description: "Croissants, museus i l'hora daurada a la Seine",
    heroImage:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1431274172761-fcdab704a519?w=600&q=80&fit=crop&crop=center",
    emoji: "🇫🇷",
  },
  {
    id: "bali",
    city: "Bali",
    country: "Indonèsia",
    countryCode: "ID",
    continent: "Àsia",
    priceFrom: 1100,
    tag: "Trending",
    tagColor: "#0D9E7A",
    description: "Temples entre arrossars i posta de sol a Uluwatu",
    heroImage:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80&fit=crop&crop=center",
    emoji: "🇮🇩",
  },
  {
    id: "new-york",
    city: "Nova York",
    country: "EUA",
    countryCode: "US",
    continent: "Amèrica",
    priceFrom: 1400,
    tag: "Icònic",
    tagColor: "#E85D3A",
    description: "Skyline, bagels i Central Park a l'alba",
    heroImage:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80&fit=crop&crop=center",
    emoji: "🇺🇸",
  },
  {
    id: "santorini",
    city: "Santorini",
    country: "Grècia",
    countryCode: "GR",
    continent: "Europa",
    priceFrom: 1300,
    tag: "Romàntic",
    tagColor: "#7B61FF",
    description: "Cases blanques, mar blava i ponent d'escàndol",
    heroImage:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85&fit=crop&crop=center",
    cardImage:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80&fit=crop&crop=center",
    emoji: "🇬🇷",
  },
];

export function getDestinationImage(
  cityName: string,
  size: "card" | "hero" = "card",
): string {
  const name = cityName.toLowerCase();
  const dest = DESTINATIONS.find(
    (d) =>
      d.city.toLowerCase().includes(name) ||
      name.includes(d.city.toLowerCase()),
  );
  if (dest) return size === "hero" ? dest.heroImage : dest.cardImage;
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80&fit=crop&crop=center";
}
