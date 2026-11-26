import crypto from "node:crypto";
import { prisma } from "./db";
import {
  SEED_AUDIT_LOGS,
  SEED_CANDIDATES,
  SEED_CATEGORIES,
  SEED_JOBS,
  SEED_REPORTS,
  SEED_WEBCAMS,
} from "./seed-data";
import type {
  AdminAuditLog,
  AdminCandidate,
  AdminCategory,
  AdminCity,
  AdminContactMessage,
  AdminCountry,
  AdminDiscoveryJob,
  AdminLicense,
  AdminProvider,
  AdminReport,
  AdminSeoIssue,
  AdminSeoRedirect,
  AdminSubmission,
  AdminTranslation,
  AdminUser,
  AuthUser,
  PublicWebcam,
  StreamStatus,
  UserSubmission,
} from "./types";
import { coordKey, fetchWeatherBatch } from "./weather";
import { getTelemetrySummary } from "./telemetry-store";
import { getCountryFlag, resolveCountryIsoCode } from "./geo-i18n";
import {
  collectAndProbeAllSources,
  findLiveStreamForYouTubeChannel,
  probeSourceStability,
} from "./collectors";
import { hashPassword, verifyPassword } from "./user-auth";

interface MemUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  githubId?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
}

// In-memory store fallback when PostgreSQL is unreachable (e.g., offline build)
function createMemStore() {
  return {
    webcams: structuredClone(SEED_WEBCAMS) as (PublicWebcam & { reviewStatus?: string })[],
    candidates: structuredClone(SEED_CANDIDATES) as AdminCandidate[],
    jobs: structuredClone(SEED_JOBS) as AdminDiscoveryJob[],
    reports: structuredClone(SEED_REPORTS) as AdminReport[],
    contactMessages: [] as AdminContactMessage[],
    auditLogs: structuredClone(SEED_AUDIT_LOGS) as AdminAuditLog[],
    users: [] as MemUser[],
    userFavorites: new Map<string, Set<string>>(),
    passwordResets: [] as Array<{
      id: string;
      email: string;
      tokenHash: string;
      expiresAt: number;
      usedAt: number | null;
    }>,
    emailCodes: [] as Array<{
      id: string;
      email: string;
      codeHash: string;
      expiresAt: number;
      usedAt: number | null;
    }>,
    licenses: SEED_WEBCAMS.slice(0, 6).map((w, idx) => ({
      id: `lic-seed-${idx + 1}`,
      webcamId: w.id,
      webcamTitle: w.title,
      webcamSlug: w.slug,
      permissionType: w.stream?.sourceType === "youtube" ? "YouTube Official Embed" : "Official Public Feed",
      evidence: w.stream?.sourceUrl || "https://www.youtube.com/t/terms",
      verifiedAt: new Date().toISOString(),
      expiresAt: null as string | null,
      status: "ACTIVE",
    })) as AdminLicense[],
    translations: [] as AdminTranslation[],
    providers: [] as AdminProvider[],
    submissions: [] as AdminSubmission[],
    seoRedirects: [] as AdminSeoRedirect[],
    youtubeQuotaUsed: 0,
  };
}

const globalForMemStore = globalThis as unknown as {
  __camglMemStore?: ReturnType<typeof createMemStore>;
};

const memStore = (globalForMemStore.__camglMemStore ??= createMemStore());

function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432/livecam")
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").slice(0, 11) || null;
    }
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    const match = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  } catch {
    // ignore invalid URL
  }
  return null;
}

async function enrichWeather(webcams: PublicWebcam[]): Promise<PublicWebcam[]> {
  if (webcams.length === 0) return webcams;
  const weatherMap = await fetchWeatherBatch(
    webcams.map((w) => ({ lat: w.city.lat, lng: w.city.lng }))
  );
  if (weatherMap.size === 0) return webcams;
  return webcams.map((w) => ({
    ...w,
    weatherSummary: weatherMap.get(coordKey(w.city.lat, w.city.lng)) ?? w.weatherSummary,
  }));
}

function mapDbWebcam(r: {
  id: string;
  slug: string;
  title: string;
  description: string;
  bestTime: string | null;
  lat: number;
  lng: number;
  reviewStatus: string;
  isFeatured?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  city: {
    name: string;
    slug: string;
    timezone: string;
    lat: number;
    lng: number;
    country: { name: string; slug: string; isoCode: string; flag: string };
  };
  provider: { name: string; type: string; website: string | null } | null;
  categories: { category: { name: string; slug: string } }[];
  streams: {
    sourceType: string;
    externalId: string;
    channelId?: string | null;
    embedUrl: string;
    sourceUrl: string;
    mediaType: string;
    status: string;
    consecutiveFailures?: number;
    lastCheckedAt: Date | null;
    nextCheckAt?: Date | null;
  }[];
}): PublicWebcam & { reviewStatus: string } {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    bestTime: r.bestTime,
    reviewStatus: r.reviewStatus,
    isFeatured: Boolean(r.isFeatured),
    viewCount: r.viewCount ?? 0,
    favoriteCount: r.favoriteCount ?? 0,
    country: {
      name: r.city.country.name,
      slug: r.city.country.slug,
      isoCode: r.city.country.isoCode,
      flag: getCountryFlag(r.city.country.slug, r.city.country.isoCode, r.city.country.flag),
    },
    city: {
      name: r.city.name,
      slug: r.city.slug,
      timezone: r.city.timezone,
      lat: r.city.lat,
      lng: r.city.lng,
    },
    categories: r.categories.map((c) => ({ name: c.category.name, slug: c.category.slug })),
    provider: r.provider
      ? { name: r.provider.name, type: r.provider.type, website: r.provider.website }
      : null,
    stream: r.streams[0]
      ? {
          sourceType: r.streams[0].sourceType,
          externalId: r.streams[0].externalId,
          channelId: r.streams[0].channelId ?? null,
          embedUrl: r.streams[0].embedUrl,
          sourceUrl: r.streams[0].sourceUrl,
          mediaType: r.streams[0].mediaType,
          status: r.streams[0].status as StreamStatus,
          consecutiveFailures: r.streams[0].consecutiveFailures ?? 0,
          lastCheckedAt: (r.streams[0].lastCheckedAt ?? new Date()).toISOString(),
          nextCheckAt: r.streams[0].nextCheckAt ? r.streams[0].nextCheckAt.toISOString() : undefined,
        }
      : null,
    weatherSummary: "—",
    mapX: Math.round(((r.lng + 180) / 360) * 1000),
    mapY: Math.round(((90 - r.lat) / 180) * 500),
  };
}

function isFixedLocationWebcam(w: PublicWebcam): boolean {
  if (w.country.slug.toLowerCase() === "international") return false;
  if (w.city.lat === 0 && w.city.lng === 0) return false;
  if (w.stream?.mediaType && w.stream.mediaType !== "LIVE_VIDEO") return false;
  return true;
}

export async function listApprovedWebcams(filters?: {
  country?: string;
  city?: string;
  category?: string;
  q?: string;
}): Promise<PublicWebcam[]> {
  if (filters?.country?.toLowerCase() === "international") {
    return [];
  }
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
              mediaType: "LIVE_VIDEO",
            },
          },
          city: {
            country: {
              slug: filters?.country ? filters.country : { not: "international" },
            },
            ...(filters?.city ? { slug: filters.city } : {}),
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
          ...(filters?.category
            ? { categories: { some: { category: { slug: filters.category } } } }
            : {}),
          ...(filters?.q
            ? {
                OR: [
                  { title: { contains: filters.q, mode: "insensitive" } },
                  { city: { name: { contains: filters.q, mode: "insensitive" } } },
                  { city: { country: { name: { contains: filters.q, mode: "insensitive" } } } },
                ],
              }
            : {}),
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true, status: "LIVE" },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return await enrichWeather(rows.map(mapDbWebcam));
    } catch {
      // Fallback to memory store if DB connection fails
    }
  }

  const list = memStore.webcams.filter((w) => {
    if (w.reviewStatus && w.reviewStatus !== "APPROVED") return false;
    if (w.stream?.status !== "LIVE") return false;
    if (!isFixedLocationWebcam(w)) return false;
    if (filters?.country && w.country.slug !== filters.country) return false;
    if (filters?.city && w.city.slug !== filters.city) return false;
    if (filters?.category && !w.categories.some((c) => c.slug === filters.category)) return false;
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      const hay = `${w.title} ${w.country.name} ${w.city.name} ${w.categories
        .map((c) => c.name)
        .join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return enrichWeather(list);
}

export async function listMapWebcamsByBbox(filters: {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  zoom?: number;
  country?: string;
  category?: string;
  status?: "LIVE";
}): Promise<PublicWebcam[]> {
  const { minLng, minLat, maxLng, maxLat, country, category, status } = filters;
  const crossesAntimeridian = minLng > maxLng;
  const limit = (filters.zoom ?? 2) < 4 ? 300 : 500;

  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              mediaType: "LIVE_VIDEO",
              ...(status === "LIVE" ? { status: "LIVE" } : {}),
            },
          },
          city: {
            lat: { gte: minLat, lte: maxLat },
            ...(crossesAntimeridian
              ? { OR: [{ lng: { gte: minLng } }, { lng: { lte: maxLng } }] }
              : { lng: { gte: minLng, lte: maxLng } }),
            country: {
              slug: country ? country : { not: "international" },
            },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
          ...(category
            ? { categories: { some: { category: { slug: category } } } }
            : {}),
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
        take: limit,
      });

      return rows.map(mapDbWebcam);
    } catch {
      // Fallback
    }
  }

  return memStore.webcams
    .filter((w) => {
      if (w.reviewStatus && w.reviewStatus !== "APPROVED") return false;
      if (!isFixedLocationWebcam(w)) return false;
      if (status === "LIVE" && w.stream?.status !== "LIVE") return false;
      if (country && w.country.slug !== country) return false;
      if (category && !w.categories.some((c) => c.slug === category)) return false;
      if (w.city.lat < minLat || w.city.lat > maxLat) return false;
      if (crossesAntimeridian) {
        if (w.city.lng < minLng && w.city.lng > maxLng) return false;
      } else if (w.city.lng < minLng || w.city.lng > maxLng) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export async function listApprovedWebcamsPage(filters?: {
  country?: string;
  city?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: PublicWebcam[]; total: number; hasMore: boolean }> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters?.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

  if (filters?.country?.toLowerCase() === "international") {
    return { items: [], total: 0, hasMore: false };
  }

  if (isDbConfigured()) {
    try {
      const where = {
        reviewStatus: "APPROVED" as const,
        streams: {
          some: {
            isPrimary: true,
            status: "LIVE" as const,
            mediaType: "LIVE_VIDEO" as const,
          },
        },
        city: {
          country: {
            slug: filters?.country ? filters.country : { not: "international" },
          },
          ...(filters?.city ? { slug: filters.city } : {}),
          NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
        },
        ...(filters?.category
          ? { categories: { some: { category: { slug: filters.category } } } }
          : {}),
        ...(filters?.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" as const } },
                { city: { name: { contains: filters.q, mode: "insensitive" as const } } },
                { city: { country: { name: { contains: filters.q, mode: "insensitive" as const } } } },
              ],
            }
          : {}),
      };

      const [total, rows] = await Promise.all([
        prisma.webcam.count({ where }),
        prisma.webcam.findMany({
          where,
          include: {
            city: { include: { country: true } },
            provider: true,
            categories: { include: { category: true } },
            streams: {
              where: { isPrimary: true, status: "LIVE" },
              orderBy: { lastCheckedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
      ]);

      const items = await enrichWeather(rows.map(mapDbWebcam));
      return {
        items,
        total,
        hasMore: skip + items.length < total,
      };
    } catch {
      // Fallback
    }
  }

  const all = memStore.webcams.filter((w) => {
    if (w.reviewStatus && w.reviewStatus !== "APPROVED") return false;
    if (w.stream?.status !== "LIVE") return false;
    if (!isFixedLocationWebcam(w)) return false;
    if (filters?.country && w.country.slug !== filters.country) return false;
    if (filters?.city && w.city.slug !== filters.city) return false;
    if (filters?.category && !w.categories.some((c) => c.slug === filters.category)) return false;
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      const hay = `${w.title} ${w.country.name} ${w.city.name} ${w.categories
        .map((c) => c.name)
        .join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const slice = await enrichWeather(all.slice(skip, skip + pageSize));
  return {
    items: slice,
    total: all.length,
    hasMore: skip + slice.length < all.length,
  };
}

export async function listFeaturedWebcams(limit = 6): Promise<PublicWebcam[]> {
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          isFeatured: true,
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
              mediaType: "LIVE_VIDEO",
            },
          },
          city: {
            country: { slug: { not: "international" } },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true, status: "LIVE" },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      if (rows.length > 0) {
        return await enrichWeather(rows.map(mapDbWebcam));
      }
    } catch {
      // Fallback
    }
  }

  const featuredMem = memStore.webcams.filter(
    (w) =>
      w.isFeatured &&
      (!w.reviewStatus || w.reviewStatus === "APPROVED") &&
      w.stream?.status === "LIVE" &&
      isFixedLocationWebcam(w)
  );
  if (featuredMem.length > 0) {
    return enrichWeather(featuredMem.slice(0, limit));
  }

  const fallback = await listApprovedWebcamsPage({ page: 1, pageSize: limit });
  return fallback.items;
}

export async function getWebcamBySlug(slug: string): Promise<PublicWebcam | null> {
  if (isDbConfigured()) {
    try {
      const row = await prisma.webcam.findFirst({
        where: {
          slug,
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
              mediaType: "LIVE_VIDEO",
            },
          },
          city: {
            country: { slug: { not: "international" } },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true, status: "LIVE" },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
      });
      if (!row) return null;
      const [enriched] = await enrichWeather([mapDbWebcam(row)]);
      return enriched ?? null;
    } catch {
      // Fallback
    }
  }

  const found = memStore.webcams.find(
    (w) =>
      w.slug === slug &&
      (!w.reviewStatus || w.reviewStatus === "APPROVED") &&
      w.stream?.status === "LIVE" &&
      isFixedLocationWebcam(w)
  );
  if (!found) return null;
  const [enriched] = await enrichWeather([found]);
  return enriched ?? null;
}

export async function incrementWebcamViewCount(slug: string): Promise<number | null> {
  if (isDbConfigured()) {
    try {
      const updated = await prisma.webcam.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      return updated.viewCount;
    } catch {
      // Fallback
    }
  }

  const cam = memStore.webcams.find((w) => w.slug === slug);
  if (!cam) return null;
  cam.viewCount = (cam.viewCount ?? 0) + 1;
  return cam.viewCount;
}

export async function getRandomWebcam(
  input?: string | { excludeSlug?: string; country?: string; category?: string }
): Promise<PublicWebcam | null> {
  const opts = typeof input === "string" ? { excludeSlug: input } : input ?? {};
  const scoped = await listApprovedWebcams({
    country: opts.country,
    category: opts.category,
  });
  const liveScoped = scoped.filter(
    (w) => w.slug !== opts.excludeSlug && w.stream?.status === "LIVE"
  );
  if (liveScoped.length > 0) {
    return liveScoped[Math.floor(Math.random() * liveScoped.length)];
  }
  if (scoped.length > 0) {
    const fallbackScoped = scoped.filter((w) => w.slug !== opts.excludeSlug);
    const pool = fallbackScoped.length > 0 ? fallbackScoped : scoped;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const all = await listApprovedWebcams();
  const pool = all.filter((w) => w.slug !== opts.excludeSlug && w.stream?.status === "LIVE");
  const target = pool.length > 0 ? pool : all;
  if (target.length === 0) return null;
  return target[Math.floor(Math.random() * target.length)];
}

export async function listPopularWebcams(limit = 36): Promise<PublicWebcam[]> {
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
              mediaType: "LIVE_VIDEO",
            },
          },
          city: {
            country: { slug: { not: "international" } },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true, status: "LIVE" },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ viewCount: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
        take: limit,
      });
      return enrichWeather(rows.map(mapDbWebcam));
    } catch {
      // Fallback
    }
  }

  const all = await listApprovedWebcams();
  return [...all]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, limit);
}

export async function listNewWebcams(limit = 36): Promise<PublicWebcam[]> {
  const { items } = await listApprovedWebcamsPage({ page: 1, pageSize: Math.min(48, limit) });
  return items;
}

export async function listWebcamsBySlugs(slugs: string[]): Promise<PublicWebcam[]> {
  const clean = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean))).slice(0, 50);
  if (clean.length === 0) return [];

  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          slug: { in: clean },
          reviewStatus: "APPROVED",
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
      });
      const enriched = await enrichWeather(rows.map(mapDbWebcam));
      const order = new Map(clean.map((s, i) => [s, i]));
      return enriched.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
    } catch {
      // Fallback
    }
  }

  const all = await listApprovedWebcams();
  const bySlug = new Map(all.map((w) => [w.slug, w]));
  return clean.map((s) => bySlug.get(s)).filter((w): w is PublicWebcam => Boolean(w));
}

export async function listUserSubmissions(email: string): Promise<UserSubmission[]> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return [];
  if (isDbConfigured()) {
    try {
      const rows = await prisma.submission.findMany({
        where: { contact: { equals: cleanEmail, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        location: r.location,
        sourceUrl: r.sourceUrl,
        status: r.status as UserSubmission["status"],
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      // Fallback
    }
  }
  return [];
}

export async function listMostLikedWebcams(limit = 48): Promise<PublicWebcam[]> {
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
              mediaType: "LIVE_VIDEO",
            },
          },
          city: {
            country: { slug: { not: "international" } },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true, status: "LIVE" },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ favoriteCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
        take: limit,
      });
      return enrichWeather(rows.map(mapDbWebcam));
    } catch {
      // Fallback
    }
  }

  const all = await listApprovedWebcams();
  return [...all]
    .sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0) || (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, limit);
}

function toAuthUser(u: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  createdAt: Date | string;
}): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl ?? null,
    role: u.role,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
  };
}

export async function createEmailVerificationCode(
  emailInput: string
): Promise<{ ok: true; code: string; email: string } | { ok: false; error: string }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (isDbConfigured()) {
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { ok: false, error: "An account with this email already exists." };
      }
      await prisma.emailVerificationCode.create({
        data: { email, codeHash, expiresAt },
      });
      return { ok: true, code, email };
    } catch {
      // Fallback
    }
  }

  if (memStore.users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  memStore.emailCodes.push({
    id: `evc-${Date.now()}`,
    email,
    codeHash,
    expiresAt: expiresAt.getTime(),
    usedAt: null,
  });
  return { ok: true, code, email };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  code: string;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const code = input.code.trim();
  if (!name || !email || input.password.length < 6) {
    return { ok: false, error: "Name, valid email, and password (min 6 chars) are required." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Please enter the 6-digit email verification code." };
  }
  const codeHash = crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
  const passwordHash = hashPassword(input.password);

  if (isDbConfigured()) {
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const codeRecord = await prisma.emailVerificationCode.findFirst({
        where: { email, codeHash, usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!codeRecord) {
        return { ok: false, error: "Verification code is invalid or has expired." };
      }
      const [created] = await prisma.$transaction([
        prisma.user.create({
          data: { email, name, passwordHash, emailVerifiedAt: new Date(), role: "USER" },
        }),
        prisma.emailVerificationCode.update({
          where: { id: codeRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);
      return { ok: true, user: toAuthUser(created) };
    } catch {
      // Fallback
    }
  }

  if (memStore.users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const codeRecord = [...memStore.emailCodes]
    .reverse()
    .find((c) => c.email === email && c.codeHash === codeHash && !c.usedAt && c.expiresAt > Date.now());
  if (!codeRecord) {
    return { ok: false, error: "Verification code is invalid or has expired." };
  }
  codeRecord.usedAt = Date.now();
  const created: MemUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    passwordHash,
    role: "USER",
    createdAt: new Date().toISOString(),
  };
  memStore.users.push(created);
  return { ok: true, user: toAuthUser(created) };
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser | null> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return null;

  if (isDbConfigured()) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        return null;
      }
      return toAuthUser(user);
    } catch {
      // Fallback
    }
  }

  const user = memStore.users.find((u) => u.email === email);
  if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    return null;
  }
  return toAuthUser(user);
}

export async function findOrCreateGithubUser(input: {
  githubId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || "GitHub User";

  if (isDbConfigured()) {
    try {
      const byGithub = await prisma.user.findUnique({
        where: { githubId: input.githubId },
      });
      if (byGithub) {
        const updated = await prisma.user.update({
          where: { id: byGithub.id },
          data: {
            avatarUrl: input.avatarUrl ?? byGithub.avatarUrl,
            name: byGithub.name || name,
          },
        });
        return toAuthUser(updated);
      }

      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        const linked = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            githubId: input.githubId,
            avatarUrl: input.avatarUrl ?? byEmail.avatarUrl,
          },
        });
        return toAuthUser(linked);
      }

      const created = await prisma.user.create({
        data: {
          email,
          name,
          githubId: input.githubId,
          avatarUrl: input.avatarUrl ?? null,
          role: "USER",
        },
      });
      return toAuthUser(created);
    } catch {
      // Fallback
    }
  }

  const existing =
    memStore.users.find((u) => u.githubId === input.githubId) ??
    memStore.users.find((u) => u.email === email);
  if (existing) {
    existing.githubId = input.githubId;
    existing.avatarUrl = input.avatarUrl ?? existing.avatarUrl ?? null;
    return toAuthUser(existing);
  }

  const created: MemUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    passwordHash: null,
    githubId: input.githubId,
    avatarUrl: input.avatarUrl ?? null,
    role: "USER",
    createdAt: new Date().toISOString(),
  };
  memStore.users.push(created);
  return toAuthUser(created);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  if (!userId) return null;
  if (isDbConfigured()) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return user ? toAuthUser(user) : null;
    } catch {
      // Fallback
    }
  }
  const user = memStore.users.find((u) => u.id === userId);
  return user ? toAuthUser(user) : null;
}

export async function updateUserProfile(
  userId: string,
  input: { name: string }
): Promise<AuthUser | null> {
  const name = input.name.trim();
  if (!userId || !name) return null;
  if (isDbConfigured()) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
      return toAuthUser(updated);
    } catch {
      // Fallback
    }
  }
  const user = memStore.users.find((u) => u.id === userId);
  if (!user) return null;
  user.name = name;
  return toAuthUser(user);
}

export async function deleteUserAccountAndData(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (isDbConfigured()) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return false;
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { email: user.email } }),
        prisma.emailVerificationCode.deleteMany({ where: { email: user.email } }),
        prisma.user.delete({ where: { id: userId } }),
        prisma.auditLog.create({
          data: {
            actor: "user-self-service",
            action: "USER_DATA_DELETED",
            targetType: "user",
            targetId: userId,
          },
        }),
      ]);
      return true;
    } catch {
      // Fallback
    }
  }

  const idx = memStore.users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;
  const email = memStore.users[idx].email;
  memStore.users.splice(idx, 1);
  memStore.userFavorites.delete(userId);
  memStore.passwordResets = memStore.passwordResets.filter((r) => r.email !== email);
  memStore.emailCodes = memStore.emailCodes.filter((c) => c.email !== email);
  return true;
}

export async function createPasswordResetToken(
  emailInput: string
): Promise<{ token: string; name: string; email: string } | null> {
  const email = emailInput.trim().toLowerCase();
  if (!email) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  if (isDbConfigured()) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      await prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash,
          expiresAt,
        },
      });
      return { token: rawToken, name: user.name, email: user.email };
    } catch {
      // Fallback
    }
  }

  const user = memStore.users.find((u) => u.email === email);
  if (!user) return null;
  memStore.passwordResets.push({
    id: `prt-${Date.now()}`,
    email,
    tokenHash,
    expiresAt: expiresAt.getTime(),
    usedAt: null,
  });
  return { token: rawToken, name: user.name, email: user.email };
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanToken = rawToken.trim();
  if (!cleanToken || newPassword.length < 6) {
    return { ok: false, error: "Valid reset token and password (min 6 chars) are required." };
  }
  const tokenHash = crypto.createHash("sha256").update(cleanToken).digest("hex");
  const passwordHash = hashPassword(newPassword);

  if (isDbConfigured()) {
    try {
      const record = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return { ok: false, error: "Reset link is invalid or has expired." };
      }
      const user = await prisma.user.findUnique({ where: { email: record.email } });
      if (!user) {
        return { ok: false, error: "Account not found." };
      }
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
      return { ok: true };
    } catch {
      // Fallback
    }
  }

  const record = memStore.passwordResets.find((r) => r.tokenHash === tokenHash);
  if (!record || record.usedAt || record.expiresAt < Date.now()) {
    return { ok: false, error: "Reset link is invalid or has expired." };
  }
  const user = memStore.users.find((u) => u.email === record.email);
  if (!user) {
    return { ok: false, error: "Account not found." };
  }
  user.passwordHash = passwordHash;
  record.usedAt = Date.now();
  return { ok: true };
}

export async function getUserFavoriteSlugs(userId: string): Promise<string[]> {
  if (!userId) return [];
  if (isDbConfigured()) {
    try {
      const rows = await prisma.userFavorite.findMany({
        where: { userId },
        include: { webcam: { select: { slug: true } } },
      });
      return rows.map((r) => r.webcam.slug);
    } catch {
      // Fallback
    }
  }
  return Array.from(memStore.userFavorites.get(userId) ?? []);
}

export async function listUserFavoriteWebcams(userId: string): Promise<PublicWebcam[]> {
  if (!userId) return [];
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          favorites: { some: { userId } },
        },
        include: {
          city: { include: { country: true } },
          provider: true,
          categories: { include: { category: true } },
          streams: {
            where: { isPrimary: true },
            orderBy: { lastCheckedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ favoriteCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      });
      return enrichWeather(rows.map(mapDbWebcam));
    } catch {
      // Fallback
    }
  }
  const slugs = await getUserFavoriteSlugs(userId);
  const cams = await listWebcamsBySlugs(slugs);
  return [...cams].sort(
    (a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0) || (b.viewCount ?? 0) - (a.viewCount ?? 0)
  );
}

export async function toggleUserFavorite(
  userId: string,
  slug: string
): Promise<{ favorited: boolean; favoriteCount: number } | null> {
  if (!userId || !slug) return null;
  if (isDbConfigured()) {
    try {
      const webcam = await prisma.webcam.findUnique({
        where: { slug },
        select: { id: true, favoriteCount: true },
      });
      if (!webcam) return null;

      const existing = await prisma.userFavorite.findUnique({
        where: { userId_webcamId: { userId, webcamId: webcam.id } },
      });

      if (existing) {
        const [, updated] = await prisma.$transaction([
          prisma.userFavorite.delete({
            where: { userId_webcamId: { userId, webcamId: webcam.id } },
          }),
          prisma.webcam.update({
            where: { id: webcam.id },
            data: { favoriteCount: { decrement: webcam.favoriteCount > 0 ? 1 : 0 } },
            select: { favoriteCount: true },
          }),
        ]);
        return { favorited: false, favoriteCount: Math.max(0, updated.favoriteCount) };
      }

      const [, updated] = await prisma.$transaction([
        prisma.userFavorite.create({
          data: { userId, webcamId: webcam.id },
        }),
        prisma.webcam.update({
          where: { id: webcam.id },
          data: { favoriteCount: { increment: 1 } },
          select: { favoriteCount: true },
        }),
      ]);
      return { favorited: true, favoriteCount: updated.favoriteCount };
    } catch {
      // Fallback
    }
  }

  const cam = memStore.webcams.find((w) => w.slug === slug);
  if (!cam) return null;
  let set = memStore.userFavorites.get(userId);
  if (!set) {
    set = new Set<string>();
    memStore.userFavorites.set(userId, set);
  }
  if (set.has(slug)) {
    set.delete(slug);
    cam.favoriteCount = Math.max(0, (cam.favoriteCount ?? 0) - 1);
    return { favorited: false, favoriteCount: cam.favoriteCount };
  }
  set.add(slug);
  cam.favoriteCount = (cam.favoriteCount ?? 0) + 1;
  return { favorited: true, favoriteCount: cam.favoriteCount };
}

export async function mergeUserFavorites(
  userId: string,
  slugs: string[]
): Promise<{ synced: number; mySlugs: string[] }> {
  const cleanSlugs = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean))).slice(0, 200);
  if (!userId || cleanSlugs.length === 0) {
    return { synced: 0, mySlugs: await getUserFavoriteSlugs(userId) };
  }

  let synced = 0;
  if (isDbConfigured()) {
    try {
      const webcams = await prisma.webcam.findMany({
        where: { slug: { in: cleanSlugs }, reviewStatus: "APPROVED" },
        select: { id: true, slug: true },
      });
      const existing = await prisma.userFavorite.findMany({
        where: { userId, webcamId: { in: webcams.map((w) => w.id) } },
        select: { webcamId: true },
      });
      const existingSet = new Set(existing.map((e) => e.webcamId));
      const toInsert = webcams.filter((w) => !existingSet.has(w.id));
      if (toInsert.length > 0) {
        await prisma.$transaction([
          prisma.userFavorite.createMany({
            data: toInsert.map((w) => ({ userId, webcamId: w.id })),
            skipDuplicates: true,
          }),
          ...toInsert.map((w) =>
            prisma.webcam.update({
              where: { id: w.id },
              data: { favoriteCount: { increment: 1 } },
            })
          ),
        ]);
        synced = toInsert.length;
      }
      return { synced, mySlugs: await getUserFavoriteSlugs(userId) };
    } catch {
      // Fallback
    }
  }

  let set = memStore.userFavorites.get(userId);
  if (!set) {
    set = new Set<string>();
    memStore.userFavorites.set(userId, set);
  }
  for (const slug of cleanSlugs) {
    const cam = memStore.webcams.find((w) => w.slug === slug);
    if (cam && !set.has(slug)) {
      set.add(slug);
      cam.favoriteCount = (cam.favoriteCount ?? 0) + 1;
      synced += 1;
    }
  }
  return { synced, mySlugs: Array.from(set) };
}

export async function listCountriesSummary() {
  const all = await listApprovedWebcams();
  const map = new Map<
    string,
    { name: string; slug: string; flag: string; cities: Set<string>; count: number }
  >();
  for (const w of all) {
    const existing = map.get(w.country.slug) ?? {
      name: w.country.name,
      slug: w.country.slug,
      flag: w.country.flag,
      cities: new Set<string>(),
      count: 0,
    };
    existing.cities.add(w.city.slug);
    existing.count += 1;
    map.set(w.country.slug, existing);
  }
  return Array.from(map.values()).map((c) => ({
    name: c.name,
    slug: c.slug,
    flag: c.flag,
    cityCount: c.cities.size,
    webcamCount: c.count,
  }));
}

export interface NavCountryItem {
  name: string;
  slug: string;
  isoCode: string;
  flag: string;
  webcamCount: number;
  cities: Array<{ name: string; slug: string; webcamCount: number }>;
}

export async function listCountriesWithCities(): Promise<NavCountryItem[]> {
  const buildFromRows = (
    rows: Array<{
      country: { name: string; slug: string; isoCode: string; flag: string };
      city: { name: string; slug: string };
    }>
  ): NavCountryItem[] => {
    const map = new Map<
      string,
      {
        name: string;
        slug: string;
        isoCode: string;
        flag: string;
        webcamCount: number;
        cities: Map<string, { name: string; slug: string; webcamCount: number }>;
      }
    >();

    for (const r of rows) {
      let c = map.get(r.country.slug);
      if (!c) {
        c = {
          name: r.country.name,
          slug: r.country.slug,
          isoCode: r.country.isoCode,
          flag: r.country.flag,
          webcamCount: 0,
          cities: new Map(),
        };
        map.set(r.country.slug, c);
      }
      c.webcamCount += 1;
      const existingCity = c.cities.get(r.city.slug) ?? {
        name: r.city.name,
        slug: r.city.slug,
        webcamCount: 0,
      };
      existingCity.webcamCount += 1;
      c.cities.set(r.city.slug, existingCity);
    }

    return Array.from(map.values())
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        isoCode: c.isoCode,
        flag: c.flag,
        webcamCount: c.webcamCount,
        cities: Array.from(c.cities.values()).sort((a, b) => b.webcamCount - a.webcamCount),
      }))
      .sort((a, b) => b.webcamCount - a.webcamCount);
  };

  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: { isPrimary: true, status: "LIVE", mediaType: "LIVE_VIDEO" },
          },
          city: {
            country: { slug: { not: "international" } },
            NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
          },
        },
        select: {
          city: {
            select: {
              name: true,
              slug: true,
              country: {
                select: { name: true, slug: true, isoCode: true, flag: true },
              },
            },
          },
        },
      });
      return buildFromRows(
        rows.map((r) => ({
          country: {
            ...r.city.country,
            flag: getCountryFlag(r.city.country.slug, r.city.country.isoCode, r.city.country.flag),
          },
          city: { name: r.city.name, slug: r.city.slug },
        }))
      );
    } catch {
      // Fallback
    }
  }

  return buildFromRows(
    memStore.webcams
      .filter((w) => {
        if (w.reviewStatus && w.reviewStatus !== "APPROVED") return false;
        if (w.stream?.status !== "LIVE") return false;
        return isFixedLocationWebcam(w);
      })
      .map((w) => ({
        country: w.country,
        city: { name: w.city.name, slug: w.city.slug },
      }))
  );
}

export async function listCategories() {
  if (isDbConfigured()) {
    try {
      const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
      if (rows.length > 0) return rows.map((r) => ({ slug: r.slug, name: r.name }));
    } catch {
      // Fallback
    }
  }
  return SEED_CATEGORIES;
}

function detectSourceMeta(url: string, ytId: string | null): {
  sourceType: string;
  mediaType: "LIVE_VIDEO" | "SNAPSHOT";
} {
  if (ytId) return { sourceType: "youtube", mediaType: "LIVE_VIDEO" };
  const lower = url.toLowerCase();
  if (lower.includes(".m3u8")) return { sourceType: "hls", mediaType: "LIVE_VIDEO" };
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower)) {
    return { sourceType: "snapshot", mediaType: "SNAPSHOT" };
  }
  return { sourceType: "official_embed", mediaType: "LIVE_VIDEO" };
}

export async function createSubmission(input: {
  title: string;
  description?: string;
  category: string;
  location: string;
  sourceUrl: string;
  operator?: string;
  contact: string;
}) {
  const parts = input.location.split(/[·,]/).map((s) => s.trim());
  const countryName = parts[0] || "International";
  const cityName = parts[1] || parts[0] || "Unknown";
  const ytId = extractYouTubeId(input.sourceUrl);
  const externalId = ytId ?? `sub-${Date.now()}`;
  const embedUrl = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}`
    : input.sourceUrl;
  const { sourceType, mediaType } = detectSourceMeta(input.sourceUrl, ytId);
  const probe = await probeSourceStability(sourceType, embedUrl, input.sourceUrl);

  const cleanDescription = input.description?.trim() || null;

  if (isDbConfigured()) {
    try {
      const [sub] = await prisma.$transaction([
        prisma.submission.create({
          data: {
            title: input.title,
            description: cleanDescription,
            category: input.category,
            location: input.location,
            sourceUrl: input.sourceUrl,
            operator: input.operator,
            contact: input.contact,
            declaration: true,
          },
        }),
        prisma.candidate.create({
          data: {
            source: input.operator ? `Partner · ${input.operator}` : "User Submission",
            sourceType,
            mediaType,
            externalId,
            title: input.title,
            description: cleanDescription,
            countryName,
            cityName,
            categorySlug: input.category.toLowerCase(),
            embedUrl,
            sourceUrl: input.sourceUrl,
            licenseNote: "Pending Operator Verification",
            privacyNote: "Pending Review",
            stabilityScore: probe.stabilityScore,
            lastProbedAt: new Date(),
            reviewStatus: "PENDING",
          },
        }),
        prisma.auditLog.create({
          data: {
            actor: "public-form",
            action: "SUBMISSION_CREATED",
            targetType: "candidate",
            targetId: input.title,
          },
        }),
      ]);
      return { id: sub.id };
    } catch {
      // Fallback
    }
  }

  const cand: AdminCandidate = {
    id: `cand-${Date.now()}`,
    source: input.operator ? `Partner · ${input.operator}` : "User Submission",
    sourceType,
    mediaType,
    externalId,
    title: input.title,
    description: cleanDescription,
    countryName,
    cityName,
    lat: 0,
    lng: 0,
    categorySlug: input.category.toLowerCase(),
    embedUrl,
    sourceUrl: input.sourceUrl,
    licenseNote: "Pending Operator Verification",
    privacyNote: "Pending Review",
    stabilityScore: probe.stabilityScore,
    lastProbedAt: new Date().toISOString(),
    reviewStatus: "PENDING",
    createdAt: new Date().toISOString(),
  };
  memStore.candidates.unshift(cand);
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "public-form",
    action: "SUBMISSION_CREATED",
    targetType: "candidate",
    targetId: input.title,
    detail: null,
    createdAt: "Just now",
  });
  return cand;
}

export async function createReport(input: {
  webcamId: string;
  webcamTitle: string;
  type: string;
  description?: string;
}) {
  if (isDbConfigured()) {
    try {
      const rep = await prisma.report.create({
        data: {
          webcamId: input.webcamId,
          type: input.type,
          description: input.description ?? null,
        },
      });
      return { id: rep.id };
    } catch {
      // Fallback
    }
  }

  const rep: AdminReport = {
    id: `rep-${Date.now()}`,
    webcamId: input.webcamId,
    webcamTitle: input.webcamTitle,
    type: input.type,
    description: input.description ?? null,
    status: "OPEN",
    createdAt: "Just now",
  };
  memStore.reports.unshift(rep);
  return rep;
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (isDbConfigured()) {
    try {
      const [created] = await prisma.$transaction([
        prisma.contactMessage.create({
          data: {
            name: input.name,
            email: input.email,
            subject: input.subject,
            message: input.message,
          },
        }),
        prisma.auditLog.create({
          data: {
            actor: "public-contact",
            action: "CONTACT_CREATED",
            targetType: "contact",
            targetId: input.subject,
            detail: input.email,
          },
        }),
      ]);
      return { id: created.id };
    } catch {
      // Fallback
    }
  }

  const msg: AdminContactMessage = {
    id: `msg-${Date.now()}`,
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
  memStore.contactMessages.unshift(msg);
  return msg;
}

export async function resolveContactMessage(id: string) {
  if (isDbConfigured()) {
    try {
      const updated = await prisma.contactMessage.update({
        where: { id },
        data: { status: "RESOLVED" },
      });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "CONTACT_RESOLVED",
          targetType: "contact",
          targetId: updated.subject,
        },
      });
      return true;
    } catch {
      // Fallback
    }
  }

  const msg = memStore.contactMessages.find((m) => m.id === id);
  if (!msg) return false;
  msg.status = "RESOLVED";
  return true;
}

function buildSeoIssues(
  webcams: (PublicWebcam & { reviewStatus?: string })[],
  licenses: AdminLicense[]
): AdminSeoIssue[] {
  const licensedWebcamIds = new Set(
    licenses.filter((l) => l.status === "ACTIVE").map((l) => l.webcamId)
  );
  const issuesList: AdminSeoIssue[] = [];
  for (const w of webcams) {
    const issues: string[] = [];
    if (!w.description || w.description.trim().length < 40) {
      issues.push("Thin description (<40 chars)");
    }
    if (!licensedWebcamIds.has(w.id)) {
      issues.push("Missing active license");
    }
    if (w.stream?.status === "OFFLINE") {
      issues.push("Stream offline");
    }
    if ((w.stream?.consecutiveFailures ?? 0) >= 3) {
      issues.push(`High failure count (${w.stream?.consecutiveFailures})`);
    }
    if (issues.length > 0) {
      issuesList.push({
        webcamId: w.id,
        slug: w.slug,
        title: w.title,
        issues,
      });
    }
  }
  return issuesList;
}

export async function getAdminDashboardData() {
  if (isDbConfigured()) {
    try {
      const [
        webcams,
        candidates,
        jobs,
        reports,
        contactMessages,
        auditLogs,
        categories,
        countries,
        cities,
        users,
        licenses,
        translations,
        providers,
        submissions,
        seoRedirects,
      ] = await Promise.all([
        prisma.webcam.findMany({
          include: {
            city: { include: { country: true } },
            provider: true,
            categories: { include: { category: true } },
            streams: {
              where: { isPrimary: true },
              orderBy: { lastCheckedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.candidate.findMany({
          where: { reviewStatus: "PENDING" },
          orderBy: [{ stabilityScore: "desc" }, { createdAt: "desc" }],
        }),
        prisma.discoveryJob.findMany({ orderBy: { nextRunAt: "asc" } }),
        prisma.report.findMany({
          include: { webcam: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
        prisma.category.findMany({
          include: { _count: { select: { webcams: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.country.findMany({
          include: {
            cities: {
              select: {
                id: true,
                _count: { select: { webcams: true } },
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.city.findMany({
          include: {
            country: true,
            _count: { select: { webcams: true } },
          },
          orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
        }),
        prisma.user.findMany({
          include: { _count: { select: { favorites: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.license.findMany({
          include: { webcam: { select: { id: true, title: true, slug: true } } },
          orderBy: { verifiedAt: "desc" },
        }),
        prisma.translation.findMany({
          orderBy: [{ entityType: "asc" }, { updatedAt: "desc" }],
          take: 200,
        }),
        prisma.provider.findMany({
          include: { _count: { select: { webcams: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.submission.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.seoRedirect.findMany({
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const quotaUsed = jobs.reduce((acc, j) => acc + j.quotaCost, 0);
      const mappedWebcams = webcams.map(mapDbWebcam);
      const mappedLicenses: AdminLicense[] = licenses.map((l) => ({
        id: l.id,
        webcamId: l.webcamId,
        webcamTitle: l.webcam.title,
        webcamSlug: l.webcam.slug,
        permissionType: l.permissionType,
        evidence: l.evidence,
        verifiedAt: l.verifiedAt.toISOString(),
        expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
        status: l.status,
      }));

      return {
        webcams: mappedWebcams,
        candidates: candidates.map((c) => ({
          id: c.id,
          source: c.source,
          sourceType: c.sourceType,
          mediaType: c.mediaType,
          externalId: c.externalId,
          title: c.title,
          description: c.description,
          countryName: c.countryName,
          cityName: c.cityName,
          lat: c.lat,
          lng: c.lng,
          categorySlug: c.categorySlug,
          embedUrl: c.embedUrl,
          sourceUrl: c.sourceUrl,
          licenseNote: c.licenseNote,
          privacyNote: c.privacyNote,
          stabilityScore: c.stabilityScore,
          lastProbedAt: c.lastProbedAt ? c.lastProbedAt.toISOString() : null,
          reviewStatus: c.reviewStatus,
          createdAt: c.createdAt.toISOString(),
        })),
        jobs: jobs.map((j) => ({
          id: j.id,
          source: j.source,
          query: j.query,
          status: j.status,
          quotaCost: j.quotaCost,
          lastRunAt: j.lastRunAt ? j.lastRunAt.toISOString() : "Never",
          foundCount: 0,
        })),
        reports: reports.map((r) => ({
          id: r.id,
          webcamId: r.webcamId,
          webcamTitle: r.webcam.title,
          type: r.type,
          description: r.description,
          status: (r.status === "RESOLVED" ? "RESOLVED" : "OPEN") as AdminReport["status"],
          createdAt: r.createdAt.toISOString(),
        })),
        contactMessages: contactMessages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          status: (m.status === "RESOLVED" ? "RESOLVED" : "OPEN") as AdminContactMessage["status"],
          createdAt: m.createdAt.toISOString(),
        })),
        auditLogs: auditLogs.map((l) => ({
          id: l.id,
          actor: l.actor,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          detail: l.detail,
          createdAt: l.createdAt.toISOString(),
        })),
        categories: categories.map((c): AdminCategory => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          webcamCount: c._count.webcams,
        })),
        countries: countries.map((co): AdminCountry => ({
          id: co.id,
          isoCode: co.isoCode,
          name: co.name,
          slug: co.slug,
          flag: co.flag,
          cityCount: co.cities.length,
          webcamCount: co.cities.reduce((sum, ci) => sum + ci._count.webcams, 0),
        })),
        cities: cities.map((ci): AdminCity => ({
          id: ci.id,
          countryId: ci.countryId,
          countryName: ci.country.name,
          countrySlug: ci.country.slug,
          countryFlag: ci.country.flag,
          name: ci.name,
          slug: ci.slug,
          lat: ci.lat,
          lng: ci.lng,
          timezone: ci.timezone,
          webcamCount: ci._count.webcams,
        })),
        users: users.map((u): AdminUser => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          githubId: u.githubId,
          avatarUrl: u.avatarUrl,
          favoritesCount: u._count.favorites,
          createdAt: u.createdAt.toISOString(),
        })),
        licenses: mappedLicenses,
        translations: translations.map((t): AdminTranslation => ({
          id: t.id,
          entityType: t.entityType as AdminTranslation["entityType"],
          entityId: t.entityId,
          locale: t.locale,
          title: t.title,
          description: t.description,
          updatedAt: t.updatedAt.toISOString(),
        })),
        providers: providers.map((p): AdminProvider => ({
          id: p.id,
          name: p.name,
          type: p.type,
          website: p.website,
          contact: p.contact,
          verified: p.verified,
          webcamCount: p._count.webcams,
        })),
        submissions: submissions.map((s): AdminSubmission => ({
          id: s.id,
          title: s.title,
          description: s.description,
          category: s.category,
          location: s.location,
          sourceUrl: s.sourceUrl,
          operator: s.operator,
          contact: s.contact,
          declaration: s.declaration,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        })),
        seoRedirects: seoRedirects.map((r): AdminSeoRedirect => ({
          id: r.id,
          fromPath: r.fromPath,
          toPath: r.toPath,
          statusCode: r.statusCode,
          createdAt: r.createdAt.toISOString(),
        })),
        seoIssues: buildSeoIssues(mappedWebcams, mappedLicenses),
        telemetry: getTelemetrySummary(),
        youtubeQuotaUsed: quotaUsed,
      };
    } catch {
      // Fallback
    }
  }

  const memCountryMap = new Map<string, AdminCountry>();
  const memCityMap = new Map<string, AdminCity>();
  const memCatCounts = new Map<string, number>();

  for (const w of memStore.webcams) {
    for (const c of w.categories) {
      memCatCounts.set(c.slug, (memCatCounts.get(c.slug) ?? 0) + 1);
    }
    const existingCo = memCountryMap.get(w.country.slug) ?? {
      id: `country-${w.country.slug}`,
      isoCode: w.country.isoCode,
      name: w.country.name,
      slug: w.country.slug,
      flag: w.country.flag,
      cityCount: 0,
      webcamCount: 0,
    };
    existingCo.webcamCount += 1;
    memCountryMap.set(w.country.slug, existingCo);

    const cityKey = `${w.country.slug}:${w.city.slug}`;
    const existingCi = memCityMap.get(cityKey);
    if (existingCi) {
      existingCi.webcamCount += 1;
    } else {
      existingCo.cityCount += 1;
      memCityMap.set(cityKey, {
        id: `city-${w.city.slug}`,
        countryId: existingCo.id,
        countryName: w.country.name,
        countrySlug: w.country.slug,
        countryFlag: w.country.flag,
        name: w.city.name,
        slug: w.city.slug,
        lat: w.city.lat,
        lng: w.city.lng,
        timezone: w.city.timezone,
        webcamCount: 1,
      });
    }
  }

  return {
    webcams: memStore.webcams.map((w) => ({
      ...w,
      reviewStatus: w.reviewStatus ?? "APPROVED",
    })),
    candidates: memStore.candidates,
    jobs: memStore.jobs,
    reports: memStore.reports,
    contactMessages: memStore.contactMessages,
    auditLogs: memStore.auditLogs,
    categories: SEED_CATEGORIES.map((c): AdminCategory => ({
      id: `cat-${c.slug}`,
      slug: c.slug,
      name: c.name,
      webcamCount: memCatCounts.get(c.slug) ?? 0,
    })),
    countries: Array.from(memCountryMap.values()),
    cities: Array.from(memCityMap.values()),
    users: memStore.users.map((u): AdminUser => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      githubId: u.githubId ?? null,
      avatarUrl: u.avatarUrl ?? null,
      favoritesCount: memStore.userFavorites.get(u.id)?.size ?? 0,
      createdAt: u.createdAt,
    })),
    licenses: memStore.licenses,
    translations: memStore.translations,
    providers: memStore.providers,
    submissions: memStore.submissions,
    seoRedirects: memStore.seoRedirects,
    seoIssues: buildSeoIssues(memStore.webcams, memStore.licenses),
    telemetry: getTelemetrySummary(),
    youtubeQuotaUsed: memStore.youtubeQuotaUsed,
  };
}

export async function setUserRoleAdmin(
  userId: string,
  role: "USER" | "ADMIN"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!userId) return { ok: false, error: "User ID is required" };
  if (isDbConfigured()) {
    try {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) return { ok: false, error: "User not found" };
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      await prisma.auditLog.create({
        data: {
          actor: "admin",
          action: "SET_USER_ROLE",
          targetType: "User",
          targetId: userId,
          detail: `${existing.email} -> ${role}`,
        },
      });
      return { ok: true };
    } catch {
      // Fallback
    }
  }
  const u = memStore.users.find((m) => m.id === userId);
  if (!u) return { ok: false, error: "User not found" };
  u.role = role;
  return { ok: true };
}

export async function upsertCategoryAdmin(input: {
  id?: string;
  name: string;
  slug?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  if (!name || !slug) return { ok: false, error: "Category name and slug are required" };

  if (isDbConfigured()) {
    try {
      if (input.id) {
        await prisma.category.update({
          where: { id: input.id },
          data: { name, slug },
        });
      } else {
        await prisma.category.create({ data: { name, slug } });
      }
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: input.id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
          targetType: "category",
          targetId: slug,
          detail: name,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to save category" };
    }
  }

  return { ok: true };
}

export async function deleteCategoryAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      const cat = await prisma.category.findUnique({ where: { id } });
      if (!cat) return { ok: false, error: "Category not found" };
      await prisma.category.delete({ where: { id } });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "CATEGORY_DELETED",
          targetType: "category",
          targetId: cat.slug,
          detail: cat.name,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete category" };
    }
  }
  return { ok: true };
}

export async function upsertCountryAdmin(input: {
  id?: string;
  name: string;
  slug?: string;
  isoCode: string;
  flag?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  const isoCode = input.isoCode.trim().toUpperCase().slice(0, 4);
  const flag = input.flag?.trim() || "🌍";
  if (!name || !slug || !isoCode) {
    return { ok: false, error: "Country name, slug, and ISO code are required" };
  }

  if (isDbConfigured()) {
    try {
      if (input.id) {
        await prisma.country.update({
          where: { id: input.id },
          data: { name, slug, isoCode, flag },
        });
      } else {
        await prisma.country.create({ data: { name, slug, isoCode, flag } });
      }
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: input.id ? "COUNTRY_UPDATED" : "COUNTRY_CREATED",
          targetType: "country",
          targetId: slug,
          detail: `${flag} ${name} (${isoCode})`,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to save country" };
    }
  }

  return { ok: true };
}

export async function deleteCountryAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      const country = await prisma.country.findUnique({
        where: { id },
        include: { _count: { select: { cities: true } } },
      });
      if (!country) return { ok: false, error: "Country not found" };
      if (country._count.cities > 0) {
        return {
          ok: false,
          error: `Cannot delete "${country.name}" while it still has ${country._count.cities} cities.`,
        };
      }
      await prisma.country.delete({ where: { id } });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "COUNTRY_DELETED",
          targetType: "country",
          targetId: country.slug,
          detail: country.name,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete country" };
    }
  }
  return { ok: true };
}

export async function upsertCityAdmin(input: {
  id?: string;
  countryId: string;
  name: string;
  slug?: string;
  lat: number;
  lng: number;
  timezone: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() || name);
  const timezone = input.timezone.trim() || "UTC";
  if (!input.countryId || !name || !slug) {
    return { ok: false, error: "Country, city name, and slug are required" };
  }

  if (isDbConfigured()) {
    try {
      if (input.id) {
        await prisma.city.update({
          where: { id: input.id },
          data: {
            countryId: input.countryId,
            name,
            slug,
            lat: Number.isFinite(input.lat) ? input.lat : 0,
            lng: Number.isFinite(input.lng) ? input.lng : 0,
            timezone,
          },
        });
      } else {
        await prisma.city.create({
          data: {
            countryId: input.countryId,
            name,
            slug,
            lat: Number.isFinite(input.lat) ? input.lat : 0,
            lng: Number.isFinite(input.lng) ? input.lng : 0,
            timezone,
          },
        });
      }
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: input.id ? "CITY_UPDATED" : "CITY_CREATED",
          targetType: "city",
          targetId: slug,
          detail: name,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to save city" };
    }
  }

  return { ok: true };
}

export async function deleteCityAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      const city = await prisma.city.findUnique({
        where: { id },
        include: { _count: { select: { webcams: true } } },
      });
      if (!city) return { ok: false, error: "City not found" };
      if (city._count.webcams > 0) {
        return {
          ok: false,
          error: `Cannot delete "${city.name}" while it still has ${city._count.webcams} webcams.`,
        };
      }
      await prisma.city.delete({ where: { id } });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "CITY_DELETED",
          targetType: "city",
          targetId: city.slug,
          detail: city.name,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete city" };
    }
  }
  return { ok: true };
}

export async function approveCandidate(id: string) {
  if (isDbConfigured()) {
    try {
      const cand = await prisma.candidate.findUnique({ where: { id } });
      if (!cand) return null;

      // If this stream is already in the database, mark candidate approved and ensure webcam is live
      const existingStream = await prisma.stream.findFirst({
        where: {
          OR: [
            { sourceType: cand.sourceType, externalId: cand.externalId },
            { embedUrl: cand.embedUrl },
            { sourceUrl: cand.sourceUrl },
          ],
        },
        include: { webcam: true },
      });

      if (existingStream) {
        await prisma.$transaction([
          prisma.webcam.update({
            where: { id: existingStream.webcamId },
            data: { reviewStatus: "APPROVED" },
          }),
          prisma.stream.update({
            where: { id: existingStream.id },
            data: { status: "LIVE", lastCheckedAt: new Date() },
          }),
          prisma.candidate.update({
            where: { id },
            data: { reviewStatus: "APPROVED" },
          }),
          prisma.auditLog.create({
            data: {
              actor: "admin@livecam",
              action: "APPROVED_EXISTING",
              targetType: "webcam",
              targetId: existingStream.webcam.title,
            },
          }),
        ]);
        return existingStream.webcam;
      }

      const countrySlug = slugify(cand.countryName) || "international";
      const citySlug = slugify(cand.cityName) || "city";
      const webcamSlug = `${slugify(cand.title)}-${Date.now().toString(36)}`;

      const baseIso = resolveCountryIsoCode(countrySlug, cand.countryName);
      const existingIso = await prisma.country.findUnique({ where: { isoCode: baseIso } });
      const safeIso =
        existingIso && existingIso.slug !== countrySlug
          ? `${baseIso}${countrySlug.slice(0, 1).toUpperCase()}`
          : baseIso;
      const resolvedFlag = getCountryFlag(countrySlug, baseIso);

      const country = await prisma.country.upsert({
        where: { slug: countrySlug },
        update: { flag: resolvedFlag },
        create: {
          isoCode: safeIso,
          name: cand.countryName,
          slug: countrySlug,
          flag: resolvedFlag,
        },
      });

      const city = await prisma.city.upsert({
        where: { countryId_slug: { countryId: country.id, slug: citySlug } },
        update: {},
        create: {
          countryId: country.id,
          name: cand.cityName,
          slug: citySlug,
          lat: cand.lat,
          lng: cand.lng,
          timezone: "UTC",
        },
      });

      const category = await prisma.category.findUnique({
        where: { slug: cand.categorySlug },
      });

      const webcam = await prisma.webcam.create({
        data: {
          cityId: city.id,
          slug: webcamSlug,
          title: cand.title,
          description:
            cand.description?.trim() ||
            `${cand.title} located in ${cand.cityName}, ${cand.countryName}.`,
          bestTime: "Daylight and golden hour.",
          lat: cand.lat || city.lat,
          lng: cand.lng || city.lng,
          reviewStatus: "APPROVED",
          streams: {
            create: {
              sourceType: cand.sourceType,
              externalId: cand.externalId,
              channelId: cand.channelId ?? null,
              embedUrl: cand.embedUrl,
              sourceUrl: cand.sourceUrl,
              mediaType: cand.mediaType,
              status: "LIVE",
              lastCheckedAt: new Date(),
            },
          },
          licenses: {
            create: {
              permissionType: cand.licenseNote || "Official Public Embed",
              evidence: cand.sourceUrl,
              status: "ACTIVE",
            },
          },
          ...(category
            ? { categories: { create: { categoryId: category.id } } }
            : {}),
        },
      });

      await prisma.$transaction([
        prisma.candidate.update({ where: { id }, data: { reviewStatus: "APPROVED" } }),
        prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: "APPROVED",
            targetType: "webcam",
            targetId: cand.title,
          },
        }),
      ]);

      return webcam;
    } catch {
      // Fallback
    }
  }

  const idx = memStore.candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const cand = memStore.candidates.splice(idx, 1)[0];

  const existingMem = memStore.webcams.find(
    (w) =>
      (w.stream?.sourceType === cand.sourceType && w.stream?.externalId === cand.externalId) ||
      w.stream?.embedUrl === cand.embedUrl ||
      w.stream?.sourceUrl === cand.sourceUrl ||
      (w.title.toLowerCase() === cand.title.toLowerCase() &&
        w.city.name.toLowerCase() === cand.cityName.toLowerCase())
  );
  if (existingMem) {
    existingMem.reviewStatus = "APPROVED";
    if (existingMem.stream) {
      existingMem.stream.status = "LIVE";
      existingMem.stream.lastCheckedAt = new Date().toISOString();
    }
    return existingMem;
  }

  const slug = slugify(cand.title);
  const newCam: PublicWebcam & { reviewStatus?: string } = {
    id: `cam-${Date.now()}`,
    slug,
    title: cand.title,
    description:
      cand.description?.trim() ||
      `${cand.title} located in ${cand.cityName}, ${cand.countryName}. Approved via Admin Review.`,
    bestTime: "Daylight and golden hour.",
    country: {
      name: cand.countryName,
      slug: slugify(cand.countryName),
      isoCode: resolveCountryIsoCode(cand.countryName),
      flag: getCountryFlag(cand.countryName),
    },
    city: {
      name: cand.cityName,
      slug: slugify(cand.cityName),
      timezone: "UTC",
      lat: cand.lat || 40,
      lng: cand.lng || 10,
    },
    categories: [{ name: cand.categorySlug, slug: cand.categorySlug }],
    provider: { name: cand.source, type: "partner", website: null },
    stream: {
      sourceType: cand.sourceType,
      externalId: cand.externalId,
      embedUrl: cand.embedUrl,
      sourceUrl: cand.sourceUrl,
      mediaType: cand.mediaType,
      status: "LIVE",
      lastCheckedAt: new Date().toISOString(),
    },
    weatherSummary: "—",
    mapX: 500,
    mapY: 160,
    reviewStatus: "APPROVED",
  };
  memStore.webcams.unshift(newCam);
  memStore.licenses.unshift({
    id: `lic-${Date.now()}`,
    webcamId: newCam.id,
    webcamTitle: newCam.title,
    webcamSlug: newCam.slug,
    permissionType: cand.licenseNote || "Official Public Embed",
    evidence: cand.sourceUrl,
    verifiedAt: new Date().toISOString(),
    expiresAt: null,
    status: "ACTIVE",
  });
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "admin@livecam",
    action: "APPROVED",
    targetType: "webcam",
    targetId: cand.title,
    detail: null,
    createdAt: "Just now",
  });
  return newCam;
}

export async function rejectCandidate(id: string) {
  if (isDbConfigured()) {
    try {
      const cand = await prisma.candidate.findUnique({ where: { id } });
      if (!cand) return false;
      await prisma.$transaction([
        prisma.candidate.update({ where: { id }, data: { reviewStatus: "REJECTED" } }),
        prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: "REJECTED",
            targetType: "candidate",
            targetId: cand.title,
          },
        }),
      ]);
      return true;
    } catch {
      // Fallback
    }
  }

  const idx = memStore.candidates.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  const cand = memStore.candidates.splice(idx, 1)[0];
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "admin@livecam",
    action: "REJECTED",
    targetType: "candidate",
    targetId: cand.title,
    detail: null,
    createdAt: "Just now",
  });
  return true;
}

export async function approveCandidatesBatch(ids: string[]) {
  let approved = 0;
  for (const id of ids) {
    const res = await approveCandidate(id);
    if (res) approved += 1;
  }
  return { approved };
}

export async function rejectCandidatesBatch(ids: string[]) {
  if (ids.length === 0) return { rejected: 0 };
  if (isDbConfigured()) {
    try {
      const res = await prisma.candidate.updateMany({
        where: { id: { in: ids }, reviewStatus: "PENDING" },
        data: { reviewStatus: "REJECTED" },
      });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "REJECTED_BATCH",
          targetType: "candidate",
          targetId: `${res.count} candidates`,
        },
      });
      return { rejected: res.count };
    } catch {
      // Fallback
    }
  }
  let rejected = 0;
  for (const id of ids) {
    if (await rejectCandidate(id)) rejected += 1;
  }
  return { rejected };
}

export async function toggleWebcamFeatured(slug: string) {
  if (isDbConfigured()) {
    try {
      const cam = await prisma.webcam.findUnique({ where: { slug } });
      if (!cam) return null;
      const nextFeatured = !cam.isFeatured;
      const [updated] = await prisma.$transaction([
        prisma.webcam.update({
          where: { slug },
          data: { isFeatured: nextFeatured },
        }),
        prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: nextFeatured ? "PINNED_FEATURED" : "UNPINNED_FEATURED",
            targetType: "webcam",
            targetId: cam.title,
          },
        }),
      ]);
      return updated;
    } catch {
      // Fallback
    }
  }

  const cam = memStore.webcams.find((w) => w.slug === slug);
  if (!cam) return null;
  cam.isFeatured = !cam.isFeatured;
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "admin@livecam",
    action: cam.isFeatured ? "PINNED_FEATURED" : "UNPINNED_FEATURED",
    targetType: "webcam",
    targetId: cam.title,
    detail: null,
    createdAt: "Just now",
  });
  return cam;
}

export async function toggleWebcamSuspend(slug: string) {
  if (isDbConfigured()) {
    try {
      const cam = await prisma.webcam.findUnique({ where: { slug } });
      if (!cam) return null;
      const nextStatus = cam.reviewStatus === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
      const [updated] = await prisma.$transaction([
        prisma.webcam.update({
          where: { slug },
          data: { reviewStatus: nextStatus },
        }),
        prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: nextStatus === "SUSPENDED" ? "SUSPENDED" : "RESTORED",
            targetType: "webcam",
            targetId: cam.title,
          },
        }),
      ]);
      return updated;
    } catch {
      // Fallback
    }
  }

  const cam = memStore.webcams.find((w) => w.slug === slug);
  if (!cam) return null;
  cam.reviewStatus = cam.reviewStatus === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "admin@livecam",
    action: cam.reviewStatus === "SUSPENDED" ? "SUSPENDED" : "RESTORED",
    targetType: "webcam",
    targetId: cam.title,
    detail: null,
    createdAt: "Just now",
  });
  return cam;
}

export async function updateWebcamDetails(input: {
  slug: string;
  title: string;
  description: string;
  bestTime?: string | null;
  sourceType?: string;
  embedUrl?: string;
  sourceUrl?: string;
  categorySlugs?: string[];
  lat?: number;
  lng?: number;
}) {
  const cleanBestTime = input.bestTime?.trim() || null;
  const mediaType = input.sourceType === "snapshot" ? "SNAPSHOT" : "LIVE_VIDEO";

  if (isDbConfigured()) {
    try {
      const cam = await prisma.webcam.findUnique({
        where: { slug: input.slug },
        include: { streams: { where: { isPrimary: true }, take: 1 } },
      });
      if (!cam) return null;

      await prisma.webcam.update({
        where: { id: cam.id },
        data: {
          title: input.title.trim(),
          description: input.description.trim(),
          bestTime: cleanBestTime,
          ...(typeof input.lat === "number" && !Number.isNaN(input.lat) ? { lat: input.lat } : {}),
          ...(typeof input.lng === "number" && !Number.isNaN(input.lng) ? { lng: input.lng } : {}),
        },
      });

      if (cam.streams[0] && input.embedUrl && input.sourceUrl && input.sourceType) {
        await prisma.stream.update({
          where: { id: cam.streams[0].id },
          data: {
            sourceType: input.sourceType,
            embedUrl: input.embedUrl.trim(),
            sourceUrl: input.sourceUrl.trim(),
            mediaType,
          },
        });
      }

      if (input.categorySlugs && input.categorySlugs.length > 0) {
        const cats = await prisma.category.findMany({
          where: { slug: { in: input.categorySlugs } },
        });
        await prisma.webcamCategory.deleteMany({ where: { webcamId: cam.id } });
        if (cats.length > 0) {
          await prisma.webcamCategory.createMany({
            data: cats.map((c) => ({ webcamId: cam.id, categoryId: c.id })),
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "UPDATED",
          targetType: "webcam",
          targetId: input.title.trim(),
        },
      });

      return cam;
    } catch {
      // Fallback
    }
  }

  const cam = memStore.webcams.find((w) => w.slug === input.slug);
  if (!cam) return null;
  cam.title = input.title.trim();
  cam.description = input.description.trim();
  cam.bestTime = cleanBestTime;
  if (typeof input.lat === "number" && !Number.isNaN(input.lat)) cam.city.lat = input.lat;
  if (typeof input.lng === "number" && !Number.isNaN(input.lng)) cam.city.lng = input.lng;
  if (cam.stream && input.embedUrl && input.sourceUrl && input.sourceType) {
    cam.stream.sourceType = input.sourceType;
    cam.stream.embedUrl = input.embedUrl.trim();
    cam.stream.sourceUrl = input.sourceUrl.trim();
    cam.stream.mediaType = mediaType;
  }
  if (input.categorySlugs && input.categorySlugs.length > 0) {
    cam.categories = input.categorySlugs.map((s) => ({
      slug: s,
      name: s.charAt(0).toUpperCase() + s.slice(1),
    }));
  }
  return cam;
}

export async function syncAllSourceCandidates() {
  const items = await collectAndProbeAllSources();

  if (isDbConfigured()) {
    try {
      const now = new Date();
      const [existingStreams, existingCandidates] = await Promise.all([
        prisma.stream.findMany({
          select: { sourceType: true, externalId: true, embedUrl: true, sourceUrl: true },
        }),
        prisma.candidate.findMany({
          select: { sourceType: true, externalId: true, embedUrl: true },
        }),
      ]);
      const existingKeys = new Set([
        ...existingStreams.map((s) => `${s.sourceType}:${s.externalId}`),
        ...existingCandidates.map((c) => `${c.sourceType}:${c.externalId}`),
      ]);
      const existingUrls = new Set([
        ...existingStreams.map((s) => s.embedUrl),
        ...existingStreams.map((s) => s.sourceUrl),
        ...existingCandidates.map((c) => c.embedUrl),
      ]);
      const seenBatch = new Set<string>();
      const newItems = items.filter((item) => {
        const key = `${item.sourceType}:${item.externalId}`;
        if (existingKeys.has(key) || existingUrls.has(item.embedUrl) || existingUrls.has(item.sourceUrl)) {
          return false;
        }
        if (seenBatch.has(key) || seenBatch.has(item.embedUrl)) return false;
        seenBatch.add(key);
        seenBatch.add(item.embedUrl);
        return true;
      });

      await prisma.candidate.createMany({
        data: newItems.map((item) => ({
          source: item.source,
          sourceType: item.sourceType,
          mediaType: item.mediaType as "LIVE_VIDEO" | "SNAPSHOT",
          externalId: item.externalId,
          channelId: item.channelId ?? null,
          title: item.title,
          countryName: item.countryName,
          cityName: item.cityName,
          lat: item.lat,
          lng: item.lng,
          categorySlug: item.categorySlug,
          embedUrl: item.embedUrl,
          sourceUrl: item.sourceUrl,
          licenseNote: item.licenseNote,
          privacyNote: item.privacyNote,
          stabilityScore: item.stabilityScore,
          lastProbedAt: now,
          reviewStatus: "PENDING",
        })),
        skipDuplicates: true,
      });

      await prisma.discoveryJob.upsert({
        where: { id: "job-multi-source" },
        update: {
          status: "SUCCESS",
          lastRunAt: now,
          quotaCost: items.filter((i) => i.source.startsWith("YouTube API")).length * 10,
        },
        create: {
          id: "job-multi-source",
          source: "Multi-Source Collector (Windy/YT/USGS/NPS/Roundshot)",
          query: "All Configured Sources",
          status: "SUCCESS",
          quotaCost: items.filter((i) => i.source.startsWith("YouTube API")).length * 10,
          lastRunAt: now,
        },
      });

      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "MULTI_SOURCE_SYNC",
          targetType: "candidate",
          targetId: `${items.length} sources probed`,
          detail: `${items.filter((i) => i.stabilityScore >= 70).length} stable`,
        },
      });
      return { synced: items.length };
    } catch {
      // Fallback
    }
  }

  for (const item of items) {
    const alreadyInWebcams = memStore.webcams.some(
      (w) =>
        (w.stream?.sourceType === item.sourceType && w.stream?.externalId === item.externalId) ||
        w.stream?.embedUrl === item.embedUrl ||
        w.stream?.sourceUrl === item.sourceUrl
    );
    if (alreadyInWebcams) continue;

    const existing = memStore.candidates.find(
      (c) =>
        (c.sourceType === item.sourceType && c.externalId === item.externalId) ||
        c.embedUrl === item.embedUrl ||
        c.sourceUrl === item.sourceUrl
    );
    if (existing) {
      existing.stabilityScore = item.stabilityScore;
      existing.lastProbedAt = item.lastProbedAt;
    } else {
      memStore.candidates.unshift({
        id: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...item,
        reviewStatus: "PENDING",
        createdAt: new Date().toISOString(),
      });
    }
  }
  memStore.candidates.sort((a, b) => b.stabilityScore - a.stabilityScore);
  return { synced: items.length };
}

export async function reprobeCandidates() {
  if (isDbConfigured()) {
    try {
      const pending = await prisma.candidate.findMany({ where: { reviewStatus: "PENDING" } });
      const now = new Date();
      await Promise.all(
        pending.map(async (c) => {
          const probe = await probeSourceStability(c.sourceType, c.embedUrl, c.sourceUrl);
          return prisma.candidate.update({
            where: { id: c.id },
            data: { stabilityScore: probe.stabilityScore, lastProbedAt: now },
          });
        })
      );
      return { probed: pending.length };
    } catch {
      // Fallback
    }
  }

  await Promise.all(
    memStore.candidates.map(async (c) => {
      const probe = await probeSourceStability(c.sourceType, c.embedUrl, c.sourceUrl);
      c.stabilityScore = probe.stabilityScore;
      c.lastProbedAt = new Date().toISOString();
    })
  );
  memStore.candidates.sort((a, b) => b.stabilityScore - a.stabilityScore);
  return { probed: memStore.candidates.length };
}

export async function runHealthCheckBatch() {
  const now = new Date();
  const OFFLINE_FAILURE_THRESHOLD = 3;

  if (isDbConfigured()) {
    try {
      const streams = await prisma.stream.findMany({
        where: {
          isPrimary: true,
          nextCheckAt: { lte: now },
        },
        include: {
          webcam: { select: { id: true, title: true, isFeatured: true, viewCount: true } },
        },
        orderBy: [
          { webcam: { isFeatured: "desc" } },
          { webcam: { viewCount: "desc" } },
          { nextCheckAt: "asc" },
        ],
        take: 50,
      });

      // If no streams are due yet, check the oldest 20 so manual trigger always works
      const targets =
        streams.length > 0
          ? streams
          : await prisma.stream.findMany({
              where: { isPrimary: true },
              include: {
                webcam: { select: { id: true, title: true, isFeatured: true, viewCount: true } },
              },
              orderBy: { lastCheckedAt: "asc" },
              take: 20,
            });

      let relinkedCount = 0;
      const results = await Promise.all(
        targets.map(async (s) => {
          const probe = await probeSourceStability(s.sourceType, s.embedUrl, s.sourceUrl);
          if (probe.online) {
            const intervalMin = s.webcam.isFeatured || s.webcam.viewCount >= 50 ? 30 : 60;
            return {
              id: s.id,
              status: "LIVE" as const,
              consecutiveFailures: 0,
              nextCheckAt: new Date(now.getTime() + intervalMin * 60_000),
              reason: `Online (${probe.latencyMs}ms)`,
            };
          }

          // Try YouTube channel tracking if offline and channelId is configured
          if (s.sourceType === "youtube" && s.channelId) {
            const relinked = await findLiveStreamForYouTubeChannel(s.channelId);
            if (relinked && relinked.videoId !== s.externalId) {
              relinkedCount += 1;
              return {
                id: s.id,
                status: "LIVE" as const,
                consecutiveFailures: 0,
                nextCheckAt: new Date(now.getTime() + 30 * 60_000),
                reason: `Auto-relinked to ${relinked.videoId}`,
                relink: relinked,
                webcamTitle: s.webcam.title,
              };
            }
          }

          const failures = (s.consecutiveFailures ?? 0) + 1;
          const backoffMin = Math.min(24 * 60, 30 * Math.pow(2, failures - 1));
          const nextStatus =
            failures >= OFFLINE_FAILURE_THRESHOLD ? ("OFFLINE" as const) : ("UNKNOWN" as const);
          return {
            id: s.id,
            status: nextStatus,
            consecutiveFailures: failures,
            nextCheckAt: new Date(now.getTime() + backoffMin * 60_000),
            reason: `Probe failed (${failures}/${OFFLINE_FAILURE_THRESHOLD}, backoff ${backoffMin}m)`,
          };
        })
      );

      await Promise.all(
        results.map(async (r) => {
          await prisma.stream.update({
            where: { id: r.id },
            data: {
              status: r.status,
              consecutiveFailures: r.consecutiveFailures,
              lastCheckedAt: now,
              nextCheckAt: r.nextCheckAt,
              ...("relink" in r && r.relink
                ? {
                    externalId: r.relink.videoId,
                    embedUrl: r.relink.embedUrl,
                    sourceUrl: r.relink.sourceUrl,
                  }
                : {}),
            },
          });
          if ("relink" in r && r.relink) {
            await prisma.auditLog.create({
              data: {
                actor: "cron-health",
                action: "YOUTUBE_STREAM_RELINKED",
                targetType: "stream",
                targetId: r.webcamTitle || r.id,
                detail: `New videoId ${r.relink.videoId}`,
              },
            });
          }
        })
      );

      if (results.length > 0) {
        await prisma.healthCheck.createMany({
          data: results.map((r) => ({
            streamId: r.id,
            status: r.status,
            reason: r.reason,
            checkedAt: now,
          })),
        });
      }

      const liveCount = results.filter((r) => r.status === "LIVE").length;
      await prisma.auditLog.create({
        data: {
          actor: "cron-health",
          action: "HEALTH_CHECK",
          targetType: "stream",
          targetId: `${results.length} streams`,
          detail: `${liveCount}/${results.length} online${relinkedCount ? `, ${relinkedCount} relinked` : ""}`,
        },
      });

      return { checked: results.length, liveCount, relinkedCount };
    } catch {
      // Fallback
    }
  }

  const nowIso = now.toISOString();
  let liveCount = 0;
  let relinkedCount = 0;
  const due = memStore.webcams.filter((w) => {
    if (!w.stream) return false;
    if (!w.stream.nextCheckAt) return true;
    return new Date(w.stream.nextCheckAt).getTime() <= now.getTime();
  });
  const targets = due.length > 0 ? due : memStore.webcams.slice(0, 20);

  for (const w of targets) {
    if (!w.stream) continue;
    const probe = await probeSourceStability(
      w.stream.sourceType,
      w.stream.embedUrl,
      w.stream.sourceUrl
    );
    if (probe.online) {
      const intervalMin = w.isFeatured || (w.viewCount ?? 0) >= 50 ? 30 : 60;
      w.stream.status = "LIVE";
      w.stream.consecutiveFailures = 0;
      w.stream.lastCheckedAt = nowIso;
      w.stream.nextCheckAt = new Date(now.getTime() + intervalMin * 60_000).toISOString();
      liveCount += 1;
    } else if (w.stream.sourceType === "youtube" && w.stream.channelId) {
      const relinked = await findLiveStreamForYouTubeChannel(w.stream.channelId);
      if (relinked && relinked.videoId !== w.stream.externalId) {
        w.stream.externalId = relinked.videoId;
        w.stream.embedUrl = relinked.embedUrl;
        w.stream.sourceUrl = relinked.sourceUrl;
        w.stream.status = "LIVE";
        w.stream.consecutiveFailures = 0;
        w.stream.lastCheckedAt = nowIso;
        w.stream.nextCheckAt = new Date(now.getTime() + 30 * 60_000).toISOString();
        liveCount += 1;
        relinkedCount += 1;
      } else {
        const failures = (w.stream.consecutiveFailures ?? 0) + 1;
        const backoffMin = Math.min(24 * 60, 30 * Math.pow(2, failures - 1));
        w.stream.consecutiveFailures = failures;
        w.stream.status = failures >= OFFLINE_FAILURE_THRESHOLD ? "OFFLINE" : "UNKNOWN";
        w.stream.lastCheckedAt = nowIso;
        w.stream.nextCheckAt = new Date(now.getTime() + backoffMin * 60_000).toISOString();
      }
    } else {
      const failures = (w.stream.consecutiveFailures ?? 0) + 1;
      const backoffMin = Math.min(24 * 60, 30 * Math.pow(2, failures - 1));
      w.stream.consecutiveFailures = failures;
      w.stream.status = failures >= OFFLINE_FAILURE_THRESHOLD ? "OFFLINE" : "UNKNOWN";
      w.stream.lastCheckedAt = nowIso;
      w.stream.nextCheckAt = new Date(now.getTime() + backoffMin * 60_000).toISOString();
    }
  }
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "cron-health",
    action: "HEALTH_CHECK",
    targetType: "stream",
    targetId: `${targets.length} streams`,
    detail: `${liveCount}/${targets.length} online${relinkedCount ? `, ${relinkedCount} relinked` : ""}`,
    createdAt: "Just now",
  });
  return { checked: targets.length, liveCount, relinkedCount };
}

export async function upsertLicenseAdmin(input: {
  id?: string;
  webcamId: string;
  permissionType: string;
  evidence: string;
  expiresAt?: string | null;
  status?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const webcamId = input.webcamId.trim();
  const permissionType = input.permissionType.trim();
  const evidence = input.evidence.trim();
  if (!webcamId || !permissionType || !evidence) {
    return { ok: false, error: "Webcam, permission type, and evidence are required" };
  }
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  const status = input.status?.trim() || "ACTIVE";

  if (isDbConfigured()) {
    try {
      if (input.id) {
        await prisma.license.update({
          where: { id: input.id },
          data: { webcamId, permissionType, evidence, expiresAt, status },
        });
      } else {
        await prisma.license.create({
          data: { webcamId, permissionType, evidence, expiresAt, status },
        });
      }
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "UPSERT_LICENSE",
          targetType: "license",
          targetId: webcamId,
          detail: `${permissionType} (${status})`,
        },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to save license" };
    }
  }

  const cam = memStore.webcams.find((w) => w.id === webcamId);
  if (!cam) return { ok: false, error: "Webcam not found" };
  if (input.id) {
    const existing = memStore.licenses.find((l) => l.id === input.id);
    if (!existing) return { ok: false, error: "License not found" };
    existing.permissionType = permissionType;
    existing.evidence = evidence;
    existing.expiresAt = expiresAt ? expiresAt.toISOString() : null;
    existing.status = status;
  } else {
    memStore.licenses.unshift({
      id: `lic-${Date.now()}`,
      webcamId,
      webcamTitle: cam.title,
      webcamSlug: cam.slug,
      permissionType,
      evidence,
      verifiedAt: new Date().toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      status,
    });
  }
  return { ok: true };
}

export async function deleteLicenseAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "License ID required" };
  if (isDbConfigured()) {
    try {
      await prisma.license.delete({ where: { id } });
      return { ok: true };
    } catch {
      return { ok: false, error: "License not found" };
    }
  }
  const idx = memStore.licenses.findIndex((l) => l.id === id);
  if (idx === -1) return { ok: false, error: "License not found" };
  memStore.licenses.splice(idx, 1);
  return { ok: true };
}

export async function getEntityTranslation(
  entityType: "webcam" | "city" | "country" | "category",
  entityId: string,
  locale: string
): Promise<{ title: string; description: string | null } | null> {
  if (isDbConfigured()) {
    try {
      const row = await prisma.translation.findUnique({
        where: { entityType_entityId_locale: { entityType, entityId, locale } },
      });
      if (row) return { title: row.title, description: row.description };
    } catch {
      // Fallback
    }
  }
  const mem = memStore.translations.find(
    (t) => t.entityType === entityType && t.entityId === entityId && t.locale === locale
  );
  return mem ? { title: mem.title, description: mem.description } : null;
}

export async function upsertTranslationAdmin(input: {
  entityType: "webcam" | "city" | "country" | "category";
  entityId: string;
  locale: string;
  title: string;
  description?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const entityId = input.entityId.trim();
  const locale = input.locale.trim().toLowerCase();
  const title = input.title.trim();
  const description = input.description?.trim() || null;
  if (!entityId || !locale || !title) {
    return { ok: false, error: "Entity, locale, and title are required" };
  }

  if (isDbConfigured()) {
    try {
      await prisma.translation.upsert({
        where: {
          entityType_entityId_locale: {
            entityType: input.entityType,
            entityId,
            locale,
          },
        },
        update: { title, description },
        create: {
          entityType: input.entityType,
          entityId,
          locale,
          title,
          description,
        },
      });
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: "UPSERT_TRANSLATION",
          targetType: input.entityType,
          targetId: `${entityId}:${locale}`,
        },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to save translation" };
    }
  }

  const existing = memStore.translations.find(
    (t) => t.entityType === input.entityType && t.entityId === entityId && t.locale === locale
  );
  if (existing) {
    existing.title = title;
    existing.description = description;
    existing.updatedAt = new Date().toISOString();
  } else {
    memStore.translations.unshift({
      id: `tr-${Date.now()}`,
      entityType: input.entityType,
      entityId,
      locale,
      title,
      description,
      updatedAt: new Date().toISOString(),
    });
  }
  return { ok: true };
}

export async function deleteTranslationAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Translation ID required" };
  if (isDbConfigured()) {
    try {
      await prisma.translation.delete({ where: { id } });
      return { ok: true };
    } catch {
      return { ok: false, error: "Translation not found" };
    }
  }
  const idx = memStore.translations.findIndex((t) => t.id === id);
  if (idx === -1) return { ok: false, error: "Translation not found" };
  memStore.translations.splice(idx, 1);
  return { ok: true };
}

export async function upsertProviderAdmin(input: {
  id?: string;
  name: string;
  type: string;
  website?: string | null;
  contact?: string | null;
  verified?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const type = input.type.trim() || "hotel";
  if (!name) return { ok: false, error: "Provider name is required" };
  const website = input.website?.trim() || null;
  const contact = input.contact?.trim() || null;
  const verified = Boolean(input.verified);

  if (isDbConfigured()) {
    try {
      if (input.id) {
        await prisma.provider.update({
          where: { id: input.id },
          data: { name, type, website, contact, verified },
        });
      } else {
        await prisma.provider.create({
          data: { name, type, website, contact, verified },
        });
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to save provider" };
    }
  }

  if (input.id) {
    const existing = memStore.providers.find((p) => p.id === input.id);
    if (!existing) return { ok: false, error: "Provider not found" };
    existing.name = name;
    existing.type = type;
    existing.website = website;
    existing.contact = contact;
    existing.verified = verified;
  } else {
    memStore.providers.unshift({
      id: `prov-${Date.now()}`,
      name,
      type,
      website,
      contact,
      verified,
      webcamCount: 0,
    });
  }
  return { ok: true };
}

export async function toggleProviderVerifiedAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      const p = await prisma.provider.findUnique({ where: { id } });
      if (!p) return { ok: false, error: "Provider not found" };
      await prisma.provider.update({ where: { id }, data: { verified: !p.verified } });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to toggle provider" };
    }
  }
  const p = memStore.providers.find((x) => x.id === id);
  if (!p) return { ok: false, error: "Provider not found" };
  p.verified = !p.verified;
  return { ok: true };
}

export async function reviewSubmissionAdmin(
  id: string,
  status: "APPROVED" | "REJECTED"
): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      const sub = await prisma.submission.findUnique({ where: { id } });
      if (!sub) return { ok: false, error: "Submission not found" };
      await prisma.submission.update({ where: { id }, data: { status } });
      if (status === "APPROVED" && sub.operator) {
        const existingProvider = await prisma.provider.findFirst({
          where: { name: sub.operator },
        });
        if (!existingProvider) {
          await prisma.provider.create({
            data: {
              name: sub.operator,
              type: "partner",
              contact: sub.contact,
              verified: true,
            },
          });
        }
      }
      await prisma.auditLog.create({
        data: {
          actor: "admin@livecam",
          action: `SUBMISSION_${status}`,
          targetType: "submission",
          targetId: sub.title,
        },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to update submission" };
    }
  }
  const sub = memStore.submissions.find((s) => s.id === id);
  if (!sub) return { ok: false, error: "Submission not found" };
  sub.status = status;
  return { ok: true };
}

export async function upsertSeoRedirectAdmin(input: {
  fromPath: string;
  toPath: string;
  statusCode?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const fromPath = input.fromPath.trim().startsWith("/")
    ? input.fromPath.trim()
    : `/${input.fromPath.trim()}`;
  const toPath = input.toPath.trim();
  const statusCode = input.statusCode === 302 ? 302 : 301;
  if (!fromPath || fromPath === "/" || !toPath) {
    return { ok: false, error: "Valid fromPath and toPath are required" };
  }

  if (isDbConfigured()) {
    try {
      await prisma.seoRedirect.upsert({
        where: { fromPath },
        update: { toPath, statusCode },
        create: { fromPath, toPath, statusCode },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to save redirect" };
    }
  }

  const existing = memStore.seoRedirects.find((r) => r.fromPath === fromPath);
  if (existing) {
    existing.toPath = toPath;
    existing.statusCode = statusCode;
  } else {
    memStore.seoRedirects.unshift({
      id: `redir-${Date.now()}`,
      fromPath,
      toPath,
      statusCode,
      createdAt: new Date().toISOString(),
    });
  }
  return { ok: true };
}

export async function deleteSeoRedirectAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDbConfigured()) {
    try {
      await prisma.seoRedirect.delete({ where: { id } });
      return { ok: true };
    } catch {
      return { ok: false, error: "Redirect not found" };
    }
  }
  const idx = memStore.seoRedirects.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: "Redirect not found" };
  memStore.seoRedirects.splice(idx, 1);
  return { ok: true };
}

export async function backfillMissingLicensesAdmin(): Promise<{ created: number }> {
  if (isDbConfigured()) {
    try {
      const webcams = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          licenses: { none: { status: "ACTIVE" } },
        },
        include: {
          streams: { where: { isPrimary: true }, take: 1 },
        },
      });
      if (webcams.length > 0) {
        await prisma.license.createMany({
          data: webcams.map((w) => ({
            webcamId: w.id,
            permissionType:
              w.streams[0]?.sourceType === "youtube"
                ? "YouTube Official Embed"
                : "Official Public Feed",
            evidence: w.streams[0]?.sourceUrl || "https://www.youtube.com/t/terms",
            status: "ACTIVE",
          })),
        });
        await prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: "BACKFILL_LICENSES",
            targetType: "license",
            targetId: `${webcams.length} webcams`,
          },
        });
      }
      return { created: webcams.length };
    } catch {
      return { created: 0 };
    }
  }

  const licensedIds = new Set(memStore.licenses.map((l) => l.webcamId));
  let created = 0;
  for (const w of memStore.webcams) {
    if (!licensedIds.has(w.id)) {
      memStore.licenses.unshift({
        id: `lic-bf-${Date.now()}-${created}`,
        webcamId: w.id,
        webcamTitle: w.title,
        webcamSlug: w.slug,
        permissionType:
          w.stream?.sourceType === "youtube" ? "YouTube Official Embed" : "Official Public Feed",
        evidence: w.stream?.sourceUrl || "https://www.youtube.com/t/terms",
        verifiedAt: new Date().toISOString(),
        expiresAt: null,
        status: "ACTIVE",
      });
      created += 1;
    }
  }
  return { created };
}

export async function deduplicateWebcamsAdmin(): Promise<{
  removedWebcams: number;
  removedCandidates: number;
}> {
  if (isDbConfigured()) {
    try {
      const [webcams, candidates] = await Promise.all([
        prisma.webcam.findMany({
          include: { streams: { where: { isPrimary: true }, take: 1 } },
          orderBy: [{ viewCount: "desc" }, { createdAt: "asc" }],
        }),
        prisma.candidate.findMany({
          where: { reviewStatus: "PENDING" },
          orderBy: [{ stabilityScore: "desc" }, { createdAt: "asc" }],
        }),
      ]);

      const seenCamKeys = new Set<string>();
      const dupWebcamIds: string[] = [];
      for (const w of webcams) {
        const s = w.streams[0];
        const keys = [
          s ? `${s.sourceType}:${s.externalId}` : "",
          s?.embedUrl || "",
          s?.sourceUrl || "",
          `${w.title.trim().toLowerCase()}::${w.cityId}`,
        ].filter(Boolean);

        if (keys.some((k) => seenCamKeys.has(k))) {
          dupWebcamIds.push(w.id);
        } else {
          for (const k of keys) seenCamKeys.add(k);
        }
      }

      if (dupWebcamIds.length > 0) {
        await prisma.webcam.deleteMany({ where: { id: { in: dupWebcamIds } } });
      }

      const seenCandKeys = new Set<string>();
      const dupCandIds: string[] = [];
      for (const c of candidates) {
        const keys = [`${c.sourceType}:${c.externalId}`, c.embedUrl, c.sourceUrl].filter(Boolean);
        if (keys.some((k) => seenCamKeys.has(k) || seenCandKeys.has(k))) {
          dupCandIds.push(c.id);
        } else {
          for (const k of keys) seenCandKeys.add(k);
        }
      }

      if (dupCandIds.length > 0) {
        await prisma.candidate.deleteMany({ where: { id: { in: dupCandIds } } });
      }

      if (dupWebcamIds.length > 0 || dupCandIds.length > 0) {
        await prisma.auditLog.create({
          data: {
            actor: "admin@livecam",
            action: "DEDUPLICATE_WEBCAMS",
            targetType: "webcam",
            targetId: `${dupWebcamIds.length} webcams, ${dupCandIds.length} candidates removed`,
          },
        });
      }

      return { removedWebcams: dupWebcamIds.length, removedCandidates: dupCandIds.length };
    } catch {
      return { removedWebcams: 0, removedCandidates: 0 };
    }
  }

  const seenCam = new Set<string>();
  const keptWebcams: typeof memStore.webcams = [];
  let removedWebcams = 0;
  for (const w of memStore.webcams) {
    const keys = [
      w.stream ? `${w.stream.sourceType}:${w.stream.externalId}` : "",
      w.stream?.embedUrl || "",
      w.stream?.sourceUrl || "",
      `${w.title.trim().toLowerCase()}::${w.city.slug}`,
    ].filter(Boolean);
    if (keys.some((k) => seenCam.has(k))) {
      removedWebcams += 1;
    } else {
      for (const k of keys) seenCam.add(k);
      keptWebcams.push(w);
    }
  }
  memStore.webcams = keptWebcams;

  const seenCand = new Set<string>();
  const keptCands: typeof memStore.candidates = [];
  let removedCandidates = 0;
  for (const c of memStore.candidates) {
    const keys = [`${c.sourceType}:${c.externalId}`, c.embedUrl, c.sourceUrl].filter(Boolean);
    if (keys.some((k) => seenCam.has(k) || seenCand.has(k))) {
      removedCandidates += 1;
    } else {
      for (const k of keys) seenCand.add(k);
      keptCands.push(c);
    }
  }
  memStore.candidates = keptCands;
  return { removedWebcams, removedCandidates };
}
