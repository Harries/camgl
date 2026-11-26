import { NextResponse } from "next/server";
import { createSubmission, getUserById } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  const user = userId ? await getUserById(userId) : null;
  if (!user) {
    return NextResponse.json({ error: "Login required to submit a webcam" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const contact = body?.contact ? String(body.contact).trim() : user.email;
    if (!body?.title || !body?.location || !body?.sourceUrl || !contact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const created = await createSubmission({
      title: String(body.title),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category || "City"),
      location: String(body.location),
      sourceUrl: String(body.sourceUrl),
      operator: body.operator ? String(body.operator) : undefined,
      contact,
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
