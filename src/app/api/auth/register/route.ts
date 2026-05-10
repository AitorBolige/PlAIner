import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tots els camps són obligatoris." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contrasenya ha de tenir mínim 8 caràcters." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existing } = await supabaseAdmin
      .from("User")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Aquest email ja està registrat." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabaseAdmin
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name,
        passwordHash,
      })
      .select("id, email, name")
      .single();

    if (error) {
      console.error("[register] supabaseAdmin error:", error);
      return NextResponse.json({ error: "Error en crear el compte." }, { status: 500 });
    }

    await supabaseAdmin.from("LoginEvent").insert({
      id: crypto.randomUUID(),
      userId: user.id,
      email: normalizedEmail,
      method: "credentials",
      success: true,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Error intern del servidor." }, { status: 500 });
  }
}
