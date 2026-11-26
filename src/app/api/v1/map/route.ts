import { NextResponse } from "next/server";
import { listMapWebcamsByBbox } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxParam = searchParams.get("bbox");
  const zoom = Number(searchParams.get("zoom") ?? "2") || 2;
  const country = searchParams.get("country") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") === "LIVE" ? "LIVE" : undefined;

  let minLng = -180;
  let minLat = -90;
  let maxLng = 180;
  let maxLat = 90;

  if (bboxParam) {
    const parts = bboxParam.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      minLng = Math.max(-180, Math.min(180, parts[0]));
      minLat = Math.max(-90, Math.min(90, parts[1]));
      maxLng = Math.max(-180, Math.min(180, parts[2]));
      maxLat = Math.max(-90, Math.min(90, parts[3]));
    }
  }

  const items = await listMapWebcamsByBbox({
    minLng,
    minLat,
    maxLng,
    maxLat,
    zoom,
    country,
    category,
    status,
  });

  return NextResponse.json({
    total: items.length,
    bbox: [minLng, minLat, maxLng, maxLat],
    zoom,
    items,
  });
}
