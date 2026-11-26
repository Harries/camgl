import type { AdminCandidate } from "./types";

export interface ProbeResult {
  online: boolean;
  stabilityScore: number;
  latencyMs: number;
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || u.pathname.split("/").pop() || null;
  } catch {
    return null;
  }
}

export async function probeSourceStability(
  sourceType: string,
  embedUrl: string,
  sourceUrl: string
): Promise<ProbeResult> {
  const start = Date.now();
  try {
    if (sourceType === "youtube") {
      const ytKey = process.env.YOUTUBE_API_KEY;
      const vid = extractYouTubeVideoId(sourceUrl) || extractYouTubeVideoId(embedUrl);
      if (ytKey && vid) {
        const apiRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${vid}&key=${ytKey}`,
          { signal: AbortSignal.timeout(4000) }
        );
        const latencyMs = Date.now() - start;
        if (apiRes.ok) {
          const json = (await apiRes.json()) as {
            items?: Array<{
              snippet?: { liveBroadcastContent?: string };
              status?: { embeddable?: boolean };
            }>;
          };
          const item = json.items?.[0];
          const isLive =
            item?.snippet?.liveBroadcastContent === "live" &&
            item?.status?.embeddable !== false;
          if (!isLive) return { online: false, stabilityScore: 0, latencyMs };
          const score = Math.max(70, Math.min(98, 100 - Math.floor(latencyMs / 45)));
          return { online: true, stabilityScore: score, latencyMs };
        }
      }

      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`,
        { signal: AbortSignal.timeout(4000) }
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) return { online: false, stabilityScore: 0, latencyMs };
      const score = Math.max(65, Math.min(98, 100 - Math.floor(latencyMs / 45)));
      return { online: true, stabilityScore: score, latencyMs };
    }

    if (sourceType === "hls" || embedUrl.toLowerCase().includes(".m3u8")) {
      const res = await fetch(embedUrl, { signal: AbortSignal.timeout(4000) });
      const latencyMs = Date.now() - start;
      if (!res.ok) return { online: false, stabilityScore: 0, latencyMs };
      const text = await res.text();
      if (!text.includes("#EXTM3U")) return { online: false, stabilityScore: 0, latencyMs };
      const firstChild = text.split(/\r?\n/).find((l) => l.trim() && !l.startsWith("#"));
      if (firstChild) {
        const childUrl = new URL(firstChild.trim(), embedUrl).href;
        const childRes = await fetch(childUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);
        if (!childRes || !childRes.ok) {
          return { online: false, stabilityScore: 0, latencyMs: Date.now() - start };
        }
      }
      const score = Math.max(65, Math.min(99, 100 - Math.floor(latencyMs / 35)));
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
  channelId?: string;
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
    source: "Beach TV Florida Keys (HLS)",
    sourceType: "hls",
    mediaType: "LIVE_VIDEO",
    externalId: "beachtv-keywest-hls",
    title: "Key West & Florida Keys Beach TV (HLS .m3u8)",
    countryName: "United States",
    cityName: "Key West",
    lat: 24.5551,
    lng: -81.78,
    categorySlug: "beach",
    embedUrl: "https://5ed325193d4e1.streamlock.net:444/LiveTV/KTVHD/playlist.m3u8",
    sourceUrl: "https://www.beachtv.com/",
    licenseNote: "Official Public HLS Broadcast",
    privacyNote: "Pass · Coastal View",
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

  // Windy API v3 has ~70,000 webcams; fetch multiple 50-item pages with rotating offsets
  const randomOffset = Math.floor(Math.random() * 300) * 50;
  const offsets = [randomOffset, randomOffset + 50];

  try {
    const pages = await Promise.all(
      offsets.map(async (offset) => {
        const res = await fetch(
          `https://api.windy.com/webcams/api/v3/webcams?limit=50&offset=${offset}&include=player,location,categories,urls`,
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
        return json.webcams ?? [];
      })
    );

    const items: CollectedCandidateInput[] = [];
    const seen = new Set<number>();
    for (const w of pages.flat()) {
      if (seen.has(w.webcamId)) continue;
      seen.add(w.webcamId);
      if (!w.player?.live) continue;
      const embed = w.player.day || w.player.live;
      const normalizedEmbed = embed.replace(
        /^(https:\/\/webcams\.windy\.com\/webcams\/public\/embed\/player\/\d+)\/live(\?.*)?$/i,
        "$1/day$2"
      );
      const lat = w.location?.latitude ?? 0;
      const lng = w.location?.longitude ?? 0;
      if (!w.location?.country || (lat === 0 && lng === 0)) continue;
      items.push({
        source: "Windy API v3",
        sourceType: "official_embed",
        mediaType: "LIVE_VIDEO",
        externalId: `windy-${w.webcamId}`,
        title: w.title,
        countryName: w.location.country,
        cityName: w.location?.city || "Unknown",
        lat,
        lng,
        categorySlug: w.categories?.[0]?.id || "nature",
        embedUrl: normalizedEmbed,
        sourceUrl: w.urls?.detail || normalizedEmbed,
        licenseNote: w.player?.day
          ? "Windy API v3 Daylight Player"
          : "Windy API v3 Live Player",
        privacyNote: "Pass · Windy Verified",
      });
    }
    return items;
  } catch {
    return [];
  }
}

const YOUTUBE_DISCOVERY_QUERIES = [
  "live webcam beach 4k",
  "live city skyline webcam 24/7",
  "live wildlife waterhole camera",
  "live mountain ski webcam",
  "live train railway webcam",
  "live harbour port webcam",
];

export async function collectFromYouTube(): Promise<CollectedCandidateInput[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  // Rotate 3 scenic queries per sync to discover diverse live streams
  const startIdx = Math.floor(Math.random() * YOUTUBE_DISCOVERY_QUERIES.length);
  const queries = [0, 1, 2].map(
    (i) => YOUTUBE_DISCOVERY_QUERIES[(startIdx + i) % YOUTUBE_DISCOVERY_QUERIES.length]
  );

  try {
    const pages = await Promise.all(
      queries.map(async (q) => {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&videoEmbeddable=true&maxResults=10&q=${encodeURIComponent(
            q
          )}&key=${apiKey}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) return [];
        const json = (await res.json()) as {
          items?: Array<{
            id?: { videoId?: string };
            snippet?: { title?: string; channelTitle?: string; channelId?: string };
          }>;
        };
        return json.items ?? [];
      })
    );

    const items: CollectedCandidateInput[] = [];
    const seen = new Set<string>();
    for (const item of pages.flat()) {
      const vid = item.id?.videoId;
      if (!vid || seen.has(vid)) continue;
      seen.add(vid);
      items.push({
        source: `YouTube API · ${item.snippet?.channelTitle || "Live"}`,
        sourceType: "youtube",
        mediaType: "LIVE_VIDEO",
        externalId: vid,
        channelId: item.snippet?.channelId,
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

  const combined = [...windyItems, ...ytItems, ...PUBLIC_FEED_CATALOG].filter(
    (item) =>
      item.mediaType === "LIVE_VIDEO" &&
      item.countryName.toLowerCase() !== "international" &&
      !(item.lat === 0 && item.lng === 0)
  );
  const probed: Array<Omit<AdminCandidate, "id" | "createdAt" | "reviewStatus">> = [];
  const CHUNK_SIZE = 20;

  for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
    const chunk = combined.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map(async (item) => {
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
    probed.push(...results);
  }

  // Sort by stabilityScore descending so admin sees the most stable sources first
  return probed.sort((a, b) => b.stabilityScore - a.stabilityScore);
}

/**
 * Track a YouTube channel to find its current live broadcast when an old video ID ends/rotates.
 */
export async function findLiveStreamForYouTubeChannel(channelId: string): Promise<{
  videoId: string;
  embedUrl: string;
  sourceUrl: string;
} | null> {
  const cleanChannelId = channelId.trim();
  if (!cleanChannelId) return null;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
          cleanChannelId
        )}&eventType=live&type=video&videoEmbeddable=true&maxResults=1&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const json = (await res.json()) as {
          items?: Array<{ id?: { videoId?: string } }>;
        };
        const vid = json.items?.[0]?.id?.videoId;
        if (vid) {
          return {
            videoId: vid,
            embedUrl: `https://www.youtube-nocookie.com/embed/${vid}`,
            sourceUrl: `https://www.youtube.com/watch?v=${vid}`,
          };
        }
      }
    } catch {
      // fall through to RSS fallback
    }
  }

  // Keyless fallback via public YouTube channel RSS + oEmbed check
  try {
    const rssRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(cleanChannelId)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!rssRes.ok) return null;
    const xml = await rssRes.text();
    const match = xml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
    const vid = match?.[1];
    if (!vid) return null;
    const sourceUrl = `https://www.youtube.com/watch?v=${vid}`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${vid}`;
    const probe = await probeSourceStability("youtube", embedUrl, sourceUrl);
    if (!probe.online) return null;
    return { videoId: vid, embedUrl, sourceUrl };
  } catch {
    return null;
  }
}
