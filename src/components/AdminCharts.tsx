"use client";

import type { AdminCandidate, PublicWebcam } from "@/lib/types";
import { getSourceTypeMeta } from "@/lib/source-badge";

export function AdminCharts({
  webcams,
  candidates,
}: {
  webcams: (PublicWebcam & { reviewStatus?: string })[];
  candidates: AdminCandidate[];
}) {
  const total = webcams.length || 1;
  const liveCount = webcams.filter((w) => w.stream?.status === "LIVE").length;
  const offlineCount = webcams.length - liveCount;
  const livePct = Math.round((liveCount / total) * 100);

  // Source type breakdown
  const sourceCounts = new Map<string, number>();
  for (const w of webcams) {
    const st = w.stream?.sourceType ?? "youtube";
    sourceCounts.set(st, (sourceCounts.get(st) ?? 0) + 1);
  }
  const sourceEntries = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1]);

  // Top countries breakdown
  const countryCounts = new Map<string, { flag: string; name: string; count: number }>();
  for (const w of webcams) {
    const cur = countryCounts.get(w.country.slug) ?? {
      flag: w.country.flag,
      name: w.country.name,
      count: 0,
    };
    cur.count += 1;
    countryCounts.set(w.country.slug, cur);
  }
  const topCountries = Array.from(countryCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxCountry = topCountries[0]?.count || 1;

  // Category breakdown
  const catCounts = new Map<string, number>();
  for (const w of webcams) {
    for (const c of w.categories) {
      catCounts.set(c.name, (catCounts.get(c.name) ?? 0) + 1);
    }
  }
  const topCats = Array.from(catCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = topCats[0]?.[1] || 1;

  // Candidate stability buckets
  const highStable = candidates.filter((c) => (c.stabilityScore ?? 0) >= 80).length;
  const medStable = candidates.filter((c) => (c.stabilityScore ?? 0) >= 50 && (c.stabilityScore ?? 0) < 80).length;
  const lowStable = candidates.filter((c) => (c.stabilityScore ?? 0) < 50).length;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (livePct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Card 1: Stream Health Donut + Source Mix */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Stream Health &amp; Sources
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">{webcams.length} total</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="text-emerald-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {livePct}%
              </div>
              <div className="text-[10px] text-slate-400">LIVE</div>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
              </span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{liveCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Offline
              </span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{offlineCount}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              {sourceEntries.map(([st, count]) => {
                const meta = getSourceTypeMeta(st);
                return (
                  <div key={st} className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Top Countries Bar Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Coverage by Country
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Top {topCountries.length}</span>
        </div>
        <div className="space-y-2.5">
          {topCountries.map((ct) => {
            const pct = Math.round((ct.count / maxCountry) * 100);
            return (
              <div key={ct.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                    {ct.flag} {ct.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">{ct.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Categories & Candidate Stability */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Categories &amp; Queue Quality
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">{candidates.length} pending</span>
        </div>

        <div className="space-y-2.5">
          {topCats.map(([name, count]) => {
            const pct = Math.round((count / maxCat) * 100);
            return (
              <div key={name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{name}</span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">{count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
            <div className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{highStable}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-500">Score ≥ 80</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
            <div className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">{medStable}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-500">Score 50–79</div>
          </div>
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
            <div className="font-bold text-red-700 dark:text-red-400 tabular-nums">{lowStable}</div>
            <div className="text-[10px] text-red-600 dark:text-red-500">Score &lt; 50</div>
          </div>
        </div>
      </div>
    </div>
  );
}
