import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    const res = await resetPasswordWithToken(token, password);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
