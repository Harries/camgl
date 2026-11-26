"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Shuffle, Trash2 } from "lucide-react";
import type { PublicWebcam } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

const FAVORITES_KEY = "camgl_favorites";

export function FavoritesClient() {
  const { locale, messages } = useI18n();
  const tc = messages.collections;
  const [slugs, setSlugs] = useState<string[]>([]);
  const [webcams, setWebcams] = useState<PublicWebcam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let saved: string[] = [];
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          saved = parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
        }
      }
    } catch {
      saved = [];
    }
    setSlugs(saved);
    if (saved.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/webcams?slugs=${encodeURIComponent(saved.join(","))}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: PublicWebcam[] }) => {
        if (!cancelled) {
          setWebcams(Array.isArray(data.items) ? data.items : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removeFavorite = (slug: string) => {
    const nextSlugs = slugs.filter((s) => s !== slug);
    setSlugs(nextSlugs);
    setWebcams((prev) => prev.filter((w) => w.slug !== slug));
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextSlugs));
    } catch {
      // ignore storage errors
    }
  };

  const clearAll = () => {
    setSlugs([]);
    setWebcams([]);
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch {
      // ignore storage errors
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (webcams.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tc.favoritesEmptyTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{tc.favoritesEmptyBody}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href={localizePath("/", locale)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {tc.exploreDiscover}
          </Link>
          <Link
            href={localizePath("/random", locale)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Shuffle className="w-4 h-4" />
            {messages.nav.random}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {tc.clearFavorites}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <div key={cam.id} className="relative group">
            <WebcamCard webcam={cam} />
            <button
              type="button"
              onClick={() => removeFavorite(cam.slug)}
              title={tc.removeFavorite}
              aria-label={tc.removeFavorite}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-900/75 text-white hover:bg-rose-600 transition-colors backdrop-blur cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
