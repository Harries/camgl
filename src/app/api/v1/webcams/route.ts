import { NextResponse } from "next/server";
import { listApprovedWebcams, listApprovedWebcamsPage, listWebcamsBySlugs } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs");
  if (slugsParam !== null) {
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const items = await listWebcamsBySlugs(slugs);
    return NextResponse.json({ total: items.length, items, hasMore: false });
  }

  const country = searchParams.get("country") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  if (pageParam) {
    const page = Number(pageParam) || 1;
    const pageSize = Number(pageSizeParam) || 12;
    const result = await listApprovedWebcamsPage({
      country,
      city,
      category,
      q,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  }

  const data = await listApprovedWebcams({ country, city, category, q });
  return NextResponse.json({ total: data.length, items: data, hasMore: false });
}
