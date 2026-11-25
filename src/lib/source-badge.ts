export function getWebcamPreviewUrl(
  stream?: {
    sourceType?: string | null;
    mediaType?: string | null;
    externalId?: string | null;
    embedUrl?: string | null;
  } | null
): string | null {
  if (!stream) return null;
  if (stream.sourceType === "youtube" && stream.externalId && stream.externalId.length === 11) {
    return `https://i.ytimg.com/vi/${stream.externalId}/hqdefault.jpg`;
  }
  if (
    (stream.sourceType === "snapshot" || stream.mediaType === "SNAPSHOT") &&
    stream.embedUrl
  ) {
    return stream.embedUrl;
  }
  return null;
}

export function getSourceTypeMeta(sourceType?: string | null): {
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
        label: "Snapshot",
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "official_embed":
      return {
        label: "Official Embed",
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
