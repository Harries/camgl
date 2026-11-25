"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
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
import { ThemeToggle } from "./ThemeToggle";
import type {
  AdminAuditLog,
  AdminCandidate,
  AdminDiscoveryJob,
  AdminReport,
  PublicWebcam,
} from "@/lib/types";
import { getSourceTypeMeta } from "@/lib/source-badge";

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
  const [tab, setTab] = useState<"dashboard" | "review" | "webcams" | "jobs" | "reports">("dashboard");
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
  const liveCount = data.webcams.filter((w) => w.stream?.status === "LIVE").length;
  const healthPct = data.webcams.length > 0 ? ((liveCount / data.webcams.length) * 100).toFixed(1) : "0.0";
  const openReports = data.reports.filter((r) => r.status === "OPEN").length;
  const quotaPct = Math.min(Math.round((data.youtubeQuotaUsed / 10000) * 100), 100);

  const navItems = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      badge: null,
      icon: LayoutDashboard,
    },
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Left Collapsible Sidebar */}
      <aside
        className={`relative sticky top-0 h-screen bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between transition-all duration-200 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Vertical Divider Middle Toggle Button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-600 shadow-sm flex items-center justify-center transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div>
          {/* Sidebar Header */}
          <div className={`h-16 px-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">LiveCam Admin</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">Operations Console</div>
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
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link
            href="/"
            title={collapsed ? "Public Site" : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? "退出登录" : undefined}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Right Main Panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{activeTitle}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900">
              RBAC Protected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              disabled={busy}
              onClick={() => runAction({ action: "healthCheck" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              Run Health Check
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Dedicated Dashboard Tab */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Published Webcams</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{approvedCount}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">100% License Verified</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Pending Review</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{data.candidates.length}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Candidate Pool</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Stream Health</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{healthPct}%</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{liveCount}/{data.webcams.length} live</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">YouTube Quota</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                    {data.youtubeQuotaUsed.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ 10k</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${quotaPct}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm col-span-2 lg:col-span-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Open Reports</div>
                  <div className={`text-xl font-bold mt-1 tabular-nums ${openReports > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                    {openReports}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">SLA &lt; 24h</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Operations</h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Shortcuts</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={() => setTab("review")}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 text-left transition-colors"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">Review Pending Candidates</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-1">{data.candidates.length} awaiting license &amp; privacy check</div>
                    </button>
                    <button
                      onClick={() => setTab("webcams")}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 text-left transition-colors"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">Monitor Stream Health</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-1">{data.webcams.length} total webcams registered</div>
                    </button>
                    <button
                      onClick={() => setTab("jobs")}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 text-left transition-colors"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">Discovery &amp; Quota Jobs</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-1">{data.jobs.length} scheduled collector tasks</div>
                    </button>
                    <button
                      onClick={() => setTab("reports")}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 text-left transition-colors"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">Handle Reports &amp; Takedowns</div>
                      <div className="text-slate-500 dark:text-slate-400 mt-1">{openReports} open reports requiring review</div>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                    <button
                      onClick={() => setTab("reports")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {data.auditLogs.slice(0, 5).map((l) => (
                      <div key={l.id} className="px-4 py-3 flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{l.action}</span>
                          <span className="text-slate-600 dark:text-slate-400"> · {l.targetId}</span>
                          <div className="text-slate-400 dark:text-slate-500 mt-0.5">by {l.actor}</div>
                        </div>
                        <span className="text-slate-400 dark:text-slate-500 shrink-0">{l.createdAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Panels */}
          {tab === "review" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Multi-Source Discovery &amp; Stability Ranking
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sorted by live stability score (Windy API v3, YouTube Data API, USGS, NPS, Roundshot, SkylineWebcams).
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={busy}
                    onClick={() => runAction({ action: "reprobe" })}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Re-probe Stability
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => runAction({ action: "syncSources" })}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Sync All Sources
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                {data.candidates.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                    All candidates reviewed. Click &quot;Sync All Sources&quot; to fetch new feeds.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/70 dark:border-slate-800 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">Candidate</th>
                          <th className="px-3 py-2.5 font-medium">Type</th>
                          <th className="px-3 py-2.5 font-medium">Stability</th>
                          <th className="px-3 py-2.5 font-medium">Location</th>
                          <th className="px-3 py-2.5 font-medium">Source &amp; License</th>
                          <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.candidates.map((c) => {
                          const score = c.stabilityScore ?? 0;
                          const scoreClass =
                            score >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                              : score >= 50
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900"
                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900";
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-3">
                                <div className="font-medium text-slate-900 dark:text-white">{c.title}</div>
                                <a
                                  href={c.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Preview Source ↗
                                </a>
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {c.sourceType}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border tabular-nums ${scoreClass}`}>
                                  {score}/100
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                                {c.cityName}, {c.countryName} · {c.categorySlug}
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-slate-900 dark:text-slate-100">{c.source}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.licenseNote}</div>
                              </td>
                              <td className="px-3 py-3 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  disabled={busy}
                                  onClick={() => runAction({ action: "approve", id: c.id })}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                                >
                                  Approve &amp; Go Live
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => runAction({ action: "reject", id: c.id })}
                                  className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "webcams" && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/70 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title / Slug</th>
                      <th className="px-4 py-3 font-medium">Source Type</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Review</th>
                      <th className="px-4 py-3 font-medium">Stream</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.webcams.map((w) => {
                      const rev = w.reviewStatus ?? "APPROVED";
                      const sourceMeta = getSourceTypeMeta(w.stream?.sourceType);
                      return (
                        <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-white">{w.title}</div>
                            <div className="font-mono text-slate-400 dark:text-slate-500">/webcams/{w.slug}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${sourceMeta.badgeClass}`}>
                              {sourceMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {w.country.flag} {w.city.name}, {w.country.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                rev === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900"
                              }`}
                            >
                              {rev}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900">
                              {w.stream?.status ?? "UNKNOWN"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            <Link
                              href={`/webcams/${w.slug}`}
                              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              View
                            </Link>
                            <button
                              disabled={busy}
                              onClick={() => runAction({ action: "suspend", slug: w.slug })}
                              className={`px-2.5 py-1 rounded-md ${
                                rev === "APPROVED"
                                  ? "border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/50"
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
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/70 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Query / Scope</th>
                      <th className="px-4 py-3 font-medium">Quota Cost</th>
                      <th className="px-4 py-3 font-medium">Last Run</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.jobs.map((j) => (
                      <tr key={j.id}>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{j.source}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{j.query}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.quotaCost} units</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{j.lastRunAt}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900">
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
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                  User &amp; Copyright Reports
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {data.reports.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{r.webcamTitle}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          {r.type} · {r.createdAt}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                  Audit Logs
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {data.auditLogs.map((l) => (
                    <div key={l.id} className="px-4 py-3 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{l.action}</span>
                        <span className="text-slate-600 dark:text-slate-400"> · {l.targetId}</span>
                        <div className="text-slate-400 dark:text-slate-500 mt-0.5">by {l.actor}</div>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 shrink-0">{l.createdAt}</span>
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
