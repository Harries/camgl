"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Check,
  Compass,
  Heart,
  LogOut,
  MapPin,
  Save,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import type { AuthUser, PublicWebcam } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export function ProfileClient({
  initialUser,
  initialFavorites,
}: {
  initialUser: AuthUser;
  initialFavorites: PublicWebcam[];
}) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const ta = messages.auth;
  const tn = messages.nav;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar: Profile Card & Settings */}
      <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-3 flex items-end justify-between">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-md bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-white dark:ring-slate-900 shadow-md">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {ta.logoutBtn}
              </button>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  <span className="truncate">{tn.favorites}</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {favorites.length}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{ta.memberSince}</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1.5 tabular-nums truncate">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3"
            >
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
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? ta.savedBtn : ta.saveProfileBtn}
              </button>
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <Link
                href={localizePath("/favorites", locale)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  {ta.viewRanking}
                </span>
                <span>→</span>
              </Link>
              <Link
                href={localizePath("/countries", locale)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {tn.mapAndCountries}
                </span>
                <span>→</span>
              </Link>
              <Link
                href={localizePath("/", locale)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-emerald-500" />
                  {tn.discover}
                </span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Content: Liked Webcams Ranked by Likes */}
      <section className="lg:col-span-8 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-5 py-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {ta.myFavoritesTitle}
              </h2>
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
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {messages.collections.favoritesEmptyTitle}
              </h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </section>
    </div>
  );
}
