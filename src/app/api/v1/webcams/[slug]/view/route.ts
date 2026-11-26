import { NextResponse } from "next/server";
import { incrementWebcamViewCount } from "@/lib/repository";

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headless|lighthouse|ahrefs|semrush|curl|wget|python-requests|go-http-client|scrapy|axios/i;

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes per (ip, slug)
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes per ip
const RATE_LIMIT_MAX = 30;

interface ViewLimiterStore {
  dedup: Map<string, number>;
  burst: Map<string, { count: number; resetAt: number }>;
}

const globalForViewLimiter = globalThis as unknown as {
  __camglViewLimiter?: ViewLimiterStore;
};

const viewLimiter = (globalForViewLimiter.__camglViewLimiter ??= {
  dedup: new Map<string, number>(),
  burst: new Map<string, { count: number; resetAt: number }>(),
});

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "anon";
}

function pruneExpired(now: number) {
  if (viewLimiter.dedup.size > 5000) {
    for (const [k, exp] of viewLimiter.dedup.entries()) {
      if (exp <= now) viewLimiter.dedup.delete(k);
    }
  }
  if (viewLimiter.burst.size > 2000) {
    for (const [k, entry] of viewLimiter.burst.entries()) {
      if (entry.resetAt <= now) viewLimiter.burst.delete(k);
    }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ua = request.headers.get("user-agent")?.trim() ?? "";

  if (!ua || BOT_UA_PATTERN.test(ua)) {
    return NextResponse.json({ ok: true, counted: false, reason: "filtered_ua" });
  }

  const now = Date.now();
  pruneExpired(now);

  const ip = getClientIp(request);
  const dedupKey = `${ip}:${slug}`;
  const dedupExpires = viewLimiter.dedup.get(dedupKey);
  if (dedupExpires && dedupExpires > now) {
    return NextResponse.json({ ok: true, counted: false, reason: "deduplicated" });
  }

  const burstEntry = viewLimiter.burst.get(ip);
  if (burstEntry && burstEntry.resetAt > now) {
    if (burstEntry.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ ok: true, counted: false, reason: "rate_limited" });
    }
    burstEntry.count += 1;
  } else {
    viewLimiter.burst.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  viewLimiter.dedup.set(dedupKey, now + DEDUP_WINDOW_MS);

  const viewCount = await incrementWebcamViewCount(slug);
  if (viewCount === null) {
    return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, counted: true, viewCount });
}
