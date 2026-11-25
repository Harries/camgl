import Link from "next/link";
import {
  listApprovedWebcamsPage,
  listCategories,
  listCountriesSummary,
  listFeaturedWebcams,
} from "@/lib/repository";
import { InfiniteWebcamGrid } from "@/components/InfiniteWebcamGrid";
import { HeroCarousel } from "@/components/HeroCarousel";
import { getServerLocale } from "@/lib/i18n-server";
import {
  formatMessage,
  getCategoryLabel,
  getCountryLabel,
  getMessages,
  localizePath,
} from "@/lib/i18n";

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, locale] = await Promise.all([searchParams, getServerLocale()]);
  const th = getMessages(locale).home;
  const [pageData, categories, countries, featuredSlides] = await Promise.all([
    listApprovedWebcamsPage({
      ...(category ? { category } : {}),
      page: 1,
      pageSize: 12,
    }),
    listCategories(),
    listCountriesSummary(),
    listFeaturedWebcams(6),
  ]);

  const webcams = pageData.items;
  const totalWebcams = pageData.total;

  return (
    <div className="space-y-8">
      {/* Hero Spotlight Carousel */}
      {featuredSlides.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <HeroCarousel slides={featuredSlides} />

            <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-5 bg-white dark:bg-slate-900">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {th.heroEyebrow}
                </div>
                <h2 className="text-xl font-semibold leading-snug text-slate-900 dark:text-white">
                  {th.heroTitle}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {th.heroSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{totalWebcams}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{th.liveCams}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{countries.length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{th.countries}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/70 dark:border-slate-700/80">
                  <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">100%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{th.licensed}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={localizePath("/countries", locale)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {th.exploreMap}
                </Link>
                <Link
                  href={localizePath("/random", locale)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {th.randomCam}
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
            href={localizePath("/", locale)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !category
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
            }`}
          >
            {th.allCategories}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`${localizePath("/", locale)}?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat.slug
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
              }`}
            >
              {getCategoryLabel(locale, cat.slug, cat.name)}
            </Link>
          ))}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {formatMessage(th.showingWebcams, { count: totalWebcams })}
        </div>
      </section>

      {/* Webcam Grid with Infinite Scroll */}
      <InfiniteWebcamGrid
        initialItems={webcams}
        total={totalWebcams}
        initialHasMore={pageData.hasMore}
        category={category}
        pageSize={12}
      />

      {/* Country Directory Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{th.browseByCountry}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{th.browseByCountrySub}</p>
          </div>
          <Link href={localizePath("/countries", locale)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {th.viewAllCountries}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {countries.map((ct) => (
            <Link
              key={ct.slug}
              href={localizePath(`/countries/${ct.slug}`, locale)}
              className="px-3.5 py-2 rounded-lg text-sm border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <span>{ct.flag}</span>
              <span className="font-medium">{getCountryLabel(locale, ct.slug, ct.name)}</span>
              <span className="text-slate-400 dark:text-slate-500">({ct.webcamCount})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
