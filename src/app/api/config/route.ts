import { NextResponse } from "next/server";

// Exposa configuració pública al client (plainer-mvp.html és estàtic i no
// pot llegir variables d'entorn directament). El token de Mapbox és un token
// públic (pk.) pensat per renderitzar mapes al navegador.
export function GET() {
  return NextResponse.json({
    mapboxToken: process.env.MAPBOX_TOKEN || "",
  });
}
