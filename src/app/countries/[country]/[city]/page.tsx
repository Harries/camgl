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
  params: Promise<{ country: string; city: string }>;
}): Promise<Metadata> {
  const { country, city } = await params;
  const webcams = await listApprovedWebcams({ country, city });
  if (webcams.length === 0) return { title: "City Not Found" };
  const first = webcams[0];
  return {
    title: `${first.city.name}, ${first.country.name} Live Webcams`,
    description: `Watch live webcams in ${first.city.name}, ${first.country.name} with real-time weather and local time.`,
  };
}

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>;
}) {
  const { country, city } = await params;
  const webcams = await listApprovedWebcams({ country, city });
  if (webcams.length === 0) notFound();

  const first = webcams[0];
  const { localTime } = getDaylightInfo(first.city.lat, first.city.lng, first.city.timezone);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/countries" className="hover:underline">Countries</Link>
          <span>/</span>
          <Link href={`/countries/${country}`} className="hover:underline">{first.country.name}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{first.city.name}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {first.country.flag} {first.city.name} Live Webcams
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Local time: <span className="font-medium text-slate-700 dark:text-slate-300">{localTime}</span> · {webcams.length} verified camera{webcams.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>
    </div>
  );
}
