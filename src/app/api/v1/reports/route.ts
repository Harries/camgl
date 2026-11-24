import { NextResponse } from "next/server";
import { createReport } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.webcamId || !body?.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const report = createReport({
      webcamId: String(body.webcamId),
      webcamTitle: String(body.webcamTitle || body.webcamId),
      type: String(body.type),
      description: body.description ? String(body.description) : undefined,
    });
    return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
