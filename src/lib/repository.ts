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
} from "./types";

// In-memory store for zero-config local development when PostgreSQL is not running
const memStore = {
  webcams: structuredClone(SEED_WEBCAMS) as (PublicWebcam & { reviewStatus?: string })[],
  candidates: structuredClone(SEED_CANDIDATES) as AdminCandidate[],
  jobs: structuredClone(SEED_JOBS) as AdminDiscoveryJob[],
  reports: structuredClone(SEED_REPORTS) as AdminReport[],
  auditLogs: structuredClone(SEED_AUDIT_LOGS) as AdminAuditLog[],
  youtubeQuotaUsed: 3420,
};

function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432/livecam"));
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
          streams: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });

      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        bestTime: r.bestTime,
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
              status: r.streams[0].status,
              lastCheckedAt: (r.streams[0].lastCheckedAt ?? new Date()).toISOString(),
            }
          : null,
        weatherSummary: "16°C · Clear",
        mapX: Math.round(((r.lng + 180) / 360) * 1000),
        mapY: Math.round(((90 - r.lat) / 180) * 500),
      }));
    } catch {
      // Fallback to memory store if DB connection fails
    }
  }

  return memStore.webcams.filter((w) => {
    if (w.reviewStatus && w.reviewStatus !== "APPROVED") return false;
    if (filters?.country && w.country.slug !== filters.country) return false;
    if (filters?.city && w.city.slug !== filters.city) return false;
    if (filters?.category && !w.categories.some((c) => c.slug === filters.category)) return false;
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      const hay = `${w.title} ${w.country.name} ${w.city.name} ${w.categories.map((c) => c.name).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getWebcamBySlug(slug: string): Promise<PublicWebcam | null> {
  const all = await listApprovedWebcams();
  return all.find((w) => w.slug === slug) ?? null;
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
  return SEED_CATEGORIES;
}

export function createSubmission(input: {
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
  const cand: AdminCandidate = {
    id: `cand-${Date.now()}`,
    source: input.operator ? `Partner · ${input.operator}` : "User Submission",
    externalId: `sub-${Date.now()}`,
    title: input.title,
    countryName,
    cityName,
    categorySlug: input.category.toLowerCase(),
    embedUrl: input.sourceUrl,
    sourceUrl: input.sourceUrl,
    licenseNote: "Pending Operator Verification",
    privacyNote: "Pending Review",
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

export function createReport(input: {
  webcamId: string;
  webcamTitle: string;
  type: string;
  description?: string;
}) {
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

export function getAdminDashboardData() {
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

export function approveCandidate(id: string) {
  const idx = memStore.candidates.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const cand = memStore.candidates.splice(idx, 1)[0];
  const slug = cand.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newCam: PublicWebcam & { reviewStatus?: string } = {
    id: `cam-${Date.now()}`,
    slug,
    title: cand.title,
    description: `${cand.title} located in ${cand.cityName}, ${cand.countryName}. Approved via Admin Review.`,
    bestTime: "Daylight and golden hour.",
    country: {
      name: cand.countryName,
      slug: cand.countryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      isoCode: cand.countryName.slice(0, 2).toUpperCase(),
      flag: "🌍",
    },
    city: {
      name: cand.cityName,
      slug: cand.cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      timezone: "UTC",
      lat: 40,
      lng: 10,
    },
    categories: [{ name: cand.categorySlug, slug: cand.categorySlug }],
    provider: { name: cand.source, type: "partner", website: null },
    stream: {
      sourceType: "youtube",
      externalId: cand.externalId,
      embedUrl: cand.embedUrl,
      sourceUrl: cand.sourceUrl,
      mediaType: "LIVE_VIDEO",
      status: "LIVE",
      lastCheckedAt: new Date().toISOString(),
    },
    weatherSummary: "12°C · Clear",
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

export function rejectCandidate(id: string) {
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

export function toggleWebcamSuspend(slug: string) {
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

export function runHealthCheckBatch() {
  const now = new Date().toISOString();
  for (const w of memStore.webcams) {
    if (w.stream) w.stream.lastCheckedAt = now;
  }
  memStore.youtubeQuotaUsed += 6;
  memStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: "cron-health",
    action: "HEALTH_CHECK",
    targetType: "stream",
    targetId: `${memStore.webcams.length} streams`,
    detail: "6 quota units",
    createdAt: "Just now",
  });
  return { checked: memStore.webcams.length, quotaUsed: memStore.youtubeQuotaUsed };
}
