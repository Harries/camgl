"use client";

import { useState } from "react";
import { Play, ExternalLink, AlertTriangle } from "lucide-react";

export function WebcamPlayer({
  title,
  embedUrl,
  sourceUrl,
  sourceType,
}: {
  title: string;
  embedUrl: string;
  sourceUrl: string;
  sourceType: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="aspect-video bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <div className="text-sm font-semibold">Embedded player unavailable</div>
        <p className="text-xs text-slate-300 max-w-md">
          This stream may be temporarily offline or restricted from embedding in your region.
        </p>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
        >
          Watch on Original Source <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center text-white p-6">
        <button
          onClick={() => setLoaded(true)}
          className="group flex flex-col items-center gap-3 focus:outline-none"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600 group-hover:bg-blue-500 group-hover:scale-105 transition-all flex items-center justify-center shadow-xl">
            <Play className="w-7 h-7 fill-white ml-0.5" />
          </div>
          <div className="text-sm font-semibold">Load Official {sourceType === "youtube" ? "YouTube" : "Partner"} Live Player</div>
          <div className="text-xs text-slate-300">Click to stream directly from the authorized source</div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      <iframe
        src={`${embedUrl}?autoplay=1&rel=0`}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setHasError(true)}
      />
    </div>
  );
}
