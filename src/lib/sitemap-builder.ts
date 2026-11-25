import type { MetadataRoute } from "next";
import { listApprovedWebcams, listCategories, listCountriesSummary } from "@/lib/repository";
import { getSiteUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

function localizedUrl(baseUrl: string, path: string, locale: Locale): string {
  const normalized = path === "/" ? "" : path;
  if (locale === DEFAULT_LOCALE) {
    return `${baseUrl}${normalized || "/"}`;
  }
  return `${baseUrl}${normalized || "/"}?lang=${locale}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function collectAllPaths(): Promise<
  {
    path: string;
    lastModified?: Date;
    changeFrequency: "hourly" | "daily" | "monthly";
    priority: number;
  }[]
> {
  const [webcams, countries, categories] = await Promise.all([
    listApprovedWebcams(),
    listCountriesSummary(),
    listCategories(),
  ]);

  const entries: {
    path: string;
    lastModified?: Date;
    changeFrequency: "hourly" | "daily" | "monthly";
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "hourly", priority: 1 },
    { path: "/countries", changeFrequency: "daily", priority: 0.9 },
    { path: "/submit", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  ];

  for (const c of countries) {
    entries.push({
      path: `/countries/${c.slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  const citySet = new Set<string>();
  for (const w of webcams) {
    const path = `/countries/${w.country.slug}/${w.city.slug}`;
    if (!citySet.has(path)) {
      citySet.add(path);
      entries.push({
        path,
        changeFrequency: "daily",
        priority: 0.75,
      });
    }
  }

  for (const cat of categories) {
    entries.push({
      path: `/categories/${cat.slug}`,
      changeFrequency: "daily",
      priority: 0.75,
    });
  }

  for (const w of webcams) {
    entries.push({
      path: `/webcams/${w.slug}`,
      lastModified: w.stream?.lastCheckedAt ? new Date(w.stream.lastCheckedAt) : undefined,
      changeFrequency: "hourly",
      priority: 0.85,
    });
  }

  return entries;
}

export async function buildSitemapEntries(locale: Locale = DEFAULT_LOCALE): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const paths = await collectAllPaths();

  return paths.map((item) => {
    const languages: Record<string, string> = {
      "x-default": localizedUrl(baseUrl, item.path, DEFAULT_LOCALE),
    };
    for (const loc of SUPPORTED_LOCALES) {
      languages[loc] = localizedUrl(baseUrl, item.path, loc);
    }

    return {
      url: localizedUrl(baseUrl, item.path, locale),
      lastModified: item.lastModified,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
      alternates: { languages },
    };
  });
}

export async function buildSitemapXml(locale: Locale): Promise<string> {
  const baseUrl = getSiteUrl();
  const paths = await collectAllPaths();

  const urlNodes = paths
    .map((item) => {
      const locUrl = escapeXml(localizedUrl(baseUrl, item.path, locale));
      const lastmod = item.lastModified
        ? `\n    <lastmod>${item.lastModified.toISOString()}</lastmod>`
        : "";
      const alternateLinks = [
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl(baseUrl, item.path, DEFAULT_LOCALE))}" />`,
        ...SUPPORTED_LOCALES.map(
          (loc) =>
            `    <xhtml:link rel="alternate" hreflang="${loc}" href="${escapeXml(localizedUrl(baseUrl, item.path, loc))}" />`
        ),
      ].join("\n");

      return `  <url>
    <loc>${locUrl}</loc>${lastmod}
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority.toFixed(2)}</priority>
${alternateLinks}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlNodes}
</urlset>
`;
}

export function buildSitemapIndexXml(): string {
  const baseUrl = getSiteUrl();
  const lastmod = new Date().toISOString();
  const sitemaps = SUPPORTED_LOCALES.map(
    (loc) => `  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap-${loc}.xml`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;
}
