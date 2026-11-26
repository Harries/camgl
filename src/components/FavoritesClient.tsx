"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trophy } from "lucide-react";
import type { PublicWebcam } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";
import {
  clearLocalFavorites,
  getLocalFavorites,
  LOCAL_FAVORITES_EVENT,
} from "@/lib/local-favorites";

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
          async (
            data: {
              authenticated?: boolean;
              ranked?: PublicWebcam[];
              myFavorites?: PublicWebcam[];
            } | null
          ) => {
            if (cancelled || !data) return;
            const isAuth = Boolean(data.authenticated);
            setAuthenticated(isAuth);
            if (Array.isArray(data.ranked)) setRanked(data.ranked);

            const localSlugs = getLocalFavorites();
            if (isAuth) {
              if (localSlugs.length > 0) {
                try {
                  const syncRes = await fetch("/api/v1/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ syncSlugs: localSlugs }),
                  });
                  if (syncRes.ok) {
                    clearLocalFavorites();
                    const refreshed = await fetch("/api/v1/favorites").then((r) =>
                      r.ok ? r.json() : null
                    );
                    if (!cancelled && refreshed && Array.isArray(refreshed.myFavorites)) {
                      setMyFavorites(refreshed.myFavorites);
                      setLoadingMine(false);
                      return;
                    }
                  }
                } catch {
                  // ignore sync failure
                }
              }
              if (Array.isArray(data.myFavorites)) setMyFavorites(data.myFavorites);
            } else if (localSlugs.length > 0) {
              const localRes = await fetch(
                `/api/v1/webcams?slugs=${encodeURIComponent(localSlugs.join(","))}`
              ).then((r) => (r.ok ? r.json() : null));
              if (!cancelled && localRes && Array.isArray(localRes.items)) {
                setMyFavorites(localRes.items);
              }
            } else {
              setMyFavorites([]);
            }
            setLoadingMine(false);
          }
        )
        .catch(() => {
          if (!cancelled) setLoadingMine(false);
        });
    };
    load();
    window.addEventListener("camgl-auth-changed", load);
    window.addEventListener(LOCAL_FAVORITES_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", load);
      window.removeEventListener(LOCAL_FAVORITES_EVENT, load);
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
            <span className="px-1.5 py-0.5 rounded-full bg-black/15 text-[10px] tabular-nums">
              {myFavorites.length}
            </span>
          </button>
        </div>
      </div>

      {tab === "mine" && !loadingMine && !authenticated && myFavorites.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 px-4 py-3 flex items-center justify-between gap-3 flex-wrap text-xs">
          <span className="text-slate-700 dark:text-slate-300">
            {ta.loginPromptBody}
          </span>
          <Link
            href={localizePath("/login?next=/favorites", locale)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {ta.loginBtn}
          </Link>
        </div>
      )}

      {tab === "mine" && !loadingMine && myFavorites.length === 0 ? (
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
          {list.map((cam) => (
            <WebcamCard key={cam.id} webcam={cam} />
          ))}
        </div>
      )}
    </div>
  );
}
