import type { MetadataRoute } from "next";
import { listApprovedWebcams, listCountriesSummary } from "@/lib/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const [webcams, countries] = await Promise.all([
    listApprovedWebcams(),
    listCountriesSummary(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/countries`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/map`, changeFrequency: "daily", priority: 0.8 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${baseUrl}/countries/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const webcamRoutes: MetadataRoute.Sitemap = webcams.map((w) => ({
    url: `${baseUrl}/webcams/${w.slug}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...countryRoutes, ...webcamRoutes];
}
