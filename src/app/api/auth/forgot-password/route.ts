import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

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

      const sendRes = await resend.emails.send({
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
        console.info("[forgot-password] resetUrl:", resetUrl);
        // In dev/testing mode Resend only allows sending to your own email unless a domain is verified.
        // For local debugging we return the resetUrl so you can continue the flow without email delivery.
        if (process.env.NODE_ENV !== "production") {
          return NextResponse.json({
            ok: true,
            dev: true,
            resetUrl,
            resendError: sendRes.error,
          });
        }
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: true, id: sendRes.data?.id });
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
