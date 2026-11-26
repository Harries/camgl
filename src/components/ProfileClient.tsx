"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Heart, LogOut, Save, User } from "lucide-react";
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {user.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  {favorites.length} {ta.likedCountLabel}
                </span>
                <span>·</span>
                <span>
                  {ta.memberSince} {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {ta.logoutBtn}
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-sm space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? ta.savedBtn : ta.saveProfileBtn}
          </button>
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            {ta.myFavoritesTitle}
          </h2>
          <Link
            href={localizePath("/favorites", locale)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {ta.viewRanking} →
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{messages.collections.favoritesEmptyBody}</p>
            <Link
              href={localizePath("/", locale)}
              className="inline-block px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {messages.collections.exploreDiscover}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((cam, index) => (
              <div key={cam.id} className="relative">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold tabular-nums backdrop-blur">
                    #{index + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-semibold tabular-nums backdrop-blur">
                    <Heart className="w-3 h-3 fill-current" />
                    {cam.favoriteCount ?? 0}
                  </span>
                </div>
                <WebcamCard webcam={cam} />
                <button
                  type="button"
                  onClick={() => handleUnfavorite(cam.slug)}
                  className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {messages.collections.removeFavorite}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
