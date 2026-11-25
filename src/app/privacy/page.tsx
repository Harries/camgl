import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const seo = getMessages(locale).seo;
  return {
    title: seo.privacyTitle,
    description: seo.privacyDesc,
    alternates: buildAlternates("/privacy", locale),
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const tl = getMessages(locale).legal;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {tl.eyebrow}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {tl.privacyTitle}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {tl.privacySubtitle}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6 shadow-sm">
        {tl.privacySections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {section.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <Link
            href="/contact"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            {tl.contactPrivacy}
          </Link>
          <Link
            href="/terms"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {tl.readTerms}
          </Link>
        </div>
      </div>
    </div>
  );
}
