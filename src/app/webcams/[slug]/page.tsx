import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWebcamBySlug, listApprovedWebcamsPage } from "@/lib/repository";
import { WebcamPlayer } from "@/components/WebcamPlayer";
import { getDaylightInfo } from "@/lib/suncalc";
import { absoluteUrl, getYouTubeThumbnail, withOutboundSource } from "@/lib/seo";
import { getSourceTypeMeta, getWebcamPreviewUrl } from "@/lib/source-badge";
import { WebcamThumbnail } from "@/components/WebcamThumbnail";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getMessages } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const webcam = await getWebcamBySlug(slug);
  if (!webcam) return { title: "Webcam Not Found" };
  const title = `${webcam.title} (${webcam.city.name}, ${webcam.country.name})`;
  const thumbnail = getYouTubeThumbnail(webcam.stream?.externalId);
  const canonical = `/webcams/${webcam.slug}`;

  return {
    title,
    description: webcam.description,
    keywords: [
      webcam.title,
      `${webcam.city.name} live cam`,
      `${webcam.country.name} webcam`,
      ...webcam.categories.map((c) => `${c.name.toLowerCase()} webcam`),
    ],
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      title,
      description: webcam.description,
      url: canonical,
      ...(thumbnail ? { images: [{ url: thumbnail, width: 480, height: 360, alt: webcam.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: webcam.description,
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

  const sourceMeta = getSourceTypeMeta(webcam.stream?.sourceType);
  const latLabel = `${Math.abs(webcam.city.lat).toFixed(4)}° ${webcam.city.lat >= 0 ? "N" : "S"}`;
  const lngLabel = `${Math.abs(webcam.city.lng).toFixed(4)}° ${webcam.city.lng >= 0 ? "E" : "W"}`;

  const faqs = [
    {
      q: formatMessage(tw.faq1Q, { title: webcam.title }),
      a: formatMessage(tw.faq1A, {
        city: webcam.city.name,
        country: webcam.country.name,
        timezone: webcam.city.timezone,
        localTime,
        phase: isDaylight ? tw.daylight : tw.nighttime,
        weather: webcam.weatherSummary,
        sunrise: sunriseLocal,
        sunset: sunsetLocal,
      }),
    },
    {
      q: formatMessage(tw.faq2Q, { city: webcam.city.name }),
      a: webcam.bestTime
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
        mediaType: webcam.stream?.mediaType ?? "LIVE_VIDEO",
        provider: webcam.provider?.name ?? tw.officialPartner,
      }),
    },
    {
      q: formatMessage(tw.faq4Q, { city: webcam.city.name }),
      a: tw.faq4A,
    },
  ];

  const thumbnail = getYouTubeThumbnail(webcam.stream?.externalId);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: webcam.title,
      description: webcam.description,
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
        name: `${webcam.city.name}, ${webcam.country.name}`,
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
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: webcam.country.name,
          item: absoluteUrl(`/countries/${webcam.country.slug}`),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: webcam.city.name,
          item: absoluteUrl(`/countries/${webcam.country.slug}/${webcam.city.slug}`),
        },
        {
          "@type": "ListItem",
          position: 4,
          name: webcam.title,
          item: absoluteUrl(`/webcams/${webcam.slug}`),
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
          <Link href="/" className="hover:underline">{tw.home}</Link>
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
          {tw.backToDiscover}
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{webcam.title}</h1>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSourceTypeMeta(webcam.stream?.sourceType).badgeClass}`}>
            {getSourceTypeMeta(webcam.stream?.sourceType).label}
          </span>
        </div>
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
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{webcam.weatherSummary}</div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.streamStatus}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
              {webcam.stream?.status ?? "UNKNOWN"}
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
              {webcam.description}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {formatMessage(tw.positionedSummary, {
                city: webcam.city.name,
                country: webcam.country.name,
                lat: latLabel,
                lng: lngLabel,
                timezone: webcam.city.timezone,
              })}
            </p>
            {webcam.bestTime && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                <div className="font-medium text-slate-900 dark:text-white mb-1">{tw.bestTimeToWatch}</div>
                <div className="text-slate-600 dark:text-slate-300">{webcam.bestTime}</div>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tw.categoriesLabel}</span>
              {webcam.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {formatMessage(tw.categoryWebcams, { name: cat.name })}
                </Link>
              ))}
              <Link
                href={`/countries/${webcam.country.slug}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {webcam.country.flag} {formatMessage(tw.allCountryCams, { country: webcam.country.name })}
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
              <Link href="/random" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {tw.random}
              </Link>
            </div>
            <div className="space-y-2.5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/webcams/${r.slug}`}
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
