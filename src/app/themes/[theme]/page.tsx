import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listApprovedWebcams } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { absoluteUrl, buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getMessages, localizePath } from "@/lib/i18n";
import {
  getThemeSectionHeading,
  getWeatherTheme,
  matchesWeatherTheme,
  WEATHER_THEMES,
} from "@/lib/themes";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}): Promise<Metadata> {
  const { theme } = await params;
  const def = getWeatherTheme(theme);
  if (!def) return { title: "Theme Not Found" };
  const locale = await getServerLocale();
  const title = def.seoTitle[locale] ?? def.seoTitle.en;
  const description = def.seoDesc[locale] ?? def.seoDesc.en;
  const alternates = buildAlternates(`/themes/${def.slug}`, locale);

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

export default async function WeatherThemePage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  const def = getWeatherTheme(theme);
  if (!def) notFound();

  const [allWebcams, locale] = await Promise.all([
    listApprovedWebcams(),
    getServerLocale(),
  ]);
  const matched = allWebcams.filter((w) => matchesWeatherTheme(w, def.slug));
  const msgs = getMessages(locale);
  const heading = getThemeSectionHeading(locale);
  const title = def.title[locale] ?? def.title.en;
  const subtitle = def.subtitle[locale] ?? def.subtitle.en;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: title, item: absoluteUrl(`/themes/${def.slug}`) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: subtitle,
      url: absoluteUrl(`/themes/${def.slug}`),
    },
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Link href={localizePath("/", locale)} className="hover:underline">
            {msgs.webcam.home}
          </Link>{" "}
          / {title}
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{def.icon}</span>
            <span>{title}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {WEATHER_THEMES.map((t) => {
            const active = t.slug === def.slug;
            return (
              <Link
                key={t.slug}
                href={localizePath(`/themes/${t.slug}`, locale)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.title[locale] ?? t.title.en}</span>
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage(msgs.home.showingWebcams, { count: matched.length })}
        </p>
      </div>

      {matched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 p-10 text-center space-y-2">
          <div className="text-2xl">{def.icon}</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {heading.emptyTitle}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {heading.emptyBody}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matched.map((cam) => (
            <WebcamCard key={cam.id} webcam={cam} />
          ))}
        </div>
      )}
    </div>
  );
}
