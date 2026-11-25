"use client";

import { Globe } from "lucide-react";
import { LOCALE_OPTIONS, normalizeLocale } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <label
      className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors text-xs font-medium cursor-pointer ${className}`}
      title="Language"
    >
      <Globe className="w-3.5 h-3.5 shrink-0" />
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => setLocale(normalizeLocale(e.target.value))}
        className="bg-transparent focus:outline-none cursor-pointer pr-1 text-xs font-medium"
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
