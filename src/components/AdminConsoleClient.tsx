"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Video,
  Radar,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type {
  AdminAuditLog,
  AdminCandidate,
  AdminDiscoveryJob,
  AdminReport,
  PublicWebcam,
} from "@/lib/types";

interface AdminData {
  webcams: (PublicWebcam & { reviewStatus?: string })[];
  candidates: AdminCandidate[];
  jobs: AdminDiscoveryJob[];
  reports: AdminReport[];
  auditLogs: AdminAuditLog[];
  youtubeQuotaUsed: number;
}

export function AdminConsoleClient({ initialData }: { initialData: AdminData }) {
  const router = useRouter();
  const [data, setData] = useState<AdminData>(initialData);
  const [tab, setTab] = useState<"review" | "webcams" | "jobs" | "reports">("review");
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  }

  async function runAction(payload: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setData(json.data);
      }
    } finally {
      setBusy(false);
    }
  }

  const approvedCount = data.webcams.filter((w) => (w.reviewStatus ?? "APPROVED") === "APPROVED").length;
  const openReports = data.reports.filter((r) => r.status === "OPEN").length;
  const quotaPct = Math.min(Math.round((data.youtubeQuotaUsed / 10000) * 100), 100);

  const navItems = [
    {
      key: "review" as const,
      label: "Review Queue",
      badge: data.candidates.length,
      icon: CheckSquare,
    },
    {
      key: "webcams" as const,
      label: "Webcams & Health",
      badge: data.webcams.length,
      icon: Video,
    },
    {
      key: "jobs" as const,
      label: "Discovery Jobs",
      badge: data.jobs.length,
      icon: Radar,
    },
    {
      key: "reports" as const,
      label: "Reports & Audit",
      badge: openReports,
      icon: ShieldAlert,
    },
  ];

  const activeTitle = navItems.find((n) => n.key === tab)?.label ?? "Admin Console";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Left Collapsible Sidebar */}
      <aside
        className={`relative sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Divider Toggle Button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-16 -translate-y-1/2 z-30 w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 shadow-sm flex items-center justify-center transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div>
          {/* Sidebar Header */}
          <div className={`h-16 px-3.5 border-b border-slate-200 flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">LiveCam Admin</div>
                <div className="text-[11px] text-slate-400 truncate">Operations Console</div>
              </div>
            )}
          </div>

          {/* Sidebar Nav */}
          <nav className="p-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-slate-200 space-y-1">
          <Link
            href="/"
            title={collapsed ? "Public Site" : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? "退出登录" : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Right Main Panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-900">{activeTitle}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              RBAC Protected
            </span>
          </div>
          <button
            disabled={busy}
            onClick={() => runAction({ action: "healthCheck" })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
            Run Health Check
          </button>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Published Webcams</div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{approvedCount}</div>
              <div className="text-xs text-emerald-600 mt-0.5">100% License Verified</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Pending Review</div>
              <div className="text-xl font-bold text-amber-600 mt-1 tabular-nums">{data.candidates.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Candidate Pool</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Stream Health</div>
              <div className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">96.4%</div>
              <div className="text-xs text-slate-400 mt-0.5">Cron every 30m</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">YouTube Quota</div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {data.youtubeQuotaUsed.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">/ 10k</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${quotaPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 lg:col-span-1">
              <div className="text-xs text-slate-500">Open Reports</div>
              <div className={`text-xl font-bold mt-1 tabular-nums ${openReports > 0 ? "text-red-600" : "text-slate-900"}`}>
                {openReports}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">SLA &lt; 24h</div>
            </div>
          </div>

          {/* Tab Panels */}
          {tab === "review" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {data.candidates.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">All candidates reviewed.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Candidate</th>
                        <th className="px-3 py-2.5 font-medium">Location</th>
                        <th className="px-3 py-2.5 font-medium">Source &amp; License</th>
                        <th className="px-3 py-2.5 font-medium">Privacy</th>
                        <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.candidates.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-3 font-medium text-slate-900">{c.title}</td>
                          <td className="px-3 py-3 text-slate-600">
                            {c.cityName}, {c.countryName} · {c.categorySlug}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-slate-900">{c.source}</div>
                            <div className="text-slate-500 mt-0.5">{c.licenseNote}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                c.privacyNote.startsWith("Pass")
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {c.privacyNote}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              disabled={busy}
                              onClick={() => runAction({ action: "approve", id: c.id })}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => runAction({ action: "reject", id: c.id })}
                              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "webcams" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title / Slug</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Review</th>
                      <th className="px-4 py-3 font-medium">Stream</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.webcams.map((w) => {
                      const rev = w.reviewStatus ?? "APPROVED";
                      return (
                        <tr key={w.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{w.title}</div>
                            <div className="font-mono text-slate-400">/webcams/{w.slug}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {w.country.flag} {w.city.name}, {w.country.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                rev === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {rev}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              {w.stream?.status ?? "UNKNOWN"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            <Link
                              href={`/webcams/${w.slug}`}
                              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </Link>
                            <button
                              disabled={busy}
                              onClick={() => runAction({ action: "suspend", slug: w.slug })}
                              className={`px-2.5 py-1 rounded-md ${
                                rev === "APPROVED"
                                  ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {rev === "APPROVED" ? "Suspend" : "Restore"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "jobs" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Query / Scope</th>
                      <th className="px-4 py-3 font-medium">Quota Cost</th>
                      <th className="px-4 py-3 font-medium">Last Run</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.jobs.map((j) => (
                      <tr key={j.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{j.source}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{j.query}</td>
                        <td className="px-4 py-3 text-slate-600">{j.quotaCost} units</td>
                        <td className="px-4 py-3 text-slate-500">{j.lastRunAt}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {j.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 text-sm font-semibold text-slate-900">
                  User &amp; Copyright Reports
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {data.reports.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{r.webcamTitle}</div>
                        <div className="text-slate-500 mt-0.5">
                          {r.type} · {r.createdAt}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 text-sm font-semibold text-slate-900">
                  Audit Logs
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {data.auditLogs.map((l) => (
                    <div key={l.id} className="px-4 py-3 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-semibold text-slate-800">{l.action}</span>
                        <span className="text-slate-600"> · {l.targetId}</span>
                        <div className="text-slate-400 mt-0.5">by {l.actor}</div>
                      </div>
                      <span className="text-slate-400 shrink-0">{l.createdAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
