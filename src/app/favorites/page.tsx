import Link from "next/link";
import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { FavoritesClient } from "@/components/FavoritesClient";
import { listMostLikedWebcams } from "@/lib/repository";
import { buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages, localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const tc = getMessages(locale).collections;
  const alternates = buildAlternates("/favorites", locale);
  return {
    title: tc.favoritesTitle,
    description: tc.favoritesSubtitle,
    alternates,
  };
}

export default async function FavoritesPage() {
  const [ranked, locale] = await Promise.all([listMostLikedWebcams(48), getServerLocale()]);
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
          / {tc.favoritesTitle}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
          {tc.favoritesTitle}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{tc.favoritesSubtitle}</p>
      </div>

      <FavoritesClient initialRanked={ranked} />
    </div>
  );
}
