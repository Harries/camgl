import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { createPasswordResetToken } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const issued = await createPasswordResetToken(email);
    if (issued) {
      const origin = process.env.SITE_URL?.trim() || new URL(request.url).origin;
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(issued.token)}`;
      await sendPasswordResetEmail({
        to: issued.email,
        name: issued.name,
        resetUrl,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
