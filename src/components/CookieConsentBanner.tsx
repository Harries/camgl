"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export const CONSENT_STORAGE_KEY = "camgl_cookie_consent";
export const CONSENT_EVENT = "camgl-consent-changed";
export const OPEN_CONSENT_EVENT = "camgl-open-consent";

export interface CookieConsentState {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  updatedAt: string;
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const existing = readCookieConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setPreferences(existing.preferences);
      setAnalytics(existing.analytics);
    }

    const onOpen = () => {
      const curr = readCookieConsent();
      if (curr) {
        setPreferences(curr.preferences);
        setAnalytics(curr.analytics);
      }
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  const saveConsent = (prefs: boolean, ana: boolean) => {
    const state: CookieConsentState = {
      essential: true,
      preferences: prefs,
      analytics: ana,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
      document.cookie = `camgl_consent=${ana ? "all" : "essential"}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  const isZh = locale === "zh";

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
          <Cookie className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{isZh ? "Cookie 与隐私偏好" : "Cookie & Privacy Preferences"}</span>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
        {isZh
          ? "我们使用必要 Cookie 维持登录与安全，并仅在您同意后收集匿名性能指标（Core Web Vitals）以优化播放体验。"
          : "We use essential cookies for authentication and security, and optional anonymous performance telemetry (Core Web Vitals) to improve playback."}
        {" "}
        <Link href={localizePath("/privacy", locale)} className="text-blue-600 dark:text-blue-400 hover:underline">
          {isZh ? "隐私政策" : "Privacy Policy"}
        </Link>
      </p>

      {showPrefs && (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300">
            <span>{isZh ? "必要 Cookie（始终启用）" : "Essential (Always active)"}</span>
            <input type="checkbox" checked disabled className="rounded" />
          </label>
          <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
            <span>{isZh ? "语言与主题偏好" : "Preferences (Language & Theme)"}</span>
            <input
              type="checkbox"
              checked={preferences}
              onChange={(e) => setPreferences(e.target.checked)}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
            <span>{isZh ? "匿名性能与错误监控" : "Anonymous Performance Telemetry"}</span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="rounded"
            />
          </label>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={() => setShowPrefs((v) => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{isZh ? "自定义" : "Preferences"}</span>
        </button>
        <button
          type="button"
          onClick={() => saveConsent(false, false)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
        >
          {isZh ? "仅必要" : "Essential Only"}
        </button>
        {showPrefs ? (
          <button
            type="button"
            onClick={() => saveConsent(preferences, analytics)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            {isZh ? "保存偏好" : "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => saveConsent(true, true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            {isZh ? "全部接受" : "Accept All"}
          </button>
        )}
      </div>
    </div>
  );
}
