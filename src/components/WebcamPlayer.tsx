"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { getWebcamPreviewUrl } from "@/lib/source-badge";
import { withOutboundSource } from "@/lib/seo";

export function WebcamPlayer({
  title,
  embedUrl,
  sourceUrl,
  sourceType,
  mediaType = "LIVE_VIDEO",
  externalId,
}: {
  title: string;
  embedUrl: string;
  sourceUrl: string;
  sourceType: string;
  mediaType?: string;
  externalId?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [snapTick, setSnapTick] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isHls = sourceType === "hls" || embedUrl.toLowerCase().includes(".m3u8");
  const isSnapshot = sourceType === "snapshot" || mediaType === "SNAPSHOT";

  useEffect(() => {
    if (!loaded || !isSnapshot) return;
    const timer = setInterval(() => {
      setSnapTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, [loaded, isSnapshot]);

  useEffect(() => {
    if (!loaded || !isHls || !videoRef.current) return;
    const video = videoRef.current;
    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;

    async function setupHls() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = embedUrl;
        video.play().catch(() => {});
        return;
      }
      try {
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(embedUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data.fatal) {
              setHasError(true);
            }
          });
          hlsInstance = hls;
        } else {
          setHasError(true);
        }
      } catch {
        if (!cancelled) setHasError(true);
      }
    }

    setupHls();

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
    };
  }, [loaded, isHls, embedUrl]);

  const frameClass = "w-full bg-slate-950 flex items-center justify-center";
  const boxClass = "relative w-full aspect-video max-w-[calc(64dvh*16/9)] max-h-[64dvh] mx-auto overflow-hidden";

  if (hasError) {
    return (
      <div className={frameClass}>
        <div className={`${boxClass} bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-3`}>
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <div className="text-sm font-semibold">Stream player unavailable</div>
          <p className="text-xs text-slate-300 max-w-md">
            This stream may be temporarily offline, geo-restricted, or blocked from embedding in your region.
          </p>
          <a
            href={withOutboundSource(sourceUrl)}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
          >
            Watch on Original Source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (!loaded) {
    const typeLabel = isHls
      ? "Direct HLS (.m3u8)"
      : isSnapshot
        ? "Live Refreshing Snapshot"
        : sourceType === "youtube"
          ? "Official YouTube"
          : "Official Partner";

    const previewUrl = getWebcamPreviewUrl({
      sourceType,
      mediaType,
      externalId,
      embedUrl,
    });

    return (
      <div className={frameClass}>
        <div className={`${boxClass} bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center text-white p-6`}>
          {previewUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-black/45" />
            </>
          )}
          <button
            onClick={() => setLoaded(true)}
            className="relative z-10 group flex flex-col items-center gap-3 focus:outline-none cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600 group-hover:bg-blue-500 group-hover:scale-105 transition-all flex items-center justify-center shadow-xl">
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </div>
            <div className="text-sm font-semibold">Load {typeLabel} Stream</div>
            <div className="text-xs text-slate-300">Click to stream directly from the authorized source</div>
          </button>
        </div>
      </div>
    );
  }

  if (isHls) {
    return (
      <div className={frameClass}>
        <div className={`${boxClass} bg-black`}>
          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          />
        </div>
      </div>
    );
  }

  if (isSnapshot) {
    const separator = embedUrl.includes("?") ? "&" : "?";
    const imgUrl = `${embedUrl}${separator}t=${snapTick}`;
    return (
      <div className={frameClass}>
        <div className={`${boxClass} bg-black`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={title}
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-black/65 text-white text-xs backdrop-blur">
              Auto-refresh 15s
            </span>
            <button
              type="button"
              onClick={() => setSnapTick(Date.now())}
              className="p-1.5 rounded-md bg-black/65 text-white hover:bg-black/85 backdrop-blur cursor-pointer"
              title="Refresh snapshot"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iframeSrc =
    sourceType === "youtube"
      ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1&rel=0`
      : embedUrl;

  return (
    <div className={frameClass}>
      <div className={`${boxClass} bg-black`}>
        <iframe
          src={iframeSrc}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
