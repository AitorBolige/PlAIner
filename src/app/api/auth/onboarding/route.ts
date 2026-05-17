import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

    const { error } = await getSupabaseAdmin()
      .from("User")
      .update({
        nickname,
        age,
        gender,
        nationality,
        hobbies,
        avatar,
      })
      .eq("id", userId);

    if (error) {
      console.error("[onboarding] supabaseAdmin error:", error);
      return NextResponse.json(
        { error: "No hem pogut guardar l'onboarding." },
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
