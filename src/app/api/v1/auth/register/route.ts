import { NextResponse } from "next/server";
import { registerUser } from "@/lib/repository";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    const res = await registerUser({ name, email, password });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const token = createUserSessionToken(res.user.id);
    const response = NextResponse.json({ ok: true, user: res.user }, { status: 201 });
    response.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
