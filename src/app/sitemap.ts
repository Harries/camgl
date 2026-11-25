import type { MetadataRoute } from "next";
import { listApprovedWebcams, listCategories, listCountriesSummary } from "@/lib/repository";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [webcams, countries, categories] = await Promise.all([
    listApprovedWebcams(),
    listCountriesSummary(),
    listCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/countries`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/submit`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${baseUrl}/countries/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const citySet = new Set<string>();
  const cityRoutes: MetadataRoute.Sitemap = [];
  for (const w of webcams) {
    const path = `/countries/${w.country.slug}/${w.city.slug}`;
    if (!citySet.has(path)) {
      citySet.add(path);
      cityRoutes.push({
        url: `${baseUrl}${path}`,
        changeFrequency: "daily",
        priority: 0.75,
      });
    }
  }

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  const webcamRoutes: MetadataRoute.Sitemap = webcams.map((w) => ({
    url: `${baseUrl}/webcams/${w.slug}`,
    lastModified: w.stream?.lastCheckedAt ? new Date(w.stream.lastCheckedAt) : undefined,
    changeFrequency: "hourly",
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...countryRoutes,
    ...cityRoutes,
    ...categoryRoutes,
    ...webcamRoutes,
  ];
}
