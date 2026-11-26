import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listApprovedWebcams, listApprovedWebcamsPage } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { PaginationBar } from "@/components/PaginationBar";
import { getDaylightInfo } from "@/lib/suncalc";
import { absoluteUrl, buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getCityLabel, getCountryLabel, getMessages, localizePath } from "@/lib/i18n";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const [webcams, locale] = await Promise.all([
    listApprovedWebcams({ country }),
    getServerLocale(),
  ]);
  if (webcams.length === 0) return { title: "Country Not Found" };
  const seo = getMessages(locale).seo;
  const cInfo = webcams[0].country;
  const countryName = getCountryLabel(locale, cInfo.slug, cInfo.name, cInfo.isoCode);
  const title = formatMessage(seo.countryTitle, { country: countryName });
  const description = formatMessage(seo.countryDesc, {
    count: webcams.length,
    country: countryName,
  });
  const canonical = `/countries/${country}`;
  const alternates = buildAlternates(canonical, locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title: `${title} | LiveCam Global`,
      description,
      url: alternates.canonical,
    },
  };
}

export default async function CountryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ country }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const [allWebcams, pageData, locale] = await Promise.all([
    listApprovedWebcams({ country }),
    listApprovedWebcamsPage({ country, page, pageSize }),
    getServerLocale(),
  ]);
  if (allWebcams.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(pageData.total / pageSize));
  const webcams = pageData.items;

  const msgs = getMessages(locale);
  const countryInfo = allWebcams[0].country;
  const countryLabel = getCountryLabel(locale, countryInfo.slug, countryInfo.name, countryInfo.isoCode);
  const cityMap = new Map<
    string,
    { name: string; slug: string; localTime: string; count: number }
  >();
  for (const w of allWebcams) {
    const existing = cityMap.get(w.city.slug);
    if (existing) {
      existing.count += 1;
    } else {
      const { localTime } = getDaylightInfo(w.city.lat, w.city.lng, w.city.timezone);
      cityMap.set(w.city.slug, { name: w.city.name, slug: w.city.slug, localTime, count: 1 });
    }
  }
  const cities = Array.from(cityMap.values());
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Countries", item: absoluteUrl("/countries") },
      { "@type": "ListItem", position: 3, name: countryInfo.name, item: absoluteUrl(`/countries/${country}`) },
    ],
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href={localizePath("/", locale)} className="hover:underline">{msgs.webcam.home}</Link>
          <span>/</span>
          <Link href={localizePath("/countries", locale)} className="hover:underline">{msgs.home.countries}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{countryLabel}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {countryInfo.flag} {formatMessage(msgs.webcam.allCountryCams, { country: countryLabel })}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage(msgs.home.showingWebcams, { count: pageData.total })}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {formatMessage(msgs.countries.citiesIn, { country: countryLabel })}
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={localizePath(`/countries/${country}/${c.slug}`, locale)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:bg-white hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-blue-500 transition-all flex items-center gap-2"
            >
              <span className="font-medium text-slate-900 dark:text-white">
                {getCityLabel(locale, c.slug, c.name)}
              </span>
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

      <PaginationBar
        basePath={localizePath(`/countries/${country}`, locale)}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
