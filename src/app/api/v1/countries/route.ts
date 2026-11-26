import { NextResponse } from "next/server";
import { listCountriesWithCities } from "@/lib/repository";

export async function GET() {
  const countries = await listCountriesWithCities();
  return NextResponse.json(
    { countries },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
