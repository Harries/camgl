"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Lock, Trophy } from "lucide-react";
import type { PublicWebcam } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export function FavoritesClient({ initialRanked }: { initialRanked: PublicWebcam[] }) {
  const { locale, messages } = useI18n();
  const tc = messages.collections;
  const ta = messages.auth;

  const [tab, setTab] = useState<"ranking" | "mine">("ranking");
  const [authenticated, setAuthenticated] = useState(false);
  const [ranked, setRanked] = useState<PublicWebcam[]>(initialRanked);
  const [myFavorites, setMyFavorites] = useState<PublicWebcam[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/v1/favorites")
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            data: {
              authenticated?: boolean;
              ranked?: PublicWebcam[];
              myFavorites?: PublicWebcam[];
            } | null
          ) => {
            if (cancelled || !data) return;
            setAuthenticated(Boolean(data.authenticated));
            if (Array.isArray(data.ranked)) setRanked(data.ranked);
            if (Array.isArray(data.myFavorites)) setMyFavorites(data.myFavorites);
            setLoadingMine(false);
          }
        )
        .catch(() => {
          if (!cancelled) setLoadingMine(false);
        });
    };
    load();
    window.addEventListener("camgl-auth-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", load);
    };
  }, []);

  const list = tab === "ranking" ? ranked : myFavorites;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("ranking")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              tab === "ranking"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            {tc.mostLikedTab}
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              tab === "mine"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            {tc.myLikesTab}
            {authenticated && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/15 text-[10px] tabular-nums">
                {myFavorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === "mine" && !loadingMine && !authenticated ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {ta.loginToFavorite}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {ta.loginPromptBody}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={localizePath("/login?next=/favorites", locale)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {ta.loginBtn}
            </Link>
            <Link
              href={localizePath("/register?next=/favorites", locale)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {ta.registerBtn}
            </Link>
          </div>
        </div>
      ) : tab === "mine" && !loadingMine && myFavorites.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tc.favoritesEmptyTitle}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{tc.favoritesEmptyBody}</p>
          </div>
          <Link
            href={localizePath("/", locale)}
            className="inline-block px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {tc.exploreDiscover}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((cam, index) => (
            <WebcamCard
              key={cam.id}
              webcam={cam}
              videoBottomLeft={
                <>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold tabular-nums backdrop-blur">
                    #{index + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-semibold tabular-nums backdrop-blur">
                    <Heart className="w-3 h-3 fill-current" />
                    {cam.favoriteCount ?? 0}
                  </span>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
