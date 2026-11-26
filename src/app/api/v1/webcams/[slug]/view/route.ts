import { NextResponse } from "next/server";
import { incrementWebcamViewCount } from "@/lib/repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const viewCount = await incrementWebcamViewCount(slug);
  if (viewCount === null) {
    return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, viewCount });
}
