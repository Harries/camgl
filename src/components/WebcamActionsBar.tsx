"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Heart, Maximize2, Share2, Shuffle } from "lucide-react";
import { localizePath } from "@/lib/i18n";
import {
  clearLocalFavorites,
  getLocalFavorites,
  LOCAL_FAVORITES_EVENT,
  toggleLocalFavorite,
} from "@/lib/local-favorites";
import { useI18n } from "./I18nProvider";

export function WebcamActionsBar({
  slug,
  title,
  initialFavoriteCount = 0,
  targetId = "webcam-player-container",
}: {
  slug: string;
  title: string;
  initialFavoriteCount?: number;
  targetId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, messages } = useI18n();
  const tw = messages.webcam;
  const ta = messages.auth;

  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadAuth = () => {
      fetch("/api/v1/auth/me")
        .then((res) => (res.ok ? res.json() : { user: null, favoriteSlugs: [] }))
        .then(async (data: { user?: unknown; favoriteSlugs?: string[] }) => {
          if (cancelled) return;
          const isLoggedIn = Boolean(data.user);
          setLoggedIn(isLoggedIn);
          if (isLoggedIn) {
            const localSlugs = getLocalFavorites();
            if (localSlugs.length > 0) {
              try {
                const syncRes = await fetch("/api/v1/favorites", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ syncSlugs: localSlugs }),
                });
                if (syncRes.ok) {
                  clearLocalFavorites();
                  const syncJson = (await syncRes.json()) as { mySlugs?: string[] };
                  if (!cancelled && Array.isArray(syncJson.mySlugs)) {
                    setFavorited(syncJson.mySlugs.includes(slug));
                    setAuthLoaded(true);
                    return;
                  }
                }
              } catch {
                // ignore sync error
              }
            }
            setFavorited(Array.isArray(data.favoriteSlugs) && data.favoriteSlugs.includes(slug));
          } else {
            setFavorited(getLocalFavorites().includes(slug));
          }
          setAuthLoaded(true);
        })
        .catch(() => {
          if (!cancelled) {
            setFavorited(getLocalFavorites().includes(slug));
            setAuthLoaded(true);
          }
        });
    };
    loadAuth();
    window.addEventListener("camgl-auth-changed", loadAuth);
    window.addEventListener(LOCAL_FAVORITES_EVENT, loadAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", loadAuth);
      window.removeEventListener(LOCAL_FAVORITES_EVENT, loadAuth);
    };
  }, [slug]);

  const toggleFavorite = async () => {
    if (!authLoaded) return;
    if (!loggedIn) {
      const res = toggleLocalFavorite(slug);
      setFavorited(res.favorited);
      setFavoriteCount((prev) => Math.max(0, prev + (res.favorited ? 1 : -1)));
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch("/api/v1/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        setLoggedIn(false);
        const localRes = toggleLocalFavorite(slug);
        setFavorited(localRes.favorited);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { favorited: boolean; favoriteCount: number };
        setFavorited(data.favorited);
        setFavoriteCount(data.favoriteCount);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleFullscreen = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const btnClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={toggling}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-60 ${
          favorited
            ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
        <span>{favorited ? tw.favorited : tw.favorite}</span>
        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-[11px] tabular-nums">
          {favoriteCount}
        </span>
      </button>

      <button type="button" onClick={handleShare} className={btnClass}>
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{copied ? tw.copied : tw.share}</span>
      </button>

      <button type="button" onClick={handleFullscreen} className={btnClass}>
        <Maximize2 className="w-3.5 h-3.5" />
        <span>{tw.fullscreen}</span>
      </button>

      <Link
        href={localizePath(`/random?exclude=${encodeURIComponent(slug)}`, locale)}
        className={btnClass}
      >
        <Shuffle className="w-3.5 h-3.5" />
        <span>{tw.random}</span>
      </Link>
    </div>
  );
}
