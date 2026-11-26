import Link from "next/link";
import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { listPopularWebcams } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getMessages, localizePath } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const tc = getMessages(locale).collections;
  const alternates = buildAlternates("/popular", locale);
  return {
    title: tc.popularTitle,
    description: tc.popularSubtitle,
    alternates,
    openGraph: {
      title: `${tc.popularTitle} | LiveCam Global`,
      description: tc.popularSubtitle,
      url: alternates.canonical,
    },
  };
}

export default async function PopularPage() {
  const [webcams, locale] = await Promise.all([listPopularWebcams(36), getServerLocale()]);
  const msgs = getMessages(locale);
  const tc = msgs.collections;
  const tw = msgs.webcam;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Link href={localizePath("/", locale)} className="hover:underline">
            {tw.home}
          </Link>{" "}
          / {tc.popularTitle}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              {tc.popularTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tc.popularSubtitle}</p>
          </div>
          <Link
            href={localizePath("/new", locale)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {tc.newTitle} →
          </Link>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage(msgs.home.showingWebcams, { count: webcams.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>
    </div>
  );
}
