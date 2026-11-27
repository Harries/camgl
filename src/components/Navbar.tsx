"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Compass,
  Flame,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/lib/types";
import { BrandLogo } from "./BrandLogo";
import { CountryFlag } from "./CountryFlag";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "./I18nProvider";
import { getCityLabel, getCountryLabel, localizePath, stripLocalePrefix } from "@/lib/i18n";

interface NavCountryNode {
  name: string;
  slug: string;
  isoCode: string;
  flag: string;
  webcamCount: number;
  cities: Array<{ name: string; slug: string; webcamCount: number }>;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [navCountries, setNavCountries] = useState<NavCountryNode[]>([]);
  const [activeCountrySlug, setActiveCountrySlug] = useState<string>("");
  const countriesLoadedRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { locale, messages } = useI18n();
  const t = messages.nav;
  const ta = messages.auth;
  const { path: barePathname } = stripLocalePrefix(pathname);

  useEffect(() => {
    let cancelled = false;
    const loadUser = () => {
      fetch("/api/v1/auth/me")
        .then((res) => (res.ok ? res.json() : { user: null, isAdmin: false }))
        .then((data: { user?: AuthUser | null; isAdmin?: boolean }) => {
          if (!cancelled) {
            setUser(data.user ?? null);
            setIsAdmin(Boolean(data.isAdmin));
          }
        })
        .catch(() => {});
    };
    loadUser();
    window.addEventListener("camgl-auth-changed", loadUser);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", loadUser);
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setCountriesOpen(false);
  }, [pathname]);

  const openCountriesMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setCountriesOpen(true);
    if (!countriesLoadedRef.current) {
      countriesLoadedRef.current = true;
      fetch("/api/v1/countries")
        .then((res) => (res.ok ? res.json() : { countries: [] }))
        .then((data: { countries?: NavCountryNode[] }) => {
          const list = data.countries ?? [];
          setNavCountries(list);
          if (list.length > 0) {
            setActiveCountrySlug((prev) => prev || list[0].slug);
          }
        })
        .catch(() => {
          countriesLoadedRef.current = false;
        });
    }
  };

  const scheduleCloseCountriesMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setCountriesOpen(false);
    }, 150);
  };

  const activeCountry =
    navCountries.find((c) => c.slug === activeCountrySlug) ?? navCountries[0] ?? null;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    setIsAdmin(false);
    window.dispatchEvent(new Event("camgl-auth-changed"));
    router.push(localizePath("/", locale));
    router.refresh();
  };

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
    showLiveBadge = false,
    trailing?: React.ReactNode
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
        {trailing}
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
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href={localizePath("/", locale)} className="flex items-center gap-2.5 shrink-0 group">
            <BrandLogo className="w-9 h-9 drop-shadow-sm transition-transform group-hover:scale-105" />
            <div>
              <div className="font-semibold text-base tracking-tight leading-none text-slate-900 dark:text-white">
                LiveCam Global
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.brandSubtitle}</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-1.5">
            {navLink("/", t.discover, <Compass className="w-4 h-4 shrink-0" />, true)}
            <div
              className="relative"
              onMouseEnter={openCountriesMenu}
              onMouseLeave={scheduleCloseCountriesMenu}
            >
              {navLink(
                "/countries",
                t.mapAndCountries,
                <MapPin className="w-4 h-4 shrink-0" />,
                false,
                <ChevronDown
                  className={`hidden md:inline-block w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    countriesOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
              )}
              {countriesOpen && (
                <div className="hidden md:block absolute left-0 top-full pt-2 z-50">
                  <div className="w-[560px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                    <div className="grid grid-cols-12 h-[360px]">
                      {/* Left: Countries */}
                      <div className="col-span-5 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-2 space-y-0.5 bg-slate-50/60 dark:bg-slate-950/40">
                        {navCountries.length === 0 ? (
                          <div className="p-4 text-xs text-slate-400">Loading...</div>
                        ) : (
                          navCountries.map((co) => {
                            const isActive = activeCountry?.slug === co.slug;
                            return (
                              <Link
                                key={co.slug}
                                href={localizePath(`/countries/${co.slug}`, locale)}
                                onMouseEnter={() => setActiveCountrySlug(co.slug)}
                                onClick={() => setCountriesOpen(false)}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                                  isActive
                                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                                    : "text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <CountryFlag isoCode={co.isoCode} flag={co.flag} />
                                  <span className="truncate">
                                    {getCountryLabel(locale, co.slug, co.name, co.isoCode)}
                                  </span>
                                </span>
                                <span
                                  className={`shrink-0 text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {co.webcamCount}
                                </span>
                              </Link>
                            );
                          })
                        )}
                      </div>

                      {/* Right: Cities of hovered country */}
                      <div className="col-span-7 overflow-y-auto p-3.5 space-y-3">
                        {activeCountry ? (
                          <>
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                                <CountryFlag isoCode={activeCountry.isoCode} flag={activeCountry.flag} />
                                <span>
                                  {getCountryLabel(
                                    locale,
                                    activeCountry.slug,
                                    activeCountry.name,
                                    activeCountry.isoCode
                                  )}
                                </span>
                              </div>
                              <Link
                                href={localizePath(`/countries/${activeCountry.slug}`, locale)}
                                onClick={() => setCountriesOpen(false)}
                                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {messages.home.viewAllCountries.replace("countries", "").trim() || "View all →"}
                              </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {activeCountry.cities.map((ci) => (
                                <Link
                                  key={ci.slug}
                                  href={localizePath(
                                    `/countries/${activeCountry.slug}/${ci.slug}`,
                                    locale
                                  )}
                                  onClick={() => setCountriesOpen(false)}
                                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                                >
                                  <span className="truncate font-medium">
                                    {getCityLabel(locale, ci.slug, ci.name)}
                                  </span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                                    {ci.webcamCount}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="p-4 text-xs text-slate-400">
                            {messages.countries.heroSubtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {navCountries.length} {messages.home.countries}
                      </span>
                      <Link
                        href={localizePath("/countries", locale)}
                        onClick={() => setCountriesOpen(false)}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {messages.home.exploreMap} →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="hidden lg:inline-flex">
              {navLink("/popular", t.popular, <Flame className="w-4 h-4 shrink-0" />)}
            </span>
            <span className="hidden xl:inline-flex">
              {navLink("/favorites", t.favorites, <Heart className="w-4 h-4 shrink-0" />)}
            </span>
            <span className="hidden sm:inline-flex">
              {navLink("/submit", t.submit, <PlusCircle className="w-4 h-4 shrink-0" />)}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <form onSubmit={handleSearch} className="hidden md:flex items-center w-44 xl:w-56 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </form>
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="px-2.5 py-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[96px] truncate">{user.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg py-1.5 z-50"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href={localizePath("/profile", locale)}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{t.enterProfile}</span>
                    </Link>

                    <Link
                      href={localizePath("/profile?tab=favorites", locale)}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>{ta.menuFavorites}</span>
                    </Link>

                    <Link
                      href={localizePath("/profile?tab=settings", locale)}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>{ta.menuSettings}</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>{t.adminConsole}</span>
                      </Link>
                    )}
                  </div>

                  <div className="p-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{ta.logoutBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={localizePath("/login", locale)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t.login}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
