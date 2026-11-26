"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { BrandLogo } from "./BrandLogo";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";
import { CookieConsentBanner, OPEN_CONSENT_EVENT } from "./CookieConsentBanner";
import { TelemetryReporter } from "./TelemetryReporter";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { locale, messages } = useI18n();
  const tf = messages.footer;
  const tn = messages.nav;

  const colHeaders =
    locale === "zh"
      ? { explore: "探索发现", themes: "主题与社区", legal: "合规与支持" }
      : locale === "ja"
      ? { explore: "探索", themes: "テーマ・コミュニティ", legal: "法務・サポート" }
      : locale === "de"
      ? { explore: "Entdecken", themes: "Themen & Community", legal: "Rechtliches & Support" }
      : locale === "es"
      ? { explore: "Explorar", themes: "Temas y Comunidad", legal: "Legal y Soporte" }
      : locale === "fr"
      ? { explore: "Explorer", themes: "Thèmes & Communauté", legal: "Légal & Support" }
      : { explore: "Explore", themes: "Themes & Community", legal: "Legal & Support" };

  const linkClass =
    "text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/95 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-5 space-y-4">
              <Link href={localizePath("/", locale)} className="inline-flex items-center gap-2.5 group">
                <BrandLogo className="w-9 h-9 shrink-0" />
                <div>
                  <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    LiveCam Global
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {tn.brandSubtitle}
                  </div>
                </div>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                {tf.tagline}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>24/7 Official Streams</span>
              </div>
            </div>

            {/* Explore Column */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                {colHeaders.explore}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href={localizePath("/countries", locale)} className={linkClass}>
                    {tf.mapAndCountries}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/popular", locale)} className={linkClass}>
                    {tf.popular}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/new", locale)} className={linkClass}>
                    {tf.newCams}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/random", locale)} className={linkClass}>
                    {tn.random}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Themes & Community Column */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                {colHeaders.themes}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href={localizePath("/themes/daylight", locale)} className={linkClass}>
                    ☀️ {locale === "zh" ? "白昼实景" : "Daylight"}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/themes/night", locale)} className={linkClass}>
                    🌙 {locale === "zh" ? "全球夜景" : "Night Views"}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/favorites", locale)} className={linkClass}>
                    {tf.favorites}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/submit", locale)} className={linkClass}>
                    {tf.partnersAndSubmit}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Support Column */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                {colHeaders.legal}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href={localizePath("/privacy", locale)} className={linkClass}>
                    {tf.privacy}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/terms", locale)} className={linkClass}>
                    {tf.terms}
                  </Link>
                </li>
                <li>
                  <Link href={localizePath("/contact", locale)} className={linkClass}>
                    {tf.contact}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
                    className={`${linkClass} cursor-pointer text-left`}
                  >
                    {locale === "zh" ? "Cookie 设置" : "Cookie Settings"}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
            <div>© {new Date().getFullYear()} LiveCam Global. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Sitemap
              </a>
              <span>·</span>
              <span>Weather by Open-Meteo</span>
            </div>
          </div>
        </div>
      </footer>
      <CookieConsentBanner />
      <TelemetryReporter />
    </div>
  );
}
