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

export function buildAlternates(path = "/") {
  const normalized = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: normalized,
    languages: {
      "x-default": normalized,
      en: normalized,
      zh: `${normalized}?lang=zh`,
      ja: `${normalized}?lang=ja`,
      es: `${normalized}?lang=es`,
      fr: `${normalized}?lang=fr`,
    },
  };
}

export function getYouTubeThumbnail(externalId?: string | null): string | undefined {
  if (!externalId || externalId.length !== 11) return undefined;
  return `https://i.ytimg.com/vi/${externalId}/hqdefault.jpg`;
}

export function withOutboundSource(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.set("utm_source", "camgl.com");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.set("utm_medium", "referral");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}
