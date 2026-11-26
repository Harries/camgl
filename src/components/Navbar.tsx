"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, MapPin, PlusCircle, Shuffle, Search } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "./I18nProvider";
import { localizePath, stripLocalePrefix } from "@/lib/i18n";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { locale, messages } = useI18n();
  const t = messages.nav;
  const { path: barePathname } = stripLocalePrefix(pathname);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const searchBase = localizePath("/search", locale);
    if (trimmed) {
      router.push(`${searchBase}?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(searchBase);
    }
  };

  const navLink = (
    href: string,
    label: string,
    icon: React.ReactNode,
    showLiveBadge = false
  ) => {
    const active = href === "/" ? barePathname === "/" : barePathname.startsWith(href);
    return (
      <Link
        href={localizePath(href, locale)}
        className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
          showLiveBadge ? "mr-1.5" : ""
        } ${
          active
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
        }`}
      >
        {icon}
        <span>{label}</span>
        {showLiveBadge && (
          <span className="absolute -top-1.5 -right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold leading-none tracking-wide shadow-sm ring-2 ring-white dark:ring-slate-900">
            <span className="w-1 h-1 rounded-full bg-white live-dot" />
            {t.live}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href={localizePath("/", locale)} className="flex items-center gap-2.5 shrink-0 group">
          <BrandLogo className="w-9 h-9 drop-shadow-sm transition-transform group-hover:scale-105" />
          <div>
            <div className="font-semibold text-base tracking-tight leading-none text-slate-900 dark:text-white">
              LiveCam Global
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.brandSubtitle}</div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </form>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navLink("/", t.discover, <Compass className="w-4 h-4 shrink-0" />, true)}
          {navLink("/countries", t.mapAndCountries, <MapPin className="w-4 h-4 shrink-0" />)}
          <span className="hidden sm:inline-flex">
            {navLink("/submit", t.submit, <PlusCircle className="w-4 h-4 shrink-0" />)}
          </span>
          <LanguageSwitcher className="ml-1" />
          <ThemeToggle className="ml-1" />
          <Link
            href={localizePath("/random", locale)}
            className="ml-1 px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">{t.random}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
