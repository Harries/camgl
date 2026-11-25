"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

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
            © {new Date().getFullYear()} LiveCam Global. Official embed player platform · No unauthorized surveillance streams.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/countries" className="hover:text-slate-900 dark:hover:text-white">Map &amp; Countries</Link>
            <Link href="/submit" className="hover:text-slate-900 dark:hover:text-white">Partners &amp; Submit</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
