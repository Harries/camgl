"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Heart, Lock, Maximize2, Share2, Shuffle } from "lucide-react";
import { localizePath } from "@/lib/i18n";
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
        .then((data: { user?: unknown; favoriteSlugs?: string[] }) => {
          if (cancelled) return;
          setLoggedIn(Boolean(data.user));
          setFavorited(Array.isArray(data.favoriteSlugs) && data.favoriteSlugs.includes(slug));
          setAuthLoaded(true);
        })
        .catch(() => {
          if (!cancelled) setAuthLoaded(true);
        });
    };
    loadAuth();
    window.addEventListener("camgl-auth-changed", loadAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", loadAuth);
    };
  }, [slug]);

  const toggleFavorite = async () => {
    if (!authLoaded) return;
    if (!loggedIn) {
      router.push(localizePath(`/login?next=${encodeURIComponent(pathname)}`, locale));
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
        router.push(localizePath(`/login?next=${encodeURIComponent(pathname)}`, locale));
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
        title={!loggedIn && authLoaded ? ta.loginToFavorite : undefined}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-60 ${
          favorited
            ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        {!loggedIn && authLoaded ? (
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
        )}
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
