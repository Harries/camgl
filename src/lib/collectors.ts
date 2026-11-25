import type { AdminCandidate } from "./types";

export interface ProbeResult {
  online: boolean;
  stabilityScore: number;
  latencyMs: number;
}

export async function probeSourceStability(
  sourceType: string,
  embedUrl: string,
  sourceUrl: string
): Promise<ProbeResult> {
  const start = Date.now();
  try {
    if (sourceType === "youtube") {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`,
        { signal: AbortSignal.timeout(4000) }
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) return { online: false, stabilityScore: 0, latencyMs };
      const score = Math.max(65, Math.min(98, 100 - Math.floor(latencyMs / 45)));
      return { online: true, stabilityScore: score, latencyMs };
    }

    let res = await fetch(embedUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(embedUrl, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
    }
    const latencyMs = Date.now() - start;
    if (!res.ok && res.status >= 400) {
      return { online: false, stabilityScore: 0, latencyMs };
    }
    // Direct HLS and official embeds/snapshots get slightly higher base reliability
    const bonus = sourceType === "hls" || sourceType === "official_embed" ? 4 : 0;
    const score = Math.max(60, Math.min(99, 98 + bonus - Math.floor(latencyMs / 40)));
    return { online: true, stabilityScore: score, latencyMs };
  } catch {
    return { online: false, stabilityScore: 0, latencyMs: Date.now() - start };
  }
}

export interface CollectedCandidateInput {
  source: string;
  sourceType: string;
  mediaType: "LIVE_VIDEO" | "SNAPSHOT";
  externalId: string;
  title: string;
  countryName: string;
  cityName: string;
  lat: number;
  lng: number;
  categorySlug: string;
  embedUrl: string;
  sourceUrl: string;
  licenseNote: string;
  privacyNote: string;
}

// Keyless verified official public feeds (HLS, Snapshots, Official Embeds, YouTube)
const PUBLIC_FEED_CATALOG: CollectedCandidateInput[] = [
  {
    source: "NASA TV HLS",
    sourceType: "hls",
    mediaType: "LIVE_VIDEO",
    externalId: "nasa-ntv2-hls",
    title: "NASA TV Media Channel (HLS .m3u8)",
    countryName: "United States",
    cityName: "Houston",
    lat: 29.5593,
    lng: -95.09,
    categorySlug: "nature",
    embedUrl: "https://ntv2.akamaized.net/hls/live/2013923/NASA-NTV2-HLS/master.m3u8",
    sourceUrl: "https://www.nasa.gov/nasatv/",
    licenseNote: "US Public Domain (NASA)",
    privacyNote: "Pass · Official Broadcast",
  },
  {
    source: "USGS Volcano Observatory",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "usgs-mauna-loa",
    title: "Mauna Loa Summit Caldera (USGS)",
    countryName: "United States",
    cityName: "Mauna Loa",
    lat: 19.4721,
    lng: -155.5922,
    categorySlug: "volcano",
    embedUrl: "https://volcanoes.usgs.gov/observatories/hvo/cams/MLcam/images/M.jpg",
    sourceUrl: "https://www.usgs.gov/volcanoes/mauna-loa/webcams",
    licenseNote: "US Public Domain (USGS)",
    privacyNote: "Pass · Mountain Summit",
  },
  {
    source: "USGS Volcano Observatory",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "usgs-kilauea-pgcam",
    title: "Kilauea Lower East Rift Zone (USGS)",
    countryName: "United States",
    cityName: "Pahoa",
    lat: 19.459,
    lng: -154.892,
    categorySlug: "volcano",
    embedUrl: "https://volcanoes.usgs.gov/observatories/hvo/cams/PGcam/images/M.jpg",
    sourceUrl: "https://www.usgs.gov/volcanoes/kilauea/webcams",
    licenseNote: "US Public Domain (USGS)",
    privacyNote: "Pass · Geological View",
  },
  {
    source: "YouTube Official Channel",
    sourceType: "youtube",
    mediaType: "LIVE_VIDEO",
    externalId: "6dp-bvQ7RWo",
    title: "Tokyo Shinjuku O-Guard Intersection Live",
    countryName: "Japan",
    cityName: "Tokyo",
    lat: 35.6931,
    lng: 139.6996,
    categorySlug: "city",
    embedUrl: "https://www.youtube-nocookie.com/embed/6dp-bvQ7RWo",
    sourceUrl: "https://www.youtube.com/watch?v=6dp-bvQ7RWo",
    licenseNote: "YouTube Embeddable",
    privacyNote: "Pass · Public Intersection",
  },
];

export async function collectFromWindy(): Promise<CollectedCandidateInput[]> {
  const apiKey = process.env.WINDY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      "https://api.windy.com/webcams/api/v3/webcams?limit=12&include=player,location,categories,urls",
      {
        headers: { "x-windy-api-key": apiKey },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return [];

    const json = (await res.json()) as {
      webcams?: Array<{
        webcamId: number;
        title: string;
        categories?: Array<{ id: string }>;
        location?: {
          city?: string;
          country?: string;
          latitude?: number;
          longitude?: number;
        };
        player?: {
          live?: string;
          day?: string;
        };
        urls?: {
          detail?: string;
        };
      }>;
    };

    const items: CollectedCandidateInput[] = [];
    for (const w of json.webcams ?? []) {
      const embed = w.player?.live || w.player?.day;
      if (!embed) continue;
      items.push({
        source: "Windy API v3",
        sourceType: "official_embed",
        mediaType: "LIVE_VIDEO",
        externalId: `windy-${w.webcamId}`,
        title: w.title,
        countryName: w.location?.country || "International",
        cityName: w.location?.city || "Unknown",
        lat: w.location?.latitude ?? 0,
        lng: w.location?.longitude ?? 0,
        categorySlug: w.categories?.[0]?.id || "nature",
        embedUrl: embed,
        sourceUrl: w.urls?.detail || embed,
        licenseNote: "Windy API v3 Official Player",
        privacyNote: "Pass · Windy Verified",
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function collectFromYouTube(): Promise<CollectedCandidateInput[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&videoEmbeddable=true&maxResults=8&q=${encodeURIComponent(
        "live scenic webcam 4k"
      )}&key=${apiKey}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];

    const json = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string; channelTitle?: string };
      }>;
    };

    const items: CollectedCandidateInput[] = [];
    for (const item of json.items ?? []) {
      const vid = item.id?.videoId;
      if (!vid) continue;
      items.push({
        source: `YouTube API · ${item.snippet?.channelTitle || "Live"}`,
        sourceType: "youtube",
        mediaType: "LIVE_VIDEO",
        externalId: vid,
        title: item.snippet?.title || `YouTube Live ${vid}`,
        countryName: "International",
        cityName: "Live Stream",
        lat: 0,
        lng: 0,
        categorySlug: "city",
        embedUrl: `https://www.youtube-nocookie.com/embed/${vid}`,
        sourceUrl: `https://www.youtube.com/watch?v=${vid}`,
        licenseNote: "YouTube Data API v3 (Embeddable)",
        privacyNote: "Pending Review",
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function collectAndProbeAllSources(): Promise<
  Array<Omit<AdminCandidate, "id" | "createdAt" | "reviewStatus">>
> {
  const [windyItems, ytItems] = await Promise.all([
    collectFromWindy(),
    collectFromYouTube(),
  ]);

  const combined = [...windyItems, ...ytItems, ...PUBLIC_FEED_CATALOG];
  const probed = await Promise.all(
    combined.map(async (item) => {
      const probe = await probeSourceStability(
        item.sourceType,
        item.embedUrl,
        item.sourceUrl
      );
      return {
        ...item,
        stabilityScore: probe.stabilityScore,
        lastProbedAt: new Date().toISOString(),
      };
    })
  );

  // Sort by stabilityScore descending so admin sees the most stable sources first
  return probed.sort((a, b) => b.stabilityScore - a.stabilityScore);
}
