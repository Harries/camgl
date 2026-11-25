"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
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
  const [ready, setReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [snapTick, setSnapTick] = useState(() => Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isHls = sourceType === "hls" || embedUrl.toLowerCase().includes(".m3u8");
  const isSnapshot = sourceType === "snapshot" || mediaType === "SNAPSHOT";
  const previewUrl = getWebcamPreviewUrl({
    sourceType,
    mediaType,
    externalId,
    embedUrl,
  });

  // Preconnect to the stream's origin to shave off DNS/TLS latency
  useEffect(() => {
    try {
      const origin = new URL(embedUrl).origin;
      const id = `preconnect-${origin}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "preconnect";
        link.href = origin;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    } catch {
      // ignore invalid URL
    }
  }, [embedUrl]);

  useEffect(() => {
    if (!isSnapshot) return;
    const timer = setInterval(() => {
      setSnapTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, [isSnapshot]);

  useEffect(() => {
    if (!isHls || !videoRef.current) return;
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
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 8,
            maxMaxBufferLength: 16,
            backBufferLength: 8,
            manifestLoadingTimeOut: 8000,
            fragLoadingTimeOut: 10000,
          });
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
  }, [isHls, embedUrl]);

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

  const loadingOverlay = !ready && (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-slate-950/75">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        Connecting live stream...
      </div>
    </div>
  );

  if (isHls) {
    return (
      <div className={frameClass}>
        <div className={`${boxClass} bg-black`}>
          {loadingOverlay}
          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
            onCanPlay={() => setReady(true)}
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
          {loadingOverlay}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={title}
            decoding="async"
            className="w-full h-full object-contain"
            onLoad={() => setReady(true)}
            onError={() => setHasError(true)}
          />
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
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
      ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1&rel=0&playsinline=1`
      : embedUrl;

  return (
    <div className={frameClass}>
      <div className={`${boxClass} bg-black`}>
        {loadingOverlay}
        <iframe
          src={iframeSrc}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setReady(true)}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
