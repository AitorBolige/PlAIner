import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: true });

    const { data: user } = await getSupabaseAdmin()
      .from("User")
      .select("id, email")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (user) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { error: insertErr } = await getSupabaseAdmin()
        .from("PasswordResetToken")
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          token,
          expires,
          used: false,
        });
      if (insertErr) {
        console.error("[forgot-password] token insert error:", insertErr);
        return NextResponse.json(
          { ok: false, error: "No s'ha pogut crear el token." },
          { status: 500 },
        );
      }

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

      const sendRes = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: user.email,
        subject: "Restableix la teva contrasenya · PlAIner",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
            <h2 style="color:#0D9E7A">Restablir contrasenya</h2>
            <p>Hem rebut una sol·licitud per restablir la contrasenya del teu compte.</p>
            <p>Clica el botó per crear una nova contrasenya. L'enllaç és vàlid durant <strong>1 hora</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#0D9E7A;color:#fff;border-radius:24px;text-decoration:none;font-weight:700">
              Restablir contrasenya
            </a>
            <p style="color:#888;font-size:13px">Si no has fet aquesta sol·licitud, pots ignorar aquest email.</p>
          </div>
        `,
      });
      if (sendRes.error) {
        console.error("[forgot-password] resend error:", sendRes.error);
        // Resend free tier only delivers to verified addresses; log the
        // resetUrl server-side so dev can recover it from logs without
        // ever returning it in the HTTP response.
        if (process.env.NODE_ENV !== "production") {
          console.info("[forgot-password] dev resetUrl:", resetUrl);
        }
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json(
      { ok: false, error: "Error intern del servidor." },
      { status: 500 },
    );
  }
}
