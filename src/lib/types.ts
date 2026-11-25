export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type StreamStatus = "LIVE" | "OFFLINE" | "SCHEDULED" | "RESTRICTED" | "UNKNOWN";

export interface PublicWebcam {
  id: string;
  slug: string;
  title: string;
  description: string;
  bestTime: string | null;
  country: {
    name: string;
    slug: string;
    isoCode: string;
    flag: string;
  };
  city: {
    name: string;
    slug: string;
    timezone: string;
    lat: number;
    lng: number;
  };
  categories: Array<{
    name: string;
    slug: string;
  }>;
  provider: {
    name: string;
    type: string;
    website: string | null;
  } | null;
  stream: {
    sourceType: string;
    externalId: string;
    embedUrl: string;
    sourceUrl: string;
    mediaType: string;
    status: StreamStatus;
    lastCheckedAt: string;
  } | null;
  weatherSummary: string;
  mapX: number;
  mapY: number;
}

export interface AdminCandidate {
  id: string;
  source: string;
  sourceType: string;
  mediaType: string;
  externalId: string;
  title: string;
  countryName: string;
  cityName: string;
  lat: number;
  lng: number;
  categorySlug: string;
  embedUrl: string;
  sourceUrl: string;
  description?: string | null;
  licenseNote: string;
  privacyNote: string;
  stabilityScore: number;
  lastProbedAt: string | null;
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface AdminDiscoveryJob {
  id: string;
  source: string;
  query: string;
  status: string;
  quotaCost: number;
  lastRunAt: string;
  foundCount: number;
}

export interface AdminReport {
  id: string;
  webcamId: string;
  webcamTitle: string;
  type: string;
  description: string | null;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string | null;
  createdAt: string;
}
