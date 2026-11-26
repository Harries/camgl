import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationBar({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number) => (page <= 1 ? basePath : `${basePath}?page=${page}`);

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  if (start > 1) pages.push(1);
  for (let p = start; p <= end; p += 1) {
    if (!pages.includes(p)) pages.push(p);
  }
  if (end < totalPages && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 pt-4 flex-wrap"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 cursor-not-allowed">
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </span>
      )}

      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="inline-flex items-center gap-1.5">
            {showEllipsis && (
              <span className="px-1.5 text-xs text-slate-400 dark:text-slate-500">…</span>
            )}
            <Link
              href={pageHref(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`min-w-8 h-8 px-2.5 inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === currentPage
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 cursor-not-allowed">
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </nav>
  );
}
