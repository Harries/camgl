import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntityTranslation, getWebcamBySlug, listApprovedWebcamsPage } from "@/lib/repository";
import { WebcamPlayer } from "@/components/WebcamPlayer";
import { WebcamViewTracker } from "@/components/WebcamViewTracker";
import { WebcamActionsBar } from "@/components/WebcamActionsBar";
import { getDaylightInfo } from "@/lib/suncalc";
import { fetchDetailedWeather } from "@/lib/weather";
import { absoluteUrl, buildAlternates, getYouTubeThumbnail, withOutboundSource } from "@/lib/seo";
import { getSourceTypeMeta, getWebcamPreviewUrl } from "@/lib/source-badge";
import { WebcamThumbnail } from "@/components/WebcamThumbnail";
import { CountryFlag } from "@/components/CountryFlag";
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

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatLastChecked(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    const langTag = locale === "zh" ? "zh-CN" : locale;
    return new Intl.DateTimeFormat(langTag, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

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
      formatMessage(seo.webcamCityKeyword, { city: cityLabel }),
      formatMessage(seo.webcamCountryKeyword, { country: countryLabel }),
      ...webcam.categories.map((c) =>
        formatMessage(seo.webcamCategoryKeyword, {
          category: getCategoryLabel(locale, c.slug, c.name),
        })
      ),
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

  const [{ items: allWebcams }, detailedWeather, dbTranslation] = await Promise.all([
    listApprovedWebcamsPage({ page: 1, pageSize: 24 }),
    fetchDetailedWeather(webcam.city.lat, webcam.city.lng),
    getEntityTranslation("webcam", webcam.id, locale),
  ]);

  const others = allWebcams.filter((w) => w.slug !== webcam.slug);
  const nearbyCams = others
    .map((w) => ({
      cam: w,
      km: distanceKm(webcam.city.lat, webcam.city.lng, w.city.lat, w.city.lng),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);

  const sameCountryCams = others
    .filter((w) => w.country.slug === webcam.country.slug)
    .slice(0, 6);

  const { isDaylight, localTime, sunriseLocal, sunsetLocal, goldenHourLocal } = getDaylightInfo(
    webcam.city.lat,
    webcam.city.lng,
    webcam.city.timezone
  );

  const sourceMeta = getSourceTypeMeta(webcam.stream?.sourceType, locale);
  const weatherLabel = localizeWeatherSummary(webcam.weatherSummary, locale);
  const statusLabel = getStreamStatusLabel(locale, webcam.stream?.status);
  const mediaTypeLabel = getMediaTypeLabel(locale, webcam.stream?.mediaType);
  const lastCheckedLabel = formatLastChecked(webcam.stream?.lastCheckedAt, locale);
  const categoriesText = webcam.categories
    .map((c) => getCategoryLabel(locale, c.slug, c.name))
    .join(", ");

  const aboutDescription =
    dbTranslation?.description ||
    (locale === "en"
      ? webcam.description
      : formatMessage(tw.localizedDescription, {
          title: webcam.title,
          city: cityLabel,
          country: countryLabel,
          categories: categoriesText,
          localTime,
          phase: isDaylight ? tw.daylight : tw.nighttime,
          weather: weatherLabel,
        }));

  const bestTimeText =
    locale === "en" && webcam.bestTime
      ? webcam.bestTime
      : formatMessage(tw.bestTimeDefault, {
          sunrise: sunriseLocal,
          sunset: sunsetLocal,
          timezone: webcam.city.timezone,
          goldenHour: goldenHourLocal,
        });

  const latLabel = `${Math.abs(webcam.city.lat).toFixed(4)}° ${webcam.city.lat >= 0 ? "N" : "S"}`;
  const lngLabel = `${Math.abs(webcam.city.lng).toFixed(4)}° ${webcam.city.lng >= 0 ? "E" : "W"}`;

  const delta = 0.08;
  const osmBbox = `${(webcam.city.lng - delta).toFixed(4)},${(webcam.city.lat - delta).toFixed(4)},${(webcam.city.lng + delta).toFixed(4)},${(webcam.city.lat + delta).toFixed(4)}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(osmBbox)}&layer=mapnik&marker=${webcam.city.lat.toFixed(4)},${webcam.city.lng.toFixed(4)}`;

  const seeHighlights = [
    formatMessage(tw.seeHighlight1, { categories: categoriesText, city: cityLabel, country: countryLabel }),
    formatMessage(tw.seeHighlight2, { phase: isDaylight ? tw.daylight : tw.nighttime, localTime }),
    formatMessage(tw.seeHighlight3, { weather: weatherLabel }),
    formatMessage(tw.seeHighlight4, { format: sourceMeta.label }),
  ];

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
      name: `${webcam.title}, ${cityLabel}`,
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

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
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
      </nav>

      {/* H1 */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {webcam.title}, {cityLabel}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${sourceMeta.badgeClass}`}>
            {sourceMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
            <CountryFlag isoCode={webcam.country.isoCode} flag={webcam.country.flag} />
            <span>{cityLabel}, {countryLabel} · {categoriesText}</span>
          </p>
          <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
          <WebcamViewTracker
            slug={webcam.slug}
            initialViews={webcam.viewCount ?? 0}
            label={tw.views}
          />
        </div>
      </div>

      {/* Live Player + Status / Actions / Telemetry */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <div id="webcam-player-container">
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
        </div>

        {/* Status, Source, Last Checked + Interactive Actions */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 live-dot" />
              {statusLabel}
            </span>
            <span>
              <span className="text-slate-400 dark:text-slate-500">{tw.sourceAttribution}:</span>{" "}
              <strong className="font-medium text-slate-800 dark:text-slate-200">
                {webcam.provider?.name ?? tw.officialPartner}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="tabular-nums">
              <span className="text-slate-400 dark:text-slate-500">{tw.lastChecked}:</span>{" "}
              {lastCheckedLabel}
            </span>
          </div>

          <WebcamActionsBar
            slug={webcam.slug}
            title={`${webcam.title}, ${cityLabel}`}
            initialFavoriteCount={webcam.favoriteCount ?? 0}
          />
        </div>

        {/* Local Time, Live Weather, Sunrise/Sunset */}
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
            <div className="text-slate-500 dark:text-slate-400">{tw.sunriseSunset}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {sunriseLocal} / {sunsetLocal}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-slate-500 dark:text-slate-400">{tw.goldenHour}</div>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {goldenHourLocal}
            </div>
          </div>
        </div>
      </div>

      {/* Structured SEO Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* H2: About This Live Webcam */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tw.aboutWebcamTitle}
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
          </section>

          {/* H2: What Can You See on This Webcam? */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tw.whatCanYouSeeTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {formatMessage(tw.whatCanYouSeeBody, {
                title: webcam.title,
                city: cityLabel,
                country: countryLabel,
                categories: categoriesText,
                weather: weatherLabel,
              })}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              {seeHighlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800"
                >
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* H2: Live Weather in {city} */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatMessage(tw.liveWeatherInTitle, { city: cityLabel })}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.temperature}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {detailedWeather ? `${detailedWeather.tempC}°C` : weatherLabel}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.windSpeed}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {detailedWeather?.windKmh !== null && detailedWeather?.windKmh !== undefined
                    ? `${detailedWeather.windKmh} km/h`
                    : "—"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.humidity}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {detailedWeather?.humidity !== null && detailedWeather?.humidity !== undefined
                    ? `${detailedWeather.humidity}%`
                    : "—"}
                </div>
              </div>
            </div>

            {detailedWeather && detailedWeather.daily.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tw.forecastTitle}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {detailedWeather.daily.map((d) => (
                    <div
                      key={d.date}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800 space-y-1"
                    >
                      <div className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        {d.date.slice(5)}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 truncate">
                        {localizeWeatherSummary(d.condition, locale)}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {d.minC}° / {d.maxC}°C
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* H2: Camera Information */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tw.cameraInfoTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.streamStatus}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{statusLabel}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.streamFormat}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{sourceMeta.label}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.sourceAttribution}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                  {webcam.provider?.name ?? tw.officialPartner}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.timezone}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{webcam.city.timezone}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">{tw.lastChecked}</div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">{lastCheckedLabel}</div>
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
            </div>
          </section>

          {/* H2: About {city} */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatMessage(tw.aboutPlaceTitle, { city: cityLabel })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {formatMessage(tw.aboutPlaceBody, {
                city: cityLabel,
                country: countryLabel,
                lat: latLabel,
                lng: lngLabel,
                timezone: webcam.city.timezone,
                categories: categoriesText,
                sunrise: sunriseLocal,
                sunset: sunsetLocal,
                goldenHour: goldenHourLocal,
              })}
            </p>
          </section>

          {/* H2: Best Time to Watch */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tw.bestTimeToWatch}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {bestTimeText}
            </p>
          </section>

          {/* H2: Webcam Location */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {tw.webcamLocationTitle}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums inline-flex items-center gap-1.5">
                <CountryFlag isoCode={webcam.country.isoCode} flag={webcam.country.flag} />
                <span>{cityLabel}, {countryLabel} · {latLabel}, {lngLabel}</span>
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-60 bg-slate-100 dark:bg-slate-800">
              <iframe
                title={`${webcam.title} Map`}
                src={osmEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </section>

          {/* H2: More Webcams in {country} */}
          {sameCountryCams.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatMessage(tw.moreInCountryTitle, { country: countryLabel })}
                </h2>
                <Link
                  href={localizePath(`/countries/${webcam.country.slug}`, locale)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {formatMessage(tw.allCountryCams, { country: countryLabel })} →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sameCountryCams.map((cam) => (
                  <Link
                    key={cam.id}
                    href={localizePath(`/webcams/${cam.slug}`, locale)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="w-24 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                      <WebcamThumbnail
                        src={getWebcamPreviewUrl(cam.stream)}
                        alt={cam.title}
                        flag={cam.country.flag}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cam.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {getCityLabel(locale, cam.city.slug, cam.city.name)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* H2: Frequently Asked Questions */}
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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

        {/* Sticky Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{tw.nearbyWebcamsTitle}</h2>
              <Link href={localizePath("/random", locale)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0">
                {tw.random}
              </Link>
            </div>
            {nearbyCams.length > 0 && (
              <div className="space-y-2.5">
                {nearbyCams.map(({ cam, km }) => (
                  <Link
                    key={cam.id}
                    href={localizePath(`/webcams/${cam.slug}`, locale)}
                    className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="w-24 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                      <WebcamThumbnail
                        src={getWebcamPreviewUrl(cam.stream)}
                        alt={cam.title}
                        flag={cam.country.flag}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cam.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {getCityLabel(locale, cam.city.slug, cam.city.name)},{" "}
                        {getCountryLabel(locale, cam.country.slug, cam.country.name, cam.country.isoCode)}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
                        {formatMessage(tw.distanceKm, { km })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
