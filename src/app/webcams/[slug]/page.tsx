import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWebcamBySlug, listApprovedWebcamsPage } from "@/lib/repository";
import { WebcamPlayer } from "@/components/WebcamPlayer";
import { getDaylightInfo } from "@/lib/suncalc";
import { absoluteUrl, buildAlternates, getYouTubeThumbnail, withOutboundSource } from "@/lib/seo";
import { getSourceTypeMeta, getWebcamPreviewUrl } from "@/lib/source-badge";
import { WebcamThumbnail } from "@/components/WebcamThumbnail";
import { getServerLocale } from "@/lib/i18n-server";
import {
  formatMessage,
  getCategoryLabel,
  getCityLabel,
  getCountryLabel,
  getMediaTypeLabel,
  getMessages,
  getStreamStatusLabel,
  localizePath,
  localizeWeatherSummary,
} from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [webcam, locale] = await Promise.all([getWebcamBySlug(slug), getServerLocale()]);
  if (!webcam) return { title: "Webcam Not Found" };
  const seo = getMessages(locale).seo;
  const countryLabel = getCountryLabel(locale, webcam.country.slug, webcam.country.name, webcam.country.isoCode);
  const cityLabel = getCityLabel(locale, webcam.city.slug, webcam.city.name);
  const title = formatMessage(seo.webcamTitle, {
    title: webcam.title,
    city: cityLabel,
    country: countryLabel,
  });
  const description =
    locale === "en"
      ? webcam.description
      : formatMessage(seo.webcamDesc, {
          title: webcam.title,
          city: cityLabel,
          country: countryLabel,
        });
  const thumbnail = getYouTubeThumbnail(webcam.stream?.externalId);
  const canonical = `/webcams/${webcam.slug}`;
  const alternates = buildAlternates(canonical, locale);

  return {
    title,
    description,
    keywords: [
      webcam.title,
      `${cityLabel} live cam`,
      `${countryLabel} webcam`,
      ...webcam.categories.map((c) => `${getCategoryLabel(locale, c.slug, c.name)} webcam`),
    ],
    alternates,
    openGraph: {
      type: "video.other",
      title,
      description,
      url: alternates.canonical,
      ...(thumbnail ? { images: [{ url: thumbnail, width: 480, height: 360, alt: webcam.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

export default async function WebcamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [webcam, locale] = await Promise.all([getWebcamBySlug(slug), getServerLocale()]);
  if (!webcam) notFound();
  const tw = getMessages(locale).webcam;
  const countryLabel = getCountryLabel(locale, webcam.country.slug, webcam.country.name, webcam.country.isoCode);
  const cityLabel = getCityLabel(locale, webcam.city.slug, webcam.city.name);

  const { items: allWebcams } = await listApprovedWebcamsPage({ page: 1, pageSize: 12 });
  const related = allWebcams
    .filter((w) => w.slug !== webcam.slug)
    .sort((a, b) => {
      const aScore =
        (a.country.slug === webcam.country.slug ? 2 : 0) +
        (a.categories.some((c) => webcam.categories.some((wc) => wc.slug === c.slug)) ? 1 : 0);
      const bScore =
        (b.country.slug === webcam.country.slug ? 2 : 0) +
        (b.categories.some((c) => webcam.categories.some((wc) => wc.slug === c.slug)) ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 5);

  const { isDaylight, localTime, sunriseLocal, sunsetLocal, goldenHourLocal } = getDaylightInfo(
    webcam.city.lat,
    webcam.city.lng,
    webcam.city.timezone
  );

  const sourceMeta = getSourceTypeMeta(webcam.stream?.sourceType, locale);
  const weatherLabel = localizeWeatherSummary(webcam.weatherSummary, locale);
  const statusLabel = getStreamStatusLabel(locale, webcam.stream?.status);
  const mediaTypeLabel = getMediaTypeLabel(locale, webcam.stream?.mediaType);
  const categoriesText = webcam.categories
    .map((c) => getCategoryLabel(locale, c.slug, c.name))
    .join(", ");
  const aboutDescription =
    locale === "en"
      ? webcam.description
      : formatMessage(tw.localizedDescription, {
          title: webcam.title,
          city: cityLabel,
          country: countryLabel,
          categories: categoriesText,
          localTime,
          phase: isDaylight ? tw.daylight : tw.nighttime,
          weather: weatherLabel,
        });
  const bestTimeText =
    locale === "en"
      ? webcam.bestTime
      : webcam.bestTime
        ? formatMessage(tw.bestTimeDefault, {
            sunrise: sunriseLocal,
            sunset: sunsetLocal,
            timezone: webcam.city.timezone,
            goldenHour: goldenHourLocal,
          })
        : null;
  const latLabel = `${Math.abs(webcam.city.lat).toFixed(4)}° ${webcam.city.lat >= 0 ? "N" : "S"}`;
  const lngLabel = `${Math.abs(webcam.city.lng).toFixed(4)}° ${webcam.city.lng >= 0 ? "E" : "W"}`;

  const faqs = [
    {
      q: formatMessage(tw.faq1Q, { title: webcam.title }),
      a: formatMessage(tw.faq1A, {
        city: cityLabel,
        country: countryLabel,
        timezone: webcam.city.timezone,
        localTime,
        phase: isDaylight ? tw.daylight : tw.nighttime,
        weather: weatherLabel,
        sunrise: sunriseLocal,
        sunset: sunsetLocal,
      }),
    },
    {
      q: formatMessage(tw.faq2Q, { city: cityLabel }),
      a:
        locale === "en" && webcam.bestTime
          ? formatMessage(tw.faq2AWithBest, {
              bestTime: webcam.bestTime,
              goldenHour: goldenHourLocal,
            })
          : formatMessage(tw.faq2ADefault, {
              sunrise: sunriseLocal,
              sunset: sunsetLocal,
              timezone: webcam.city.timezone,
              goldenHour: goldenHourLocal,
            }),
    },
    {
      q: formatMessage(tw.faq3Q, { title: webcam.title }),
      a: formatMessage(tw.faq3A, {
        format: sourceMeta.label,
        mediaType: mediaTypeLabel,
        provider: webcam.provider?.name ?? tw.officialPartner,
      }),
    },
    {
      q: formatMessage(tw.faq4Q, { city: cityLabel }),
      a: tw.faq4A,
    },
  ];

  const thumbnail = getYouTubeThumbnail(webcam.stream?.externalId);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: webcam.title,
      description: aboutDescription,
      ...(thumbnail ? { thumbnailUrl: thumbnail } : {}),
      uploadDate: webcam.stream?.lastCheckedAt ?? new Date().toISOString(),
      ...(webcam.stream
        ? {
            embedUrl: webcam.stream.embedUrl,
            contentUrl: webcam.stream.sourceUrl,
          }
        : {}),
      publication: {
        "@type": "BroadcastEvent",
        isLiveBroadcast: webcam.stream?.status === "LIVE",
      },
      contentLocation: {
        "@type": "Place",
        name: `${cityLabel}, ${countryLabel}`,
        geo: {
          "@type": "GeoCoordinates",
          latitude: webcam.city.lat,
          longitude: webcam.city.lng,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tw.home, item: absoluteUrl(localizePath("/", locale)) },
        {
          "@type": "ListItem",
          position: 2,
          name: countryLabel,
          item: absoluteUrl(localizePath(`/countries/${webcam.country.slug}`, locale)),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: cityLabel,
          item: absoluteUrl(localizePath(`/countries/${webcam.country.slug}/${webcam.city.slug}`, locale)),
        },
        {
          "@type": "ListItem",
          position: 4,
          name: webcam.title,
          item: absoluteUrl(localizePath(`/webcams/${webcam.slug}`, locale)),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <Link href={localizePath("/", locale)} className="hover:underline">{tw.home}</Link>
          <span>/</span>
          <Link href={localizePath(`/countries/${webcam.country.slug}`, locale)} className="hover:underline">
            {countryLabel}
          </Link>
          <span>/</span>
          <Link
            href={localizePath(`/countries/${webcam.country.slug}/${webcam.city.slug}`, locale)}
            className="hover:underline"
          >
            {cityLabel}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{webcam.title}</span>
        </div>
        <Link href={localizePath("/", locale)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
          {tw.backToDiscover}
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{webcam.title}</h1>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${sourceMeta.badgeClass}`}>
            {sourceMeta.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {webcam.country.flag} {cityLabel}, {countryLabel} · {categoriesText}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        {webcam.stream ? (
          <WebcamPlayer
            title={webcam.title}
            embedUrl={webcam.stream.embedUrl}
            sourceUrl={webcam.stream.sourceUrl}
            sourceType={webcam.stream.sourceType}
            mediaType={webcam.stream.mediaType}
            externalId={webcam.stream.externalId}
          />
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900">
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.localTime}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {isDaylight ? "☀️" : "🌙"} {localTime}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.liveWeather}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{weatherLabel}</div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.streamStatus}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
              {statusLabel}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.sourceAttribution}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
              {webcam.provider?.name ?? tw.officialPartner}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {formatMessage(tw.aboutTitle, { title: webcam.title })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {aboutDescription}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {formatMessage(tw.positionedSummary, {
                city: cityLabel,
                country: countryLabel,
                lat: latLabel,
                lng: lngLabel,
                timezone: webcam.city.timezone,
              })}
            </p>
            {bestTimeText && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                <div className="font-medium text-slate-900 dark:text-white mb-1">{tw.bestTimeToWatch}</div>
                <div className="text-slate-600 dark:text-slate-300">{bestTimeText}</div>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tw.categoriesLabel}</span>
              {webcam.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={localizePath(`/categories/${cat.slug}`, locale)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {formatMessage(tw.categoryWebcams, {
                    name: getCategoryLabel(locale, cat.slug, cat.name),
                  })}
                </Link>
              ))}
              <Link
                href={localizePath(`/countries/${webcam.country.slug}`, locale)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {webcam.country.flag} {formatMessage(tw.allCountryCams, { country: countryLabel })}
              </Link>
            </div>
          </section>

          {/* Daylight & Location Telemetry */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {tw.telemetryTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.sunriseSunset}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {sunriseLocal} / {sunsetLocal}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.goldenHour}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {goldenHourLocal}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.coordinates}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {latLabel}, {lngLabel}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.timezone}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {webcam.city.timezone}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.streamFormat}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {sourceMeta.label}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.originalSource}</div>
                {webcam.stream?.sourceUrl ? (
                  <a
                    href={withOutboundSource(webcam.stream.sourceUrl)}
                    target="_blank"
                    rel="noopener"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block truncate max-w-full"
                  >
                    {tw.openSource}
                  </a>
                ) : (
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{tw.officialFeed}</div>
                )}
              </div>
            </div>
          </section>

          {/* SEO FAQ Section */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {tw.faqTitle}
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {faqs.map((f) => (
                <div key={f.q} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">{f.q}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{tw.nearbyRelated}</h2>
              <Link href={localizePath("/random", locale)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {tw.random}
              </Link>
            </div>
            <div className="space-y-2.5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={localizePath(`/webcams/${r.slug}`, locale)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-20 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                    <WebcamThumbnail
                      src={getWebcamPreviewUrl(r.stream)}
                      alt={r.title}
                      flag={r.country.flag}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {getCityLabel(locale, r.city.slug, r.city.name)},{" "}
                      {getCountryLabel(locale, r.country.slug, r.country.name, r.country.isoCode)}
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
