import { NextResponse } from "next/server";
import { getRandomWebcam } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeSlug = searchParams.get("exclude") ?? undefined;
  const country = searchParams.get("country") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const cam = await getRandomWebcam({ excludeSlug, country, category });
  if (!cam) {
    return NextResponse.json({ error: "No live webcams available" }, { status: 404 });
  }
  return NextResponse.json(cam);
}
