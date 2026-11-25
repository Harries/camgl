import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedWebcamsPage } from "@/lib/repository";
import { InfiniteWebcamGrid } from "@/components/InfiniteWebcamGrid";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Webcams",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q = "" }, locale] = await Promise.all([searchParams, getServerLocale()]);
  const ts = getMessages(locale).search;
  const { items, total, hasMore } = await listApprovedWebcamsPage({
    q: q || undefined,
    page: 1,
    pageSize: 12,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {q ? formatMessage(ts.titleForQuery, { q }) : ts.titleDefault}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage(ts.foundCount, { count: total })}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 p-10 text-center space-y-2">
          <div className="text-sm font-medium text-slate-900 dark:text-white">No matching webcams found</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try searching for Japan, Italy, Beach, or Tokyo.</p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            Back to Discover
          </Link>
        </div>
      ) : (
        <InfiniteWebcamGrid
          initialItems={items}
          total={total}
          initialHasMore={hasMore}
          q={q || undefined}
          pageSize={12}
        />
      )}
    </div>
  );
}
