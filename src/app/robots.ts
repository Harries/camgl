import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/search", "/random"],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-zh.xml`,
      `${baseUrl}/sitemap-ja.xml`,
      `${baseUrl}/sitemap-es.xml`,
      `${baseUrl}/sitemap-fr.xml`,
    ],
    host: baseUrl,
  };
}
