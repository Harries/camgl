import { NextResponse } from "next/server";
import { isSmtpConfigured, sendVerificationCodeEmail } from "@/lib/mailer";
import { createEmailVerificationCode } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim();

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "Mail server is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)." },
        { status: 503 }
      );
    }

    const res = await createEmailVerificationCode(email);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const mailRes = await sendVerificationCodeEmail({
      to: res.email,
      code: res.code,
    });
    if (!mailRes.sent) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please check SMTP settings." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
