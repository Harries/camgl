import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.location || !body?.sourceUrl || !body?.contact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const created = await createSubmission({
      title: String(body.title),
      category: String(body.category || "City"),
      location: String(body.location),
      sourceUrl: String(body.sourceUrl),
      operator: body.operator ? String(body.operator) : undefined,
      contact: String(body.contact),
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
