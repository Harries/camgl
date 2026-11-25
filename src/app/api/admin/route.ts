import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  approveCandidate,
  getAdminDashboardData,
  rejectCandidate,
  reprobeCandidates,
  runHealthCheckBatch,
  syncAllSourceCandidates,
  toggleWebcamSuspend,
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
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
