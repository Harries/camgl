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
  params: Promise<{ country: string; city: string }>;
}): Promise<Metadata> {
  const { country, city } = await params;
  const [webcams, locale] = await Promise.all([
    listApprovedWebcams({ country, city }),
    getServerLocale(),
  ]);
  if (webcams.length === 0) return { title: "City Not Found" };
  const first = webcams[0];
  const seo = getMessages(locale).seo;
  const countryLabel = getCountryLabel(locale, first.country.slug, first.country.name, first.country.isoCode);
  const cityLabel = getCityLabel(locale, first.city.slug, first.city.name);
  const title = formatMessage(seo.cityTitle, { city: cityLabel, country: countryLabel });
  const description = formatMessage(seo.cityDesc, { city: cityLabel, country: countryLabel });
  const canonical = `/countries/${country}/${city}`;
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

export default async function CityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ country, city }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const [pageData, locale] = await Promise.all([
    listApprovedWebcamsPage({ country, city, page, pageSize }),
    getServerLocale(),
  ]);
  if (pageData.total === 0) notFound();
  const webcams = pageData.items;
  const totalPages = Math.max(1, Math.ceil(pageData.total / pageSize));

  const msgs = getMessages(locale);
  const first = webcams[0];
  const countryLabel = getCountryLabel(locale, first.country.slug, first.country.name, first.country.isoCode);
  const cityLabel = getCityLabel(locale, first.city.slug, first.city.name);
  const { localTime } = getDaylightInfo(first.city.lat, first.city.lng, first.city.timezone);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Countries", item: absoluteUrl("/countries") },
      { "@type": "ListItem", position: 3, name: first.country.name, item: absoluteUrl(`/countries/${country}`) },
      { "@type": "ListItem", position: 4, name: first.city.name, item: absoluteUrl(`/countries/${country}/${city}`) },
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
          <Link href={localizePath(`/countries/${country}`, locale)} className="hover:underline">{countryLabel}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{cityLabel}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {first.country.flag} {cityLabel}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {msgs.webcam.localTime}: <span className="font-medium text-slate-700 dark:text-slate-300">{localTime}</span> · {formatMessage(msgs.home.showingWebcams, { count: pageData.total })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>

      <PaginationBar
        basePath={localizePath(`/countries/${country}/${city}`, locale)}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
