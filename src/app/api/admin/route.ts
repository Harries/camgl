import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  approveCandidate,
  getAdminDashboardData,
  rejectCandidate,
  runHealthCheckBatch,
  toggleWebcamSuspend,
} from "@/lib/repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAdminDashboardData());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    switch (body?.action) {
      case "approve": {
        const cam = approveCandidate(String(body.id));
        if (!cam) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: getAdminDashboardData() });
      }
      case "reject": {
        const ok = rejectCandidate(String(body.id));
        if (!ok) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: getAdminDashboardData() });
      }
      case "suspend": {
        const cam = toggleWebcamSuspend(String(body.slug));
        if (!cam) return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: getAdminDashboardData() });
      }
      case "healthCheck": {
        runHealthCheckBatch();
        return NextResponse.json({ ok: true, data: getAdminDashboardData() });
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
