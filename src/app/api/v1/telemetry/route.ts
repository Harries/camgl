import { NextResponse } from "next/server";
import { recordClientError, recordVital } from "@/lib/telemetry-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      name?: string;
      value?: number;
      path?: string;
      message?: string;
    };
    const path = String(body.path ?? "/").slice(0, 120);
    const ts = Date.now();

    if (body.type === "vital") {
      const name = body.name;
      const value = Number(body.value);
      if (
        (name === "LCP" || name === "INP" || name === "CLS") &&
        Number.isFinite(value) &&
        value >= 0
      ) {
        recordVital({ name, value, path, ts });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.type === "error" && body.message) {
      recordClientError({
        message: String(body.message).slice(0, 240),
        path,
        ts,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid telemetry payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
