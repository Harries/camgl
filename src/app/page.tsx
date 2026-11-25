import Link from "next/link";
import { listApprovedWebcams, listCategories, listCountriesSummary } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { getWebcamPreviewUrl } from "@/components/WebcamThumbnail";

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [webcams, categories, countries] = await Promise.all([
    listApprovedWebcams(category ? { category } : undefined),
    listCategories(),
    listCountriesSummary(),
  ]);

  const featured = webcams[0];
  const featuredPreview = getWebcamPreviewUrl(featured?.stream);

  return (
    <div className="space-y-8">
      {/* Hero Spotlight */}
      {featured && (
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <Link
              href={`/webcams/${featured.slug}`}
              className="lg:col-span-7 relative min-h-[260px] sm:min-h-[320px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 p-6 flex flex-col justify-between text-white group overflow-hidden"
            >
              {featuredPreview && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPreview}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
                </>
              )}
              <div className="relative z-10 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                  <span className="w-2 h-2 rounded-full bg-white live-dot" />
                  LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 backdrop-blur">
                  Featured Spotlight
                </span>
              </div>
              <div className="relative z-10 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-300">
                    {featured.country.flag} {featured.country.name} · {featured.city.name}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold mt-1">{featured.title}</h1>
                </div>
                <span className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-slate-900 group-hover:scale-105 transition-transform shrink-0 shadow">
                  Watch Live →
                </span>
              </div>
            </Link>

            <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-5 bg-white dark:bg-slate-900">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Explore the World in Real Time
                </div>
                <h2 className="text-xl font-semibold leading-snug text-slate-900 dark:text-white">
                  Verified scenic webcams, local weather &amp; live timezones — free, no login required.
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Browse by country, city, or category. Every stream is reviewed for licensing and privacy, embedded via official players, and monitored every 30 minutes.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{webcams.length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Live Cams</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{countries.length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Countries</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">100%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Licensed</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/countries"
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  🗺️ Explore Map &amp; Countries
                </Link>
                <Link
                  href="/random"
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  🎲 Random Cam
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter Bar */}
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !category
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat.slug
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Showing {webcams.length} webcams</div>
      </section>

      {/* Webcam Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </section>

      {/* Country Directory Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Browse by Country &amp; City</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Hierarchical SEO directories with local time &amp; weather context</p>
          </div>
          <Link href="/countries" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View all countries →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {countries.map((ct) => (
            <Link
              key={ct.slug}
              href={`/countries/${ct.slug}`}
              className="px-3.5 py-2 rounded-lg text-sm border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <span>{ct.flag}</span>
              <span className="font-medium">{ct.name}</span>
              <span className="text-slate-400 dark:text-slate-500">({ct.webcamCount})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
