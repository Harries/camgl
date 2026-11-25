"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { locale, messages } = useI18n();
  const tf = messages.footer;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} {tf.tagline}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={localizePath("/countries", locale)} className="hover:text-slate-900 dark:hover:text-white">{tf.mapAndCountries}</Link>
            <Link href={localizePath("/submit", locale)} className="hover:text-slate-900 dark:hover:text-white">{tf.partnersAndSubmit}</Link>
            <Link href={localizePath("/privacy", locale)} className="hover:text-slate-900 dark:hover:text-white">{tf.privacy}</Link>
            <Link href={localizePath("/terms", locale)} className="hover:text-slate-900 dark:hover:text-white">{tf.terms}</Link>
            <Link href={localizePath("/contact", locale)} className="hover:text-slate-900 dark:hover:text-white">{tf.contact}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
