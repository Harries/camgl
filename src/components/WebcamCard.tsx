import Link from "next/link";
import type { PublicWebcam } from "@/lib/types";
import { getDaylightInfo } from "@/lib/suncalc";
import { getSourceTypeMeta } from "@/lib/source-badge";

export function WebcamCard({ webcam }: { webcam: PublicWebcam }) {
  const { isDaylight, localTime } = getDaylightInfo(
    webcam.city.lat,
    webcam.city.lng,
    webcam.city.timezone
  );
  const primaryCat = webcam.categories[0]?.name ?? "Live";
  const isLive = webcam.stream?.status === "LIVE";
  const sourceMeta = getSourceTypeMeta(webcam.stream?.sourceType);

  return (
    <Link
      href={`/webcams/${webcam.slug}`}
      className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all shadow-sm flex flex-col"
    >
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        <div
          className={`w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 ${
            isDaylight
              ? "bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900"
              : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800"
          }`}
        >
          <div className="text-center px-4 text-white/90">
            <div className="text-2xl mb-1">{webcam.country.flag}</div>
            <div className="text-xs font-medium opacity-80">{webcam.city.name}</div>
          </div>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
              isLive ? "bg-red-600" : "bg-slate-600"
            }`}
          >
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />}
            {webcam.stream?.status ?? "UNKNOWN"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/55 text-white backdrop-blur">
            {primaryCat}
          </span>
        </div>
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-xs bg-black/60 text-white backdrop-blur tabular-nums">
          {isDaylight ? "☀️" : "🌙"} {localTime}
        </div>
      </div>

      <div className="p-4 space-y-1.5 flex-1">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>
            {webcam.country.flag} {webcam.country.name} · {webcam.city.name}
          </span>
          <span>{webcam.weatherSummary}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {webcam.title}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium border ${sourceMeta.badgeClass}`}>
            {sourceMeta.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
