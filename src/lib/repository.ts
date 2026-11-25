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
  AdminDiscoveryJob,
  AdminReport,
  PublicWebcam,
  StreamStatus,
} from "./types";
import { coordKey, fetchWeatherBatch } from "./weather";
import { collectAndProbeAllSources, probeSourceStability } from "./collectors";

// In-memory store fallback when PostgreSQL is unreachable (e.g., offline build)
const memStore = {
  webcams: structuredClone(SEED_WEBCAMS) as (PublicWebcam & { reviewStatus?: string })[],
  candidates: structuredClone(SEED_CANDIDATES) as AdminCandidate[],
  jobs: structuredClone(SEED_JOBS) as AdminDiscoveryJob[],
  reports: structuredClone(SEED_REPORTS) as AdminReport[],
  auditLogs: structuredClone(SEED_AUDIT_LOGS) as AdminAuditLog[],
  youtubeQuotaUsed: 0,
};

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
    embedUrl: string;
    sourceUrl: string;
    mediaType: string;
    status: string;
    lastCheckedAt: Date | null;
  }[];
}): PublicWebcam & { reviewStatus: string } {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    bestTime: r.bestTime,
    reviewStatus: r.reviewStatus,
    country: {
      name: r.city.country.name,
      slug: r.city.country.slug,
      isoCode: r.city.country.isoCode,
      flag: r.city.country.flag,
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
          embedUrl: r.streams[0].embedUrl,
          sourceUrl: r.streams[0].sourceUrl,
          mediaType: r.streams[0].mediaType,
          status: r.streams[0].status as StreamStatus,
          lastCheckedAt: (r.streams[0].lastCheckedAt ?? new Date()).toISOString(),
        }
      : null,
    weatherSummary: "—",
    mapX: Math.round(((r.lng + 180) / 360) * 1000),
    mapY: Math.round(((90 - r.lat) / 180) * 500),
  };
}

export async function listApprovedWebcams(filters?: {
  country?: string;
  city?: string;
  category?: string;
  q?: string;
}): Promise<PublicWebcam[]> {
  if (isDbConfigured()) {
    try {
      const rows = await prisma.webcam.findMany({
        where: {
          reviewStatus: "APPROVED",
          streams: {
            some: {
              isPrimary: true,
              status: "LIVE",
            },
          },
          ...(filters?.country ? { city: { country: { slug: filters.country } } } : {}),
          ...(filters?.city ? { city: { slug: filters.city } } : {}),
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

  if (isDbConfigured()) {
    try {
      const where = {
        reviewStatus: "APPROVED" as const,
        streams: {
          some: {
            isPrimary: true,
            status: "LIVE" as const,
          },
        },
        ...(filters?.country ? { city: { country: { slug: filters.country } } } : {}),
        ...(filters?.city ? { city: { slug: filters.city } } : {}),
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
            },
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
      w.stream?.status === "LIVE"
  );
  if (!found) return null;
  const [enriched] = await enrichWeather([found]);
  return enriched ?? null;
}

export async function getRandomWebcam(excludeSlug?: string): Promise<PublicWebcam | null> {
  const all = await listApprovedWebcams();
  const pool = all.filter((w) => w.slug !== excludeSlug && w.stream?.status === "LIVE");
  const target = pool.length > 0 ? pool : all;
  if (target.length === 0) return null;
  return target[Math.floor(Math.random() * target.length)];
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

  if (isDbConfigured()) {
    try {
      const [sub] = await prisma.$transaction([
        prisma.submission.create({
          data: {
            title: input.title,
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

export async function getAdminDashboardData() {
  if (isDbConfigured()) {
    try {
      const [webcams, candidates, jobs, reports, auditLogs] = await Promise.all([
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
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      ]);

      const quotaUsed = jobs.reduce((acc, j) => acc + j.quotaCost, 0);

      return {
        webcams: webcams.map(mapDbWebcam),
        candidates: candidates.map((c) => ({
          id: c.id,
          source: c.source,
          sourceType: c.sourceType,
          mediaType: c.mediaType,
          externalId: c.externalId,
          title: c.title,
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
        auditLogs: auditLogs.map((l) => ({
          id: l.id,
          actor: l.actor,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          detail: l.detail,
          createdAt: l.createdAt.toISOString(),
        })),
        youtubeQuotaUsed: quotaUsed,
      };
    } catch {
      // Fallback
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
    auditLogs: memStore.auditLogs,
    youtubeQuotaUsed: memStore.youtubeQuotaUsed,
  };
}

export async function approveCandidate(id: string) {
  if (isDbConfigured()) {
    try {
      const cand = await prisma.candidate.findUnique({ where: { id } });
      if (!cand) return null;

      // If this stream is already in the database, mark candidate approved and ensure webcam is live
      const existingStream = await prisma.stream.findUnique({
        where: {
          sourceType_externalId: {
            sourceType: cand.sourceType,
            externalId: cand.externalId,
          },
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

      const country = await prisma.country.upsert({
        where: { slug: countrySlug },
        update: {},
        create: {
          isoCode: cand.countryName.slice(0, 2).toUpperCase(),
          name: cand.countryName,
          slug: countrySlug,
          flag: "🌍",
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
          description: `${cand.title} located in ${cand.cityName}, ${cand.countryName}.`,
          bestTime: "Daylight and golden hour.",
          lat: cand.lat || city.lat,
          lng: cand.lng || city.lng,
          reviewStatus: "APPROVED",
          streams: {
            create: {
              sourceType: cand.sourceType,
              externalId: cand.externalId,
              embedUrl: cand.embedUrl,
              sourceUrl: cand.sourceUrl,
              mediaType: cand.mediaType,
              status: "LIVE",
              lastCheckedAt: new Date(),
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
  const slug = slugify(cand.title);
  const newCam: PublicWebcam & { reviewStatus?: string } = {
    id: `cam-${Date.now()}`,
    slug,
    title: cand.title,
    description: `${cand.title} located in ${cand.cityName}, ${cand.countryName}. Approved via Admin Review.`,
    bestTime: "Daylight and golden hour.",
    country: {
      name: cand.countryName,
      slug: slugify(cand.countryName),
      isoCode: cand.countryName.slice(0, 2).toUpperCase(),
      flag: "🌍",
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
      const existingStreams = await prisma.stream.findMany({
        select: { sourceType: true, externalId: true },
      });
      const existingKeys = new Set(
        existingStreams.map((s) => `${s.sourceType}:${s.externalId}`)
      );
      const newItems = items.filter(
        (item) => !existingKeys.has(`${item.sourceType}:${item.externalId}`)
      );

      await prisma.candidate.createMany({
        data: newItems.map((item) => ({
          source: item.source,
          sourceType: item.sourceType,
          mediaType: item.mediaType as "LIVE_VIDEO" | "SNAPSHOT",
          externalId: item.externalId,
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
    const existing = memStore.candidates.find(
      (c) => c.source === item.source && c.externalId === item.externalId
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
  if (isDbConfigured()) {
    try {
      const streams = await prisma.stream.findMany({ where: { isPrimary: true } });
      const results = await Promise.all(
        streams.map(async (s) => {
          const probe = await probeSourceStability(s.sourceType, s.embedUrl, s.sourceUrl);
          return {
            id: s.id,
            status: (probe.online ? "LIVE" : "OFFLINE") as "LIVE" | "OFFLINE",
          };
        })
      );

      const now = new Date();
      await Promise.all(
        results.map((r) =>
          prisma.stream.update({
            where: { id: r.id },
            data: { status: r.status, lastCheckedAt: now },
          })
        )
      );

      const liveCount = results.filter((r) => r.status === "LIVE").length;
      await prisma.auditLog.create({
        data: {
          actor: "cron-health",
          action: "HEALTH_CHECK",
          targetType: "stream",
          targetId: `${results.length} streams`,
          detail: `${liveCount}/${results.length} online`,
        },
      });

      return { checked: results.length, liveCount };
    } catch {
      // Fallback
    }
  }

  const now = new Date().toISOString();
  let liveCount = 0;
  for (const w of memStore.webcams) {
    if (w.stream) {
      const probe = await probeSourceStability(
        w.stream.sourceType,
        w.stream.embedUrl,
        w.stream.sourceUrl
      );
      const status = probe.online ? "LIVE" : "OFFLINE";
      w.stream.status = status;
      w.stream.lastCheckedAt = now;
      if (status === "LIVE") liveCount += 1;
    }
  }
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "cron-health",
    action: "HEALTH_CHECK",
    targetType: "stream",
    targetId: `${memStore.webcams.length} streams`,
    detail: `${liveCount}/${memStore.webcams.length} online`,
    createdAt: "Just now",
  });
  return { checked: memStore.webcams.length, liveCount };
}
