import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  approveCandidate,
  approveCandidatesBatch,
  getAdminDashboardData,
  rejectCandidate,
  rejectCandidatesBatch,
  reprobeCandidates,
  resolveContactMessage,
  runHealthCheckBatch,
  syncAllSourceCandidates,
  toggleWebcamSuspend,
  updateWebcamDetails,
} from "@/lib/repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getAdminDashboardData());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    switch (body?.action) {
      case "approve": {
        const cam = await approveCandidate(String(body.id));
        if (!cam) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "reject": {
        const ok = await rejectCandidate(String(body.id));
        if (!ok) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "approveBatch": {
        const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
        if (ids.length === 0) {
          return NextResponse.json({ error: "No candidates selected" }, { status: 400 });
        }
        await approveCandidatesBatch(ids);
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "rejectBatch": {
        const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
        if (ids.length === 0) {
          return NextResponse.json({ error: "No candidates selected" }, { status: 400 });
        }
        await rejectCandidatesBatch(ids);
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "suspend": {
        const cam = await toggleWebcamSuspend(String(body.slug));
        if (!cam) return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "healthCheck": {
        await runHealthCheckBatch();
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "syncSources": {
        await syncAllSourceCandidates();
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "reprobe": {
        await reprobeCandidates();
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "resolveContact": {
        const ok = await resolveContactMessage(String(body.id));
        if (!ok) return NextResponse.json({ error: "Message not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "updateWebcam": {
        if (!body?.slug || !body?.title || !body?.description) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const updated = await updateWebcamDetails({
          slug: String(body.slug),
          title: String(body.title),
          description: String(body.description),
          bestTime: body.bestTime !== undefined ? String(body.bestTime) : null,
          sourceType: body.sourceType ? String(body.sourceType) : undefined,
          embedUrl: body.embedUrl ? String(body.embedUrl) : undefined,
          sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
          categorySlugs: Array.isArray(body.categorySlugs)
            ? body.categorySlugs.map(String)
            : undefined,
          lat: body.lat !== undefined ? Number(body.lat) : undefined,
          lng: body.lng !== undefined ? Number(body.lng) : undefined,
        });
        if (!updated) return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
