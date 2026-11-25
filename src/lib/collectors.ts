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
    source: "USGS Volcano Observatory",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "usgs-kilauea-halemaumau",
    title: "Kilauea Volcano Halemaumau Crater",
    countryName: "United States",
    cityName: "Hawaii Volcanoes NP",
    lat: 19.4069,
    lng: -155.2834,
    categorySlug: "volcano",
    embedUrl: "https://volcanoes.usgs.gov/observatories/hvo/cams/KIcam/images/M.jpg",
    sourceUrl: "https://www.usgs.gov/volcanoes/kilauea/webcams",
    licenseNote: "US Public Domain (USGS)",
    privacyNote: "Pass · Geological Crater",
  },
  {
    source: "USGS Volcano Observatory",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "usgs-mauna-loa",
    title: "Mauna Loa Summit Caldera",
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
    source: "US National Park Service",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "nps-old-faithful",
    title: "Yellowstone Old Faithful Geyser",
    countryName: "United States",
    cityName: "Yellowstone",
    lat: 44.4605,
    lng: -110.8281,
    categorySlug: "nature",
    embedUrl: "https://www.nps.gov/webcams-yell/oldfaithful.jpg",
    sourceUrl: "https://www.nps.gov/yell/learn/photosmultimedia/webcams.htm",
    licenseNote: "US Public Domain (NPS)",
    privacyNote: "Pass · National Park",
  },
  {
    source: "US National Park Service",
    sourceType: "snapshot",
    mediaType: "SNAPSHOT",
    externalId: "nps-glacier-apgar",
    title: "Glacier National Park Lake McDonald",
    countryName: "United States",
    cityName: "West Glacier",
    lat: 48.5269,
    lng: -113.9912,
    categorySlug: "nature",
    embedUrl: "https://www.nps.gov/webcams-glac/apgar.jpg",
    sourceUrl: "https://www.nps.gov/glac/learn/photosmultimedia/webcams.htm",
    licenseNote: "US Public Domain (NPS)",
    privacyNote: "Pass · National Park",
  },
  {
    source: "Roundshot Panorama",
    sourceType: "official_embed",
    mediaType: "LIVE_VIDEO",
    externalId: "roundshot-zermatt-gornergrat",
    title: "Gornergrat Matterhorn 360° Panorama",
    countryName: "Switzerland",
    cityName: "Zermatt",
    lat: 45.9836,
    lng: 7.7851,
    categorySlug: "ski",
    embedUrl: "https://gornergrat.roundshot.com/#/",
    sourceUrl: "https://gornergrat.roundshot.com/",
    licenseNote: "Official Roundshot Embed",
    privacyNote: "Pass · Alpine Panorama",
  },
  {
    source: "SkylineWebcams Official",
    sourceType: "official_embed",
    mediaType: "LIVE_VIDEO",
    externalId: "skyline-trevi-fountain",
    title: "Rome Trevi Fountain Live Cam",
    countryName: "Italy",
    cityName: "Rome",
    lat: 41.9009,
    lng: 12.4833,
    categorySlug: "city",
    embedUrl: "https://www.skylinewebcams.com/en/webcam/italia/lazio/roma/fontana-di-trevi.html",
    sourceUrl: "https://www.skylinewebcams.com/en/webcam/italia/lazio/roma/fontana-di-trevi.html",
    licenseNote: "Official Partner Page",
    privacyNote: "Pass · Public Landmark",
  },
  {
    source: "YouTube Official Channel",
    sourceType: "youtube",
    mediaType: "LIVE_VIDEO",
    externalId: "ydYDqZQpim8",
    title: "NamibiaCam · Namib Desert Waterhole",
    countryName: "Namibia",
    cityName: "Gondwana Namib",
    lat: -24.5,
    lng: 15.8,
    categorySlug: "wildlife",
    embedUrl: "https://www.youtube-nocookie.com/embed/ydYDqZQpim8",
    sourceUrl: "https://www.youtube.com/watch?v=ydYDqZQpim8",
    licenseNote: "YouTube Embeddable + Official Channel",
    privacyNote: "Pass · Wildlife Reserve",
  },
  {
    source: "YouTube Official Channel",
    sourceType: "youtube",
    mediaType: "LIVE_VIDEO",
    externalId: "DjdUEyjx8GM",
    title: "Tokyo Shinjuku Kabukicho 24/7 Live",
    countryName: "Japan",
    cityName: "Tokyo",
    lat: 35.6938,
    lng: 139.7034,
    categorySlug: "city",
    embedUrl: "https://www.youtube-nocookie.com/embed/DjdUEyjx8GM",
    sourceUrl: "https://www.youtube.com/watch?v=DjdUEyjx8GM",
    licenseNote: "YouTube Embeddable",
    privacyNote: "Pass · Public Street",
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
