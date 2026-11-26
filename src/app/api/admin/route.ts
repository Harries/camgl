import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSessionUserId } from "@/lib/user-auth";
import {
  approveCandidate,
  approveCandidatesBatch,
  deleteCategoryAdmin,
  deleteCityAdmin,
  deleteCountryAdmin,
  deleteLicenseAdmin,
  deleteSeoRedirectAdmin,
  deleteTranslationAdmin,
  getAdminDashboardData,
  rejectCandidate,
  rejectCandidatesBatch,
  reprobeCandidates,
  resolveContactMessage,
  reviewSubmissionAdmin,
  runHealthCheckBatch,
  setUserRoleAdmin,
  syncAllSourceCandidates,
  toggleProviderVerifiedAdmin,
  toggleWebcamFeatured,
  toggleWebcamSuspend,
  updateWebcamDetails,
  upsertCategoryAdmin,
  upsertCityAdmin,
  upsertCountryAdmin,
  upsertLicenseAdmin,
  upsertProviderAdmin,
  upsertSeoRedirectAdmin,
  upsertTranslationAdmin,
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
      case "toggleFeatured": {
        const cam = await toggleWebcamFeatured(String(body.slug));
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
      case "saveCategory": {
        const res = await upsertCategoryAdmin({
          id: body.id ? String(body.id) : undefined,
          name: String(body.name ?? ""),
          slug: body.slug ? String(body.slug) : undefined,
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteCategory": {
        const res = await deleteCategoryAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveCountry": {
        const res = await upsertCountryAdmin({
          id: body.id ? String(body.id) : undefined,
          name: String(body.name ?? ""),
          slug: body.slug ? String(body.slug) : undefined,
          isoCode: String(body.isoCode ?? ""),
          flag: body.flag ? String(body.flag) : undefined,
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteCountry": {
        const res = await deleteCountryAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveCity": {
        const res = await upsertCityAdmin({
          id: body.id ? String(body.id) : undefined,
          countryId: String(body.countryId ?? ""),
          name: String(body.name ?? ""),
          slug: body.slug ? String(body.slug) : undefined,
          lat: Number(body.lat ?? 0),
          lng: Number(body.lng ?? 0),
          timezone: String(body.timezone ?? "UTC"),
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteCity": {
        const res = await deleteCityAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
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
      case "setUserRole": {
        const targetId = String(body.id ?? "");
        const role = body.role === "ADMIN" ? "ADMIN" : body.role === "USER" ? "USER" : null;
        if (!targetId || !role) {
          return NextResponse.json({ error: "Invalid user or role" }, { status: 400 });
        }
        const currentUserId = await getSessionUserId();
        if (currentUserId && currentUserId === targetId && role !== "ADMIN") {
          return NextResponse.json(
            { error: "Cannot remove your own admin role" },
            { status: 400 }
          );
        }
        const res = await setUserRoleAdmin(targetId, role);
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 404 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveLicense": {
        const res = await upsertLicenseAdmin({
          id: body.id ? String(body.id) : undefined,
          webcamId: String(body.webcamId ?? ""),
          permissionType: String(body.permissionType ?? ""),
          evidence: String(body.evidence ?? ""),
          expiresAt: body.expiresAt ? String(body.expiresAt) : null,
          status: body.status ? String(body.status) : "ACTIVE",
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteLicense": {
        const res = await deleteLicenseAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveTranslation": {
        const res = await upsertTranslationAdmin({
          entityType: (body.entityType || "webcam") as "webcam" | "city" | "country" | "category",
          entityId: String(body.entityId ?? ""),
          locale: String(body.locale ?? "zh"),
          title: String(body.title ?? ""),
          description: body.description ? String(body.description) : null,
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteTranslation": {
        const res = await deleteTranslationAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveProvider": {
        const res = await upsertProviderAdmin({
          id: body.id ? String(body.id) : undefined,
          name: String(body.name ?? ""),
          type: String(body.type ?? "hotel"),
          website: body.website ? String(body.website) : null,
          contact: body.contact ? String(body.contact) : null,
          verified: Boolean(body.verified),
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "toggleProviderVerified": {
        const res = await toggleProviderVerifiedAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "reviewSubmission": {
        const status = body.status === "APPROVED" ? "APPROVED" : "REJECTED";
        const res = await reviewSubmissionAdmin(String(body.id ?? ""), status);
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "saveSeoRedirect": {
        const res = await upsertSeoRedirectAdmin({
          fromPath: String(body.fromPath ?? ""),
          toPath: String(body.toPath ?? ""),
          statusCode: Number(body.statusCode ?? 301),
        });
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      case "deleteSeoRedirect": {
        const res = await deleteSeoRedirectAdmin(String(body.id ?? ""));
        if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
        return NextResponse.json({ ok: true, data: await getAdminDashboardData() });
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
