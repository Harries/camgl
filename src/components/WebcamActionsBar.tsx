"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Heart, Maximize2, Share2, Shuffle } from "lucide-react";
import { localizePath } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

const FAVORITES_KEY = "camgl_favorites";

export function WebcamActionsBar({
  slug,
  title,
  targetId = "webcam-player-container",
}: {
  slug: string;
  title: string;
  targetId?: string;
}) {
  const { locale, messages } = useI18n();
  const tw = messages.webcam;
  const [favorited, setFavorited] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const list = JSON.parse(raw) as string[];
        if (Array.isArray(list) && list.includes(slug)) {
          setFavorited(true);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [slug]);

  const toggleFavorite = () => {
    setFavorited((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        const list = raw ? (JSON.parse(raw) as string[]) : [];
        const set = new Set(Array.isArray(list) ? list : []);
        if (next) {
          set.add(slug);
        } else {
          set.delete(slug);
        }
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
      } catch {
        // ignore storage errors
      }
      return next;
    });
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
          favorited
            ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
        <span>{favorited ? tw.favorited : tw.favorite}</span>
      </button>

      <button type="button" onClick={handleShare} className={btnClass}>
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{tw.copied}</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>{tw.share}</span>
          </>
        )}
      </button>

      <button type="button" onClick={handleFullscreen} className={btnClass}>
        <Maximize2 className="w-3.5 h-3.5" />
        <span>{tw.fullscreen}</span>
      </button>

      <Link href={localizePath("/random", locale)} className={btnClass}>
        <Shuffle className="w-3.5 h-3.5" />
        <span>{tw.randomLive}</span>
      </Link>
    </div>
  );
}
