"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Check,
  ExternalLink,
  Heart,
  LogOut,
  Mail,
  PlusCircle,
  Save,
  Settings,
  Trash2,
  User,
  Video,
} from "lucide-react";
import type { AuthUser, PublicWebcam, UserSubmission } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

type ProfileSection = "favorites" | "webcams" | "settings";

export function ProfileClient({
  initialUser,
  initialFavorites,
  initialSubmissions,
}: {
  initialUser: AuthUser;
  initialFavorites: PublicWebcam[];
  initialSubmissions: UserSubmission[];
}) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const ta = messages.auth;

  const [section, setSection] = useState<ProfileSection>("favorites");
  const [user, setUser] = useState(initialUser);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [name, setName] = useState(initialUser.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        setError(data.error || ta.authError);
      } else {
        setUser(data.user);
        setSaved(true);
        window.dispatchEvent(new Event("camgl-auth-changed"));
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError(ta.authError);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("camgl-auth-changed"));
    router.push(localizePath("/", locale));
    router.refresh();
  };

  const handleUnfavorite = async (slug: string) => {
    const res = await fetch("/api/v1/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      setFavorites((prev) => prev.filter((w) => w.slug !== slug));
    }
  };

  const menuItems: Array<{
    key: ProfileSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      key: "favorites",
      label: ta.menuFavorites,
      icon: <Heart className="w-4 h-4" />,
      badge: favorites.length,
    },
    {
      key: "webcams",
      label: ta.menuWebcams,
      icon: <Video className="w-4 h-4" />,
      badge: initialSubmissions.length,
    },
    {
      key: "settings",
      label: ta.menuSettings,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const statusBadgeClass = (status: UserSubmission["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "REJECTED":
      case "SUSPENDED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Navigation Menu */}
      <aside className="lg:col-span-3 lg:sticky lg:top-20">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/70 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </div>
            </div>
          </div>

          <nav className="p-2.5 space-y-1">
            {menuItems.map((item) => {
              const active = section === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{ta.logoutBtn}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <section className="lg:col-span-9 space-y-4">
        {section === "favorites" && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-5 py-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-slate-900 dark:text-white">
                    {ta.myFavoritesTitle}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {favorites.length} {ta.likedCountLabel}
                  </p>
                </div>
              </div>
              <Link
                href={localizePath("/favorites", locale)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {ta.viewRanking} →
              </Link>
            </div>

            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {messages.collections.favoritesEmptyTitle}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {messages.collections.favoritesEmptyBody}
                  </p>
                </div>
                <Link
                  href={localizePath("/", locale)}
                  className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {messages.collections.exploreDiscover}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {favorites.map((cam, index) => (
                  <div key={cam.id} className="relative group">
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold tabular-nums backdrop-blur">
                        #{index + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-semibold tabular-nums backdrop-blur">
                        <Heart className="w-3 h-3 fill-current" />
                        {cam.favoriteCount ?? 0}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnfavorite(cam.slug)}
                      title={messages.collections.removeFavorite}
                      aria-label={messages.collections.removeFavorite}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-rose-600 transition-colors backdrop-blur cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <WebcamCard webcam={cam} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {section === "webcams" && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-5 py-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-slate-900 dark:text-white">
                    {ta.myWebcamsTitle}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {initialSubmissions.length}
                  </p>
                </div>
              </div>
              <Link
                href={localizePath("/submit", locale)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {ta.submitWebcamBtn}
              </Link>
            </div>

            {initialSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Video className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {ta.myWebcamsEmpty}
                </p>
                <Link
                  href={localizePath("/submit", locale)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  {ta.submitWebcamBtn}
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                {initialSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {sub.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass(sub.status)}`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span>{sub.location}</span>
                        <span>·</span>
                        <span className="capitalize">{sub.category}</span>
                        <span>·</span>
                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a
                      href={sub.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {section === "settings" && (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-white">
                {ta.menuSettings}
              </h1>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {ta.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {ta.emailLabel}
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {ta.memberSince}
                </label>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? ta.savedBtn : ta.saveProfileBtn}
                </button>
                {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
