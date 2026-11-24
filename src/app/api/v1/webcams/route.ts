import { NextResponse } from "next/server";
import { listApprovedWebcams } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const data = await listApprovedWebcams({ country, city, category, q });
  return NextResponse.json({ total: data.length, items: data });
}
