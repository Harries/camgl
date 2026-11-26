import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/mailer";
import { registerUser } from "@/lib/repository";
import { createUserSessionToken, isSecureRequest, USER_COOKIE_NAME } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    const code = String(body?.code ?? "").trim();

    const res = await registerUser({ name, email, password, code });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    sendWelcomeEmail({
      to: res.user.email,
      name: res.user.name,
      siteUrl: process.env.SITE_URL?.trim() || origin,
    }).catch(() => {});

    const token = createUserSessionToken(res.user.id);
    const response = NextResponse.json({ ok: true, user: res.user }, { status: 201 });
    response.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
