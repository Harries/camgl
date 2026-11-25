export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getYouTubeThumbnail(externalId?: string | null): string | undefined {
  if (!externalId || externalId.length !== 11) return undefined;
  return `https://i.ytimg.com/vi/${externalId}/hqdefault.jpg`;
}
