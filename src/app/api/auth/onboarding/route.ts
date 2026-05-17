import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      nickname,
      age,
      gender,
      nationality,
      hobbies,
      avatar,
    } = body ?? {};

    if (!userId) {
      return NextResponse.json(
        { error: "Falta l'usuari." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(age)) {
      return NextResponse.json(
        { error: "Edat invàlida." },
        { status: 400 },
      );
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          nickname,
          age,
          gender,
          nationality,
          hobbies,
          image: avatar || undefined, // Map avatar to image column
        },
      });
    } catch (dbError) {
      console.error("[onboarding] Prisma update error:", dbError);
      return NextResponse.json(
        { error: "No hem pogut guardar l'onboarding en la base de dades." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding]", e);
    return NextResponse.json(
      { error: "Error intern del servidor." },
      { status: 500 },
    );
  }
}
