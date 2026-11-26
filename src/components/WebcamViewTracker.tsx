"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

export function WebcamViewTracker({
  slug,
  initialViews,
  label,
}: {
  slug: string;
  initialViews: number;
  label: string;
}) {
  const [views, setViews] = useState(initialViews);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    fetch(`/api/v1/webcams/${encodeURIComponent(slug)}/view`, {
      method: "POST",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { viewCount?: number } | null) => {
        if (data && typeof data.viewCount === "number") {
          setViews(data.viewCount);
        }
      })
      .catch(() => {
        // ignore network errors
      });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
      <Eye className="w-3.5 h-3.5" />
      <span>
        {views.toLocaleString()} {label}
      </span>
    </span>
  );
}
