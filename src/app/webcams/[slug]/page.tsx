import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWebcamBySlug, listApprovedWebcams } from "@/lib/repository";
import { WebcamPlayer } from "@/components/WebcamPlayer";
import { getDaylightInfo } from "@/lib/suncalc";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const webcam = await getWebcamBySlug(slug);
  if (!webcam) return { title: "Webcam Not Found" };
  return {
    title: `${webcam.title} (${webcam.city.name}, ${webcam.country.name})`,
    description: webcam.description,
  };
}

export default async function WebcamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const webcam = await getWebcamBySlug(slug);
  if (!webcam) notFound();

  const related = (await listApprovedWebcams())
    .filter((w) => w.slug !== webcam.slug)
    .slice(0, 4);

  const { isDaylight, localTime } = getDaylightInfo(
    webcam.city.lat,
    webcam.city.lng,
    webcam.city.timezone
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href={`/countries/${webcam.country.slug}`} className="hover:underline">
            {webcam.country.name}
          </Link>
          <span>/</span>
          <Link
            href={`/countries/${webcam.country.slug}/${webcam.city.slug}`}
            className="hover:underline"
          >
            {webcam.city.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{webcam.title}</span>
        </div>
        <Link href="/" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
          ← Back to Discover
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{webcam.title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {webcam.country.flag} {webcam.city.name}, {webcam.country.name} ·{" "}
          {webcam.categories.map((c) => c.name).join(", ")}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        {webcam.stream ? (
          <WebcamPlayer
            title={webcam.title}
            embedUrl={webcam.stream.embedUrl}
            sourceUrl={webcam.stream.sourceUrl}
            sourceType={webcam.stream.sourceType}
          />
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900">
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">Local Time</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {isDaylight ? "☀️" : "🌙"} {localTime}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">Live Weather</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{webcam.weatherSummary}</div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">Stream Status</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
              {webcam.stream?.status ?? "UNKNOWN"}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">Source Attribution</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
              {webcam.provider?.name ?? "Official Partner"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">About This Location</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{webcam.description}</p>
            {webcam.bestTime && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                <div className="font-medium text-slate-900 dark:text-white mb-1">Best Time to Watch</div>
                <div className="text-slate-600 dark:text-slate-300">{webcam.bestTime}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nearby &amp; Related</h3>
              <Link href="/random" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Random →
              </Link>
            </div>
            <div className="space-y-2.5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/webcams/${r.slug}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-16 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm shrink-0">
                    {r.country.flag}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {r.city.name}, {r.country.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
