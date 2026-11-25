const STREAM_PREVIEW_MAP: Record<string, string> = {
  "roundshot-gornergrat": "https://backend.roundshot.com/cams/5/default",
  "beachtv-keywest-hls":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "airvuz-dronetv-hls":
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
};

const FALLBACK_SCENIC_PREVIEW =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80";

function extractWindyWebcamId(
  externalId?: string | null,
  embedUrl?: string | null
): string | null {
  if (externalId && /^windy-(\d+)$/.test(externalId)) {
    return externalId.replace("windy-", "");
  }
  if (embedUrl) {
    const match = embedUrl.match(/webcams\.windy\.com\/webcams\/public\/embed\/player\/(\d+)/);
    if (match) return match[1];
  }
  return null;
}

export function getWebcamPreviewUrl(
  stream?: {
    sourceType?: string | null;
    mediaType?: string | null;
    externalId?: string | null;
    embedUrl?: string | null;
  } | null
): string | null {
  if (!stream) return null;
  const windyId = extractWindyWebcamId(stream.externalId, stream.embedUrl);
  if (windyId) {
    return `https://imgproxy.windy.com/_/preview/plain/current/${windyId}/original.jpg?v=2`;
  }
  if (stream.externalId && STREAM_PREVIEW_MAP[stream.externalId]) {
    return STREAM_PREVIEW_MAP[stream.externalId];
  }
  if (stream.sourceType === "youtube" && stream.externalId && stream.externalId.length === 11) {
    return `https://i.ytimg.com/vi/${stream.externalId}/hqdefault.jpg`;
  }
  if (
    (stream.sourceType === "snapshot" || stream.mediaType === "SNAPSHOT") &&
    stream.embedUrl
  ) {
    return stream.embedUrl;
  }
  if (stream.sourceType === "hls" || stream.sourceType === "official_embed") {
    return FALLBACK_SCENIC_PREVIEW;
  }
  return null;
}

import type { Locale } from "./i18n";

const SNAPSHOT_LABELS: Record<Locale, string> = {
  en: "Snapshot",
  zh: "定时抓拍",
  ja: "スナップショット",
  es: "Instantánea",
  fr: "Instantané",
};

const OFFICIAL_EMBED_LABELS: Record<Locale, string> = {
  en: "Official Embed",
  zh: "官方嵌入",
  ja: "公式埋め込み",
  es: "Inserción Oficial",
  fr: "Intégration Officielle",
};

export function getSourceTypeMeta(
  sourceType?: string | null,
  locale: Locale = "en"
): {
  label: string;
  badgeClass: string;
} {
  switch (sourceType) {
    case "hls":
      return {
        label: "HLS .m3u8",
        badgeClass:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "snapshot":
      return {
        label: SNAPSHOT_LABELS[locale] ?? SNAPSHOT_LABELS.en,
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "official_embed":
      return {
        label: OFFICIAL_EMBED_LABELS[locale] ?? OFFICIAL_EMBED_LABELS.en,
        badgeClass:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "youtube":
    default:
      return {
        label: "YouTube",
        badgeClass:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      };
  }
}
