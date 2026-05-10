import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Dades incorrectes." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contrasenya ha de tenir mínim 8 caràcters." }, { status: 400 });
    }

    const { data: resetToken } = await supabaseAdmin
      .from("PasswordResetToken")
      .select("id, userId, expires, used")
      .eq("token", token)
      .single();

    if (!resetToken || resetToken.used || new Date(resetToken.expires) < new Date()) {
      return NextResponse.json({ error: "L'enllaç no és vàlid o ha caducat." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await supabaseAdmin
      .from("User")
      .update({ passwordHash })
      .eq("id", resetToken.userId);

    await supabaseAdmin
      .from("PasswordResetToken")
      .update({ used: true })
      .eq("id", resetToken.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Error intern del servidor." }, { status: 500 });
  }
}
