import { NextResponse } from "next/server";
import { getRandomWebcam } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exclude = searchParams.get("exclude") ?? undefined;
  const cam = await getRandomWebcam(exclude);
  if (!cam) {
    return NextResponse.json({ error: "No live webcams available" }, { status: 404 });
  }
  return NextResponse.json(cam);
}
