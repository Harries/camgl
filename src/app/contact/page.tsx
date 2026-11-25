import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck, Video, Wrench } from "lucide-react";
import { ContactFormClient } from "@/components/ContactFormClient";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const seo = getMessages(locale).seo;
  return {
    title: seo.contactTitle,
    description: seo.contactDesc,
    alternates: buildAlternates("/contact", locale),
  };
}

export default async function ContactPage() {
  const locale = await getServerLocale();
  const tc = getMessages(locale).contact;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {tc.eyebrow}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {tc.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {tc.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tc.partnersTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tc.partnersBody}
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:support@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              support@camgl.com
            </a>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 w-fit"
            >
              {tc.submitBtn}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tc.privacyTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tc.privacyBody}
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:support@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              support@camgl.com
            </a>
            <Link
              href="/privacy"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
            >
              {tc.viewPrivacy}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tc.supportTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tc.supportBody}
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:support@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              support@camgl.com
            </a>
            <Link
              href="/countries"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
            >
              {tc.browseCams}
            </Link>
          </div>
        </div>
      </div>

      <ContactFormClient />

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {tc.includeTitle}
        </h2>
        <p>{tc.includeBody}</p>
      </div>
    </div>
  );
}
