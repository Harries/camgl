import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap-builder";

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries("en");
}
