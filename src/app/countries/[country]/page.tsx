import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listApprovedWebcams } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { getDaylightInfo } from "@/lib/suncalc";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const webcams = await listApprovedWebcams({ country });
  if (webcams.length === 0) return { title: "Country Not Found" };
  const countryName = webcams[0].country.name;
  return {
    title: `${countryName} Live Webcams`,
    description: `Watch ${webcams.length} verified live webcams across cities in ${countryName}.`,
  };
}

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const webcams = await listApprovedWebcams({ country });
  if (webcams.length === 0) notFound();

  const countryInfo = webcams[0].country;
  const cityMap = new Map<
    string,
    { name: string; slug: string; localTime: string; count: number }
  >();
  for (const w of webcams) {
    const existing = cityMap.get(w.city.slug);
    if (existing) {
      existing.count += 1;
    } else {
      const { localTime } = getDaylightInfo(w.city.lat, w.city.lng, w.city.timezone);
      cityMap.set(w.city.slug, { name: w.city.name, slug: w.city.slug, localTime, count: 1 });
    }
  }
  const cities = Array.from(cityMap.values());

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/countries" className="hover:underline">Countries</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{countryInfo.name}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {countryInfo.flag} {countryInfo.name} Live Webcams
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Explore {webcams.length} verified live streams across {cities.length} {cities.length === 1 ? "city" : "cities"} in {countryInfo.name}.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Cities in {countryInfo.name}</h2>
        <div className="flex flex-wrap gap-2.5">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/countries/${country}/${c.slug}`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:bg-white hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-blue-500 transition-all flex items-center gap-2"
            >
              <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
              <span className="text-slate-400 dark:text-slate-500 tabular-nums">{c.localTime}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                {c.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>
    </div>
  );
}
