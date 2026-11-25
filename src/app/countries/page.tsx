import Link from "next/link";
import type { Metadata } from "next";
import { listApprovedWebcams, listCategories } from "@/lib/repository";
import { WorldExplorerClient } from "@/components/WorldExplorerClient";
import { absoluteUrl, buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getCategoryLabel, getCityLabel, getCountryLabel, getMessages } from "@/lib/i18n";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Live Webcams by Country & City — Global Directory & Map",
  description:
    "Browse verified 24/7 live webcams by country and city worldwide. Explore our interactive world map and regional webcam directories with live weather and local time.",
  keywords: [
    "webcams by country",
    "world webcams directory",
    "city live cameras",
    "global webcam map",
    "live scenic webcams",
  ],
  alternates: buildAlternates("/countries"),
  openGraph: {
    title: "Live Webcams by Country & City — Global Directory & Map | LiveCam Global",
    description:
      "Browse verified 24/7 live webcams by country and city worldwide with live weather and local time.",
    url: "/countries",
  },
};

export default async function CountriesPage() {
  const [webcams, categories, locale] = await Promise.all([
    listApprovedWebcams(),
    listCategories(),
    getServerLocale(),
  ]);
  const tw = getMessages(locale).webcam;
  const tco = getMessages(locale).countries;

  // Build hierarchical Country -> Cities directory for SSR SEO links
  const directoryMap = new Map<
    string,
    {
      name: string;
      slug: string;
      flag: string;
      webcamCount: number;
      cities: Map<string, { name: string; slug: string; count: number }>;
    }
  >();

  for (const w of webcams) {
    let country = directoryMap.get(w.country.slug);
    if (!country) {
      country = {
        name: w.country.name,
        slug: w.country.slug,
        flag: w.country.flag,
        webcamCount: 0,
        cities: new Map(),
      };
      directoryMap.set(w.country.slug, country);
    }
    country.webcamCount += 1;
    const city = country.cities.get(w.city.slug) ?? {
      name: w.city.name,
      slug: w.city.slug,
      count: 0,
    };
    city.count += 1;
    country.cities.set(w.city.slug, city);
  }

  const directory = Array.from(directoryMap.values())
    .map((c) => ({
      ...c,
      cities: Array.from(c.cities.values()).sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.webcamCount - a.webcamCount);

  const totalCities = directory.reduce((acc, c) => acc + c.cities.length, 0);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Countries & Map", item: absoluteUrl("/countries") },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Live Webcams by Country & City",
      description: `Directory of ${webcams.length} verified live webcams across ${directory.length} countries and ${totalCities} cities.`,
      url: absoluteUrl("/countries"),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: directory.map((country, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${country.name} Live Webcams`,
          url: absoluteUrl(`/countries/${country.slug}`),
        })),
      },
    },
  ];

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Interactive World Map Explorer */}
      <WorldExplorerClient webcams={webcams} />

      {/* SSR Crawlable Country & City SEO Directory */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {tco.directoryEyebrow}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {tco.directoryTitle}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {formatMessage(tco.directorySubtitle, {
                cams: webcams.length,
                countries: directory.length,
                cities: totalCities,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-medium">
              {formatMessage(tco.countriesBadge, { count: directory.length })}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 font-medium">
              {formatMessage(tco.citiesBadge, { count: totalCities })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {directory.map((country) => (
            <div
              key={country.slug}
              className="rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 p-4 flex flex-col justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  <Link
                    href={`/countries/${country.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <span>{country.flag}</span>
                    <span>{getCountryLabel(locale, country.slug, country.name)}</span>
                  </Link>
                </h3>
                <Link
                  href={`/countries/${country.slug}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 shrink-0 tabular-nums"
                >
                  {formatMessage(tco.camCount, { count: country.webcamCount })} →
                </Link>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {country.cities.map((city) => (
                  <Link
                    key={`${country.slug}-${city.slug}`}
                    href={`/countries/${country.slug}/${city.slug}`}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    {getCityLabel(locale, city.slug, city.name)}{" "}
                    <span className="text-slate-400 dark:text-slate-500">({city.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Category Directory Links */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            {tw.categoriesLabel}
          </span>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              {formatMessage(tw.categoryWebcams, {
                name: getCategoryLabel(locale, cat.slug, cat.name),
              })}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
