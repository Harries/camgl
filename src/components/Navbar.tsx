"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shuffle, Search } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  const navLink = (href: string, label: string, showLiveBadge = false) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          showLiveBadge ? "mr-1.5" : ""
        } ${
          active
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
        }`}
      >
        {label}
        {showLiveBadge && (
          <span className="absolute -top-1.5 -right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold leading-none tracking-wide shadow-sm ring-2 ring-white dark:ring-slate-900">
            <span className="w-1 h-1 rounded-full bg-white live-dot" />
            LIVE
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <BrandLogo className="w-9 h-9 drop-shadow-sm transition-transform group-hover:scale-105" />
          <div>
            <div className="font-semibold text-base tracking-tight leading-none flex items-center gap-1.5 text-slate-900 dark:text-white">
              LiveCam Global
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                MVP
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verified Live Views</div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, country, landmark, or category..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </form>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navLink("/", "Discover", true)}
          {navLink("/countries", "Map & Countries")}
          <span className="hidden sm:inline-flex">{navLink("/submit", "Submit")}</span>
          <ThemeToggle className="ml-1" />
          <Link
            href="/random"
            className="ml-1 px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Shuffle className="w-4 h-4" />
            Random
          </Link>
        </nav>
      </div>
    </header>
  );
}
