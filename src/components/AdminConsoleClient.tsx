"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  LogOut,
  Search,
  Mail,
  Tag,
  Globe,
  Plus,
  Trash2,
  Pencil,
  Users,
  ShieldCheck,
  Heart,
  ChevronsUpDown,
  FileCheck2,
  Languages,
  Building2,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { AdminCharts } from "./AdminCharts";
import type {
  AdminAuditLog,
  AdminCandidate,
  AdminCategory,
  AdminCity,
  AdminContactMessage,
  AdminCountry,
  AdminDiscoveryJob,
  AdminLicense,
  AdminProvider,
  AdminReport,
  AdminSubmission,
  AdminTranslation,
  AdminUser,
  AuthUser,
  PublicWebcam,
} from "@/lib/types";
import { getSourceTypeMeta } from "@/lib/source-badge";
import { withOutboundSource } from "@/lib/seo";

interface AdminData {
  webcams: (PublicWebcam & { reviewStatus?: string })[];
  candidates: AdminCandidate[];
  jobs: AdminDiscoveryJob[];
  reports: AdminReport[];
  contactMessages?: AdminContactMessage[];
  categories?: AdminCategory[];
  countries?: AdminCountry[];
  cities?: AdminCity[];
  users?: AdminUser[];
  licenses?: AdminLicense[];
  translations?: AdminTranslation[];
  providers?: AdminProvider[];
  submissions?: AdminSubmission[];
  telemetry?: {
    sampleCount: number;
    lcpP75Ms: number | null;
    inpP75Ms: number | null;
    clsP75: number | null;
    errorCount: number;
  };
  auditLogs: AdminAuditLog[];
  youtubeQuotaUsed: number;
}

export function AdminConsoleClient({
  initialData,
  currentUser = null,
}: {
  initialData: AdminData;
  currentUser?: AuthUser | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<AdminData>(initialData);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<
    | "dashboard"
    | "review"
    | "webcams"
    | "licenses"
    | "translations"
    | "partners"
    | "categories"
    | "locations"
    | "users"
    | "jobs"
    | "messages"
    | "reports"
  >("dashboard");
  const [licenseForm, setLicenseForm] = useState({
    webcamId: initialData.webcams[0]?.id ?? "",
    permissionType: "YouTube Official Embed",
    evidence: "",
    expiresAt: "",
    status: "ACTIVE",
  });
  const [translationForm, setTranslationForm] = useState({
    entityType: "webcam" as "webcam" | "city" | "country" | "category",
    entityId: initialData.webcams[0]?.id ?? "",
    locale: "zh",
    title: "",
    description: "",
  });
  const [providerForm, setProviderForm] = useState({
    name: "",
    type: "hotel",
    website: "",
    contact: "",
    verified: true,
  });
  const [userSearch, setUserSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSource, setReviewSource] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [webcamSearch, setWebcamSearch] = useState("");
  const [webcamStatus, setWebcamStatus] = useState("all");
  const [webcamSource, setWebcamSource] = useState("all");
  const [webcamPage, setWebcamPage] = useState(1);
  const PAGE_SIZE = 10;
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<{ id?: string; name: string; slug: string }>({
    name: "",
    slug: "",
  });
  const [countryForm, setCountryForm] = useState<{
    id?: string;
    name: string;
    slug: string;
    isoCode: string;
    flag: string;
  }>({ name: "", slug: "", isoCode: "", flag: "🌍" });
  const [cityForm, setCityForm] = useState<{
    id?: string;
    countryId: string;
    name: string;
    slug: string;
    lat: string;
    lng: string;
    timezone: string;
  }>({
    countryId: initialData.countries?.[0]?.id ?? "",
    name: "",
    slug: "",
    lat: "0",
    lng: "0",
    timezone: "UTC",
  });
  const [cityCountryFilter, setCityCountryFilter] = useState("all");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    bestTime: "",
    sourceType: "youtube",
    embedUrl: "",
    sourceUrl: "",
    categorySlugs: [] as string[],
    lat: "0",
    lng: "0",
  });

  function openEditModal(w: PublicWebcam) {
    setEditingSlug(w.slug);
    setEditForm({
      title: w.title,
      description: w.description,
      bestTime: w.bestTime ?? "",
      sourceType: w.stream?.sourceType ?? "youtube",
      embedUrl: w.stream?.embedUrl ?? "",
      sourceUrl: w.stream?.sourceUrl ?? "",
      categorySlugs: w.categories.map((c) => c.slug),
      lat: String(w.city.lat),
      lng: String(w.city.lng),
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSlug) return;
    const ok = await runAction({
      action: "updateWebcam",
      slug: editingSlug,
      title: editForm.title,
      description: editForm.description,
      bestTime: editForm.bestTime,
      sourceType: editForm.sourceType,
      embedUrl: editForm.embedUrl,
      sourceUrl: editForm.sourceUrl,
      categorySlugs: editForm.categorySlugs,
      lat: Number(editForm.lat),
      lng: Number(editForm.lng),
    });
    if (ok) setEditingSlug(null);
  }

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    setUserMenuOpen(false);
    await Promise.all([
      fetch("/api/admin/auth", { method: "DELETE" }),
      fetch("/api/v1/auth/logout", { method: "POST" }),
    ]);
    window.dispatchEvent(new Event("camgl-auth-changed"));
    router.push("/");
    router.refresh();
  }

  async function runAction(payload: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data) {
        setData(json.data);
        return true;
      } else {
        setActionError(json.error || `Request failed (${res.status})`);
        return false;
      }
    } catch {
      setActionError("Network error while executing action");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const approvedCount = data.webcams.filter((w) => (w.reviewStatus ?? "APPROVED") === "APPROVED").length;
  const liveCount = data.webcams.filter((w) => w.stream?.status === "LIVE").length;
  const healthPct = data.webcams.length > 0 ? ((liveCount / data.webcams.length) * 100).toFixed(1) : "0.0";
  const openReports = data.reports.filter((r) => r.status === "OPEN").length;
  const quotaPct = Math.min(Math.round((data.youtubeQuotaUsed / 10000) * 100), 100);

  const filteredCandidates = useMemo(() => {
    const q = reviewSearch.trim().toLowerCase();
    return data.candidates.filter((c) => {
      if (reviewSource !== "all" && c.sourceType !== reviewSource) return false;
      if (!q) return true;
      return `${c.title} ${c.countryName} ${c.cityName} ${c.source} ${c.externalId}`
        .toLowerCase()
        .includes(q);
    });
  }, [data.candidates, reviewSearch, reviewSource]);

  const reviewTotalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const safeReviewPage = Math.min(reviewPage, reviewTotalPages);
  const pagedCandidates = filteredCandidates.slice(
    (safeReviewPage - 1) * PAGE_SIZE,
    safeReviewPage * PAGE_SIZE
  );
  const pageCandidateIds = pagedCandidates.map((c) => c.id);
  const allPageSelected =
    pageCandidateIds.length > 0 &&
    pageCandidateIds.every((id) => selectedCandidateIds.includes(id));

  function toggleSelectCandidate(id: string) {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      setSelectedCandidateIds((prev) =>
        prev.filter((id) => !pageCandidateIds.includes(id))
      );
    } else {
      setSelectedCandidateIds((prev) =>
        Array.from(new Set([...prev, ...pageCandidateIds]))
      );
    }
  }

  function selectHighScoreCandidates() {
    const highIds = filteredCandidates
      .filter((c) => (c.stabilityScore ?? 0) >= 80)
      .map((c) => c.id);
    setSelectedCandidateIds(highIds);
  }

  async function runBatchReview(action: "approveBatch" | "rejectBatch") {
    if (selectedCandidateIds.length === 0) return;
    const ok = await runAction({ action, ids: selectedCandidateIds });
    if (ok) setSelectedCandidateIds([]);
  }

  const filteredWebcams = useMemo(() => {
    const q = webcamSearch.trim().toLowerCase();
    return data.webcams.filter((w) => {
      if (webcamSource !== "all" && (w.stream?.sourceType ?? "youtube") !== webcamSource) {
        return false;
      }
      if (webcamStatus === "LIVE" && w.stream?.status !== "LIVE") return false;
      if (webcamStatus === "OFFLINE" && w.stream?.status === "LIVE") return false;
      if (webcamStatus === "SUSPENDED" && w.reviewStatus !== "SUSPENDED") return false;
      if (!q) return true;
      return `${w.title} ${w.slug} ${w.city.name} ${w.country.name}`
        .toLowerCase()
        .includes(q);
    });
  }, [data.webcams, webcamSearch, webcamStatus, webcamSource]);

  const webcamTotalPages = Math.max(1, Math.ceil(filteredWebcams.length / PAGE_SIZE));
  const safeWebcamPage = Math.min(webcamPage, webcamTotalPages);
  const pagedWebcams = filteredWebcams.slice(
    (safeWebcamPage - 1) * PAGE_SIZE,
    safeWebcamPage * PAGE_SIZE
  );

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
      key: "licenses" as const,
      label: "Licenses",
      badge: (data.licenses ?? []).length,
      icon: FileCheck2,
    },
    {
      key: "translations" as const,
      label: "Translations",
      badge: (data.translations ?? []).length,
      icon: Languages,
    },
    {
      key: "partners" as const,
      label: "Partners & Submissions",
      badge: (data.submissions ?? []).filter((s) => s.status === "PENDING").length,
      icon: Building2,
    },
    {
      key: "categories" as const,
      label: "Categories",
      badge: (data.categories ?? []).length,
      icon: Tag,
    },
    {
      key: "locations" as const,
      label: "Countries & Cities",
      badge: (data.countries ?? []).length,
      icon: Globe,
    },
    {
      key: "users" as const,
      label: "Users",
      badge: (data.users ?? []).length,
      icon: Users,
    },
    {
      key: "jobs" as const,
      label: "Discovery Jobs",
      badge: data.jobs.length,
      icon: Radar,
    },
    {
      key: "messages" as const,
      label: "Contact Messages",
      badge: (data.contactMessages ?? []).filter((m) => m.status === "OPEN").length,
      icon: Mail,
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
            <BrandLogo className="w-8 h-8 shrink-0 drop-shadow-sm" />
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

        {/* Sidebar Footer: Logged-in User Popover */}
        <div ref={userMenuRef} className="relative p-2.5 border-t border-slate-200 dark:border-slate-800">
          {userMenuOpen && (
            <div
              role="menu"
              className={`absolute bottom-full mb-2 z-50 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg py-1.5 ${
                collapsed ? "left-2 w-52" : "left-2.5 right-2.5"
              }`}
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.name ?? "Administrator"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email ?? "Admin Session"}
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>返回网站</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            title={collapsed ? currentUser?.name ?? "Admin" : undefined}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {(currentUser?.name ?? "A").slice(0, 1).toUpperCase()}
                </span>
              )}
              {!collapsed && (
                <div className="text-left min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.name ?? "Administrator"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.email ?? "Admin"}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
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
          {actionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400 px-4 py-3 text-sm flex items-center justify-between">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-xs underline ml-4"
              >
                Dismiss
              </button>
            </div>
          )}
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

              {/* MVP Scale & RUM Core Web Vitals Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      MVP Content Scale (Target: 300 Approved)
                    </span>
                    <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {approvedCount} / 300 ({Math.min(100, Math.round((approvedCount / 300) * 100))}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((approvedCount / 300) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      License Coverage:{" "}
                      {approvedCount === 0
                        ? "100%"
                        : `${Math.min(
                            100,
                            Math.round(
                              (new Set((data.licenses ?? []).filter((l) => l.status === "ACTIVE").map((l) => l.webcamId)).size /
                                Math.max(1, approvedCount)) *
                                100
                            )
                          )}%`}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction({ action: "backfillLicenses" })}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Backfill Missing Licenses
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      RUM Core Web Vitals (P75) &amp; Errors
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {data.telemetry?.sampleCount ?? 0} samples
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                      <div className="text-[10px] text-slate-400">LCP (≤2.5s)</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                        {data.telemetry?.lcpP75Ms !== null && data.telemetry?.lcpP75Ms !== undefined
                          ? `${(data.telemetry.lcpP75Ms / 1000).toFixed(2)}s`
                          : "—"}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                      <div className="text-[10px] text-slate-400">INP (≤200ms)</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                        {data.telemetry?.inpP75Ms !== null && data.telemetry?.inpP75Ms !== undefined
                          ? `${data.telemetry.inpP75Ms}ms`
                          : "—"}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                      <div className="text-[10px] text-slate-400">CLS (≤0.1)</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                        {data.telemetry?.clsP75 !== null && data.telemetry?.clsP75 !== undefined
                          ? data.telemetry.clsP75
                          : "—"}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                      <div className="text-[10px] text-slate-400">JS Errors</div>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                        {data.telemetry?.errorCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <AdminCharts webcams={data.webcams} candidates={data.candidates} />

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
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={busy || filteredCandidates.length === 0}
                    onClick={selectHighScoreCandidates}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400 disabled:opacity-50"
                  >
                    Select Stable (≥80)
                  </button>
                  {selectedCandidateIds.length > 0 && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runBatchReview("approveBatch")}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                      >
                        Approve Selected ({selectedCandidateIds.length})
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runBatchReview("rejectBatch")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50 disabled:opacity-50"
                      >
                        Reject Selected ({selectedCandidateIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateIds([])}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    </>
                  )}
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

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => {
                      setReviewSearch(e.target.value);
                      setReviewPage(1);
                    }}
                    placeholder="Search candidate title, city, country, or source..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["all", "youtube", "official_embed", "hls", "snapshot"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setReviewSource(st);
                        setReviewPage(1);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        reviewSource === st
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {st === "all" ? "All Types" : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                {filteredCandidates.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                    {data.candidates.length === 0
                      ? 'All candidates reviewed. Click "Sync All Sources" to fetch new feeds.'
                      : "No candidates match your search filter."}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/70 dark:border-slate-800 dark:text-slate-400">
                          <tr>
                            <th className="pl-4 pr-2 py-2.5 w-8">
                              <input
                                type="checkbox"
                                checked={allPageSelected}
                                onChange={toggleSelectAllOnPage}
                                aria-label="Select all on page"
                                className="rounded accent-blue-600 cursor-pointer"
                              />
                            </th>
                            <th className="px-3 py-2.5 font-medium">Candidate</th>
                            <th className="px-3 py-2.5 font-medium">Type</th>
                            <th className="px-3 py-2.5 font-medium">Stability</th>
                            <th className="px-3 py-2.5 font-medium">Location</th>
                            <th className="px-3 py-2.5 font-medium">Source &amp; License</th>
                            <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pagedCandidates.map((c) => {
                            const score = c.stabilityScore ?? 0;
                            const checked = selectedCandidateIds.includes(c.id);
                            const scoreClass =
                              score >= 80
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                                : score >= 50
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900";
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="pl-4 pr-2 py-3">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSelectCandidate(c.id)}
                                    aria-label={`Select ${c.title}`}
                                    className="rounded accent-blue-600 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-3">
                                  <div className="font-medium text-slate-900 dark:text-white">{c.title}</div>
                                  <a
                                    href={withOutboundSource(c.sourceUrl)}
                                    target="_blank"
                                    rel="noopener"
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
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                      <span>
                        Showing {(safeReviewPage - 1) * PAGE_SIZE + 1}–{Math.min(safeReviewPage * PAGE_SIZE, filteredCandidates.length)} of {filteredCandidates.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={safeReviewPage <= 1}
                          onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Prev
                        </button>
                        <span className="px-2 tabular-nums">
                          {safeReviewPage} / {reviewTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={safeReviewPage >= reviewTotalPages}
                          onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "webcams" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={webcamSearch}
                    onChange={(e) => {
                      setWebcamSearch(e.target.value);
                      setWebcamPage(1);
                    }}
                    placeholder="Search title, slug, city, or country..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={webcamStatus}
                    onChange={(e) => {
                      setWebcamStatus(e.target.value);
                      setWebcamPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Status</option>
                    <option value="LIVE">LIVE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                  <select
                    value={webcamSource}
                    onChange={(e) => {
                      setWebcamSource(e.target.value);
                      setWebcamPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Source Types</option>
                    <option value="youtube">YouTube</option>
                    <option value="official_embed">Official Embed</option>
                    <option value="hls">HLS .m3u8</option>
                    <option value="snapshot">Snapshot</option>
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction({ action: "deduplicateWebcams" })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 disabled:opacity-50"
                  >
                    Remove Duplicates
                  </button>
                </div>
              </div>

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
                        <th className="px-4 py-3 font-medium">Views</th>
                        <th className="px-4 py-3 font-medium">Likes</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pagedWebcams.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                            No webcams match your search filter.
                          </td>
                        </tr>
                      ) : (
                        pagedWebcams.map((w) => {
                          const rev = w.reviewStatus ?? "APPROVED";
                          const sourceMeta = getSourceTypeMeta(w.stream?.sourceType);
                          const isStreamLive = w.stream?.status === "LIVE";
                          return (
                            <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-900 dark:text-white">{w.title}</div>
                                <div className="font-mono text-xs text-slate-400 dark:text-slate-500">/webcams/{w.slug}</div>
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
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    isStreamLive
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900"
                                  }`}
                                >
                                  {w.stream?.status ?? "UNKNOWN"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                                {(w.viewCount ?? 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                  {(w.favoriteCount ?? 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => runAction({ action: "toggleFeatured", slug: w.slug })}
                                  className={`px-2.5 py-1 rounded-md border ${
                                    w.isFeatured
                                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  {w.isFeatured ? "★ Pinned" : "☆ Pin"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(w)}
                                  className="px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                >
                                  Edit
                                </button>
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredWebcams.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                    <span>
                      Showing {(safeWebcamPage - 1) * PAGE_SIZE + 1}–{Math.min(safeWebcamPage * PAGE_SIZE, filteredWebcams.length)} of {filteredWebcams.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safeWebcamPage <= 1}
                        onClick={() => setWebcamPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Prev
                      </button>
                      <span className="px-2 tabular-nums">
                        {safeWebcamPage} / {webcamTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeWebcamPage >= webcamTotalPages}
                        onClick={() => setWebcamPage((p) => Math.min(webcamTotalPages, p + 1))}
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "categories" && (
            <div className="space-y-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await runAction({
                    action: "saveCategory",
                    id: catForm.id,
                    name: catForm.name,
                    slug: catForm.slug,
                  });
                  if (ok) setCatForm({ name: "", slug: "" });
                }}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {catForm.id ? "Edit Category" : "Add Category"}
                  </h2>
                  {catForm.id && (
                    <button
                      type="button"
                      onClick={() => setCatForm({ name: "", slug: "" })}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <input
                    required
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="Category Name (e.g., Harbor)"
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                    placeholder="Slug (optional, auto-generated)"
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {catForm.id ? "Save Category" : "Add Category"}
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                  All Categories ({(data.categories ?? []).length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Slug</th>
                        <th className="px-4 py-3 font-medium">Webcams</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(data.categories ?? []).map((cat) => (
                        <tr key={cat.id}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{cat.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{cat.slug}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{cat.webcamCount}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setCatForm({ id: cat.id, name: cat.name, slug: cat.slug })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => runAction({ action: "deleteCategory", id: cat.id })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "locations" && (
            <div className="space-y-6">
              {/* Countries Management */}
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await runAction({
                      action: "saveCountry",
                      id: countryForm.id,
                      name: countryForm.name,
                      slug: countryForm.slug,
                      isoCode: countryForm.isoCode,
                      flag: countryForm.flag,
                    });
                    if (ok) setCountryForm({ name: "", slug: "", isoCode: "", flag: "🌍" });
                  }}
                  className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {countryForm.id ? "Edit Country" : "Add Country"}
                    </h2>
                    {countryForm.id && (
                      <button
                        type="button"
                        onClick={() => setCountryForm({ name: "", slug: "", isoCode: "", flag: "🌍" })}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-sm">
                    <input
                      required
                      type="text"
                      value={countryForm.flag}
                      onChange={(e) => setCountryForm({ ...countryForm, flag: e.target.value })}
                      placeholder="Flag (🇺🇸)"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      required
                      type="text"
                      value={countryForm.name}
                      onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                      placeholder="Country Name"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={countryForm.slug}
                      onChange={(e) => setCountryForm({ ...countryForm, slug: e.target.value })}
                      placeholder="Slug (optional)"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      required
                      type="text"
                      maxLength={4}
                      value={countryForm.isoCode}
                      onChange={(e) => setCountryForm({ ...countryForm, isoCode: e.target.value.toUpperCase() })}
                      placeholder="ISO (e.g., US)"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {countryForm.id ? "Save Country" : "Add Country"}
                    </button>
                  </div>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
                    Countries ({(data.countries ?? []).length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Country</th>
                          <th className="px-4 py-3 font-medium">Slug</th>
                          <th className="px-4 py-3 font-medium">ISO</th>
                          <th className="px-4 py-3 font-medium">Cities</th>
                          <th className="px-4 py-3 font-medium">Webcams</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.countries ?? []).map((co) => (
                          <tr key={co.id}>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {co.flag} {co.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{co.slug}</td>
                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{co.isoCode}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{co.cityCount}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{co.webcamCount}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCountryForm({
                                    id: co.id,
                                    name: co.name,
                                    slug: co.slug,
                                    isoCode: co.isoCode,
                                    flag: co.flag,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => runAction({ action: "deleteCountry", id: co.id })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Cities Management */}
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await runAction({
                      action: "saveCity",
                      id: cityForm.id,
                      countryId: cityForm.countryId || data.countries?.[0]?.id,
                      name: cityForm.name,
                      slug: cityForm.slug,
                      lat: Number(cityForm.lat),
                      lng: Number(cityForm.lng),
                      timezone: cityForm.timezone,
                    });
                    if (ok) {
                      setCityForm({
                        countryId: data.countries?.[0]?.id ?? "",
                        name: "",
                        slug: "",
                        lat: "0",
                        lng: "0",
                        timezone: "UTC",
                      });
                    }
                  }}
                  className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {cityForm.id ? "Edit City" : "Add City"}
                    </h2>
                    {cityForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setCityForm({
                            countryId: data.countries?.[0]?.id ?? "",
                            name: "",
                            slug: "",
                            lat: "0",
                            lng: "0",
                            timezone: "UTC",
                          })
                        }
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-sm">
                    <select
                      required
                      value={cityForm.countryId || data.countries?.[0]?.id || ""}
                      onChange={(e) => setCityForm({ ...cityForm, countryId: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {(data.countries ?? []).map((co) => (
                        <option key={co.id} value={co.id}>
                          {co.flag} {co.name}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="text"
                      value={cityForm.name}
                      onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                      placeholder="City Name"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={cityForm.slug}
                      onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value })}
                      placeholder="Slug (optional)"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      required
                      type="number"
                      step="any"
                      value={cityForm.lat}
                      onChange={(e) => setCityForm({ ...cityForm, lat: e.target.value })}
                      placeholder="Lat"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      required
                      type="number"
                      step="any"
                      value={cityForm.lng}
                      onChange={(e) => setCityForm({ ...cityForm, lng: e.target.value })}
                      placeholder="Lng"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      required
                      type="text"
                      value={cityForm.timezone}
                      onChange={(e) => setCityForm({ ...cityForm, timezone: e.target.value })}
                      placeholder="Timezone (America/New_York)"
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {cityForm.id ? "Save City" : "Add City"}
                    </button>
                  </div>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Cities ({(data.cities ?? []).filter((ci) => cityCountryFilter === "all" || ci.countrySlug === cityCountryFilter).length})
                    </div>
                    <select
                      value={cityCountryFilter}
                      onChange={(e) => setCityCountryFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="all">All Countries</option>
                      {(data.countries ?? []).map((co) => (
                        <option key={co.id} value={co.slug}>
                          {co.flag} {co.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">City</th>
                          <th className="px-4 py-3 font-medium">Country</th>
                          <th className="px-4 py-3 font-medium">Coordinates</th>
                          <th className="px-4 py-3 font-medium">Timezone</th>
                          <th className="px-4 py-3 font-medium">Webcams</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(data.cities ?? [])
                          .filter((ci) => cityCountryFilter === "all" || ci.countrySlug === cityCountryFilter)
                          .map((ci) => (
                            <tr key={ci.id}>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {ci.name}
                                <span className="ml-1.5 font-mono text-[11px] text-slate-400">({ci.slug})</span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                {ci.countryFlag} {ci.countryName}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                                {ci.lat.toFixed(3)}, {ci.lng.toFixed(3)}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ci.timezone}</td>
                              <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{ci.webcamCount}</td>
                              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCityForm({
                                      id: ci.id,
                                      countryId: ci.countryId,
                                      name: ci.name,
                                      slug: ci.slug,
                                      lat: String(ci.lat),
                                      lng: String(ci.lng),
                                      timezone: ci.timezone,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => runAction({ action: "deleteCity", id: ci.id })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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

          {tab === "messages" && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  User Contact Messages ({(data.contactMessages ?? []).length})
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted via /contact
                </span>
              </div>
              {(data.contactMessages ?? []).length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No contact messages yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data.contactMessages ?? []).map((m) => (
                    <div key={m.id} className="p-5 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {m.subject}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            From <span className="font-medium text-slate-700 dark:text-slate-200">{m.name}</span> ·{" "}
                            <a href={`mailto:${m.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {m.email}
                            </a>{" "}
                            · {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              m.status === "RESOLVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900"
                            }`}
                          >
                            {m.status}
                          </span>
                          {m.status === "OPEN" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => runAction({ action: "resolveContact", id: m.id })}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800">
                        {m.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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

          {tab === "licenses" && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await runAction({
                    action: "saveLicense",
                    ...licenseForm,
                    expiresAt: licenseForm.expiresAt || null,
                  });
                  if (ok) {
                    setLicenseForm((f) => ({ ...f, evidence: "", expiresAt: "" }));
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add / Update License Record
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction({ action: "backfillLicenses" })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Backfill Missing Licenses (100% Coverage)
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  <select
                    value={licenseForm.webcamId}
                    onChange={(e) => setLicenseForm((f) => ({ ...f, webcamId: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {data.webcams.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={licenseForm.permissionType}
                    onChange={(e) =>
                      setLicenseForm((f) => ({ ...f, permissionType: e.target.value }))
                    }
                    placeholder="Permission type (e.g. Written Partner)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    required
                    value={licenseForm.evidence}
                    onChange={(e) => setLicenseForm((f) => ({ ...f, evidence: e.target.value }))}
                    placeholder="Evidence URL or doc ref"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <input
                    type="date"
                    value={licenseForm.expiresAt}
                    onChange={(e) => setLicenseForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save License
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Webcam</th>
                      <th className="px-4 py-3 font-medium">Permission Type</th>
                      <th className="px-4 py-3 font-medium">Evidence</th>
                      <th className="px-4 py-3 font-medium">Expires</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.licenses ?? []).map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {lic.webcamTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {lic.permissionType}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {lic.evidence}
                        </td>
                        <td className="px-4 py-3 text-slate-500 tabular-nums">
                          {lic.expiresAt ? lic.expiresAt.slice(0, 10) : "Perpetual"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                            {lic.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction({ action: "deleteLicense", id: lic.id })}
                            className="text-rose-600 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(data.licenses ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          No license records yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "translations" && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await runAction({ action: "saveTranslation", ...translationForm });
                  if (ok) {
                    setTranslationForm((f) => ({ ...f, title: "", description: "" }));
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm space-y-3"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Edit Localized Title & Description
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <select
                    value={translationForm.entityId}
                    onChange={(e) =>
                      setTranslationForm((f) => ({ ...f, entityId: e.target.value }))
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {data.webcams.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={translationForm.locale}
                    onChange={(e) => setTranslationForm((f) => ({ ...f, locale: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="zh">zh (简体中文)</option>
                    <option value="ja">ja (日本語)</option>
                    <option value="es">es (Español)</option>
                    <option value="fr">fr (Français)</option>
                    <option value="en">en (English)</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={translationForm.title}
                    onChange={(e) => setTranslationForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Localized Title"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Translation
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={translationForm.description}
                  onChange={(e) =>
                    setTranslationForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Original localized description shown on the detail page..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Entity</th>
                      <th className="px-4 py-3 font-medium">Locale</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.translations ?? []).map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {tr.entityType}:{tr.entityId.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 uppercase font-semibold">{tr.locale}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {tr.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-md truncate">
                          {tr.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction({ action: "deleteTranslation", id: tr.id })}
                            className="text-rose-600 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(data.translations ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No custom translations saved yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "partners" && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await runAction({ action: "saveProvider", ...providerForm });
                  if (ok) {
                    setProviderForm({
                      name: "",
                      type: "hotel",
                      website: "",
                      contact: "",
                      verified: true,
                    });
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm space-y-3"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Partner / Operator
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    value={providerForm.name}
                    onChange={(e) => setProviderForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Partner Name"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <select
                    value={providerForm.type}
                    onChange={(e) => setProviderForm((f) => ({ ...f, type: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="hotel">Hotel / Resort</option>
                    <option value="tourism_board">Tourism Board</option>
                    <option value="observatory">Observatory</option>
                    <option value="youtube_channel">YouTube Channel</option>
                    <option value="partner">Partner</option>
                  </select>
                  <input
                    type="url"
                    value={providerForm.website}
                    onChange={(e) => setProviderForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="Website URL"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={providerForm.contact}
                    onChange={(e) => setProviderForm((f) => ({ ...f, contact: e.target.value }))}
                    placeholder="Contact (private)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Partner
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Partner Operators ({(data.providers ?? []).length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Website</th>
                      <th className="px-4 py-2.5 font-medium">Contact</th>
                      <th className="px-4 py-2.5 font-medium">Webcams</th>
                      <th className="px-4 py-2.5 font-medium text-right">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.providers ?? []).map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{p.type}</td>
                        <td className="px-4 py-2.5 text-blue-600 truncate max-w-xs">
                          {p.website || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{p.contact || "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums">{p.webcamCount}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runAction({ action: "toggleProviderVerified", id: p.id })
                            }
                            className={`px-2.5 py-1 rounded-full font-medium ${
                              p.verified
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {p.verified ? "Verified" : "Unverified"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Partner & Operator Submissions ({(data.submissions ?? []).length})
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Title</th>
                      <th className="px-4 py-2.5 font-medium">Location</th>
                      <th className="px-4 py-2.5 font-medium">Operator / Contact</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.submissions ?? []).map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                          {s.title}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{s.location}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {s.operator || "—"} ({s.contact})
                        </td>
                        <td className="px-4 py-2.5">{s.status}</td>
                        <td className="px-4 py-2.5 text-right space-x-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runAction({
                                action: "reviewSubmission",
                                id: s.id,
                                status: "APPROVED",
                              })
                            }
                            className="text-emerald-600 hover:underline font-medium"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runAction({
                                action: "reviewSubmission",
                                id: s.id,
                                status: "REJECTED",
                              })
                            }
                            className="text-rose-600 hover:underline font-medium"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    User Management ({(data.users ?? []).length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Grant or revoke administrator privileges for registered users.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name or email..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Auth</th>
                      <th className="px-4 py-3 font-medium">Likes</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {(data.users ?? [])
                      .filter((u) => {
                        const q = userSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => {
                        const isAdminUser = u.role === "ADMIN";
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt={u.name}
                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {u.name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {u.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {u.githubId ? "GitHub" : "Email"}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                              {u.favoritesCount}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  isAdminUser
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {isAdminUser && <ShieldCheck className="w-3 h-3" />}
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  runAction({
                                    action: "setUserRole",
                                    id: u.id,
                                    role: isAdminUser ? "USER" : "ADMIN",
                                  })
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                                  isAdminUser
                                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                }`}
                              >
                                {isAdminUser ? "Revoke Admin" : "Make Admin"}
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
        </div>
      </div>

      {/* Edit Webcam Modal */}
      {editingSlug && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Webcam Details
                </h2>
                <div className="text-xs font-mono text-slate-400">/webcams/{editingSlug}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlug(null)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Title *</span>
                <input
                  required
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Description *</span>
                <textarea
                  required
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Best Time to Watch</span>
                <input
                  type="text"
                  value={editForm.bestTime}
                  onChange={(e) => setEditForm({ ...editForm, bestTime: e.target.value })}
                  placeholder="e.g., Sunset and evening lights..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Source Type</span>
                  <select
                    value={editForm.sourceType}
                    onChange={(e) => setEditForm({ ...editForm, sourceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="youtube">youtube</option>
                    <option value="hls">hls</option>
                    <option value="snapshot">snapshot</option>
                    <option value="official_embed">official_embed</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={editForm.lat}
                    onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={editForm.lng}
                    onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Embed / Stream URL</span>
                <input
                  type="url"
                  value={editForm.embedUrl}
                  onChange={(e) => setEditForm({ ...editForm, embedUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Original Source URL</span>
                <input
                  type="url"
                  value={editForm.sourceUrl}
                  onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="space-y-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300 block">Categories</span>
                <div className="flex flex-wrap gap-2">
                  {["city", "beach", "nature", "wildlife", "rail", "ski", "volcano", "port"].map((cat) => {
                    const selected = editForm.categorySlugs.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            categorySlugs: selected
                              ? prev.categorySlugs.filter((s) => s !== cat)
                              : [...prev.categorySlugs, cat],
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs border capitalize transition-colors ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlug(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
