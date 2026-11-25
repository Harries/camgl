"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicWebcam } from "@/lib/types";
import { WebcamCard } from "./WebcamCard";

export function InfiniteWebcamGrid({
  initialItems,
  total,
  initialHasMore,
  category,
  q,
  pageSize = 12,
}: {
  initialItems: PublicWebcam[];
  total: number;
  initialHasMore: boolean;
  category?: string;
  q?: string;
  pageSize?: number;
}) {
  const [items, setItems] = useState<PublicWebcam[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialHasMore);
    setLoading(false);
  }, [initialItems, initialHasMore, category, q]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
      });
      if (category) params.set("category", category);
      if (q) params.set("q", q);

      const res = await fetch(`/api/v1/webcams?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        items?: PublicWebcam[];
        hasMore?: boolean;
      };
      const incoming = json.items ?? [];
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const item of incoming) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
      setPage(nextPage);
      setHasMore(Boolean(json.hasMore));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize, category, q]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </section>

      <div ref={sentinelRef} className="flex flex-col items-center justify-center py-4 gap-2">
        {hasMore ? (
          <button
            type="button"
            disabled={loading}
            onClick={loadMore}
            className="px-5 py-2 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading
              ? "Loading more webcams..."
              : `Load More (${items.length} / ${total})`}
          </button>
        ) : (
          total > 0 && (
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Showing all {items.length} live webcams
            </div>
          )
        )}
      </div>
    </div>
  );
}
