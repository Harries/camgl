"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, readCookieConsent } from "./CookieConsentBanner";

function sendTelemetry(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/v1/telemetry", blob);
      return;
    }
  } catch {
    // fallback to fetch
  }
  fetch("/api/v1/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function TelemetryReporter() {
  const pathname = usePathname();

  useEffect(() => {
    const checkEnabled = () => {
      const consent = readCookieConsent();
      return Boolean(consent?.analytics);
    };

    let enabled = checkEnabled();
    const onConsentChange = () => {
      enabled = checkEnabled();
    };
    window.addEventListener(CONSENT_EVENT, onConsentChange);

    let lcpValue = 0;
    let clsValue = 0;
    let inpValue = 0;
    const observers: PerformanceObserver[] = [];

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const lcpObs = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) lcpValue = last.startTime;
        });
        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
        observers.push(lcpObs);
      } catch {
        // unsupported
      }

      try {
        const clsObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
            if (!entry.hadRecentInput && typeof entry.value === "number") {
              clsValue += entry.value;
            }
          }
        });
        clsObs.observe({ type: "layout-shift", buffered: true });
        observers.push(clsObs);
      } catch {
        // unsupported
      }

      try {
        const inpObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > inpValue) {
              inpValue = entry.duration;
            }
          }
        });
        inpObs.observe({ type: "event", buffered: true });
        observers.push(inpObs);
      } catch {
        // unsupported
      }
    }

    const flushVitals = () => {
      if (!enabled) return;
      if (lcpValue > 0) sendTelemetry({ type: "vital", name: "LCP", value: Math.round(lcpValue), path: pathname });
      if (inpValue > 0) sendTelemetry({ type: "vital", name: "INP", value: Math.round(inpValue), path: pathname });
      sendTelemetry({ type: "vital", name: "CLS", value: Number(clsValue.toFixed(4)), path: pathname });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushVitals();
    };
    const onError = (e: ErrorEvent) => {
      if (!enabled) return;
      sendTelemetry({ type: "error", message: e.message || "Unhandled error", path: pathname });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (!enabled) return;
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "Promise rejection");
      sendTelemetry({ type: "error", message: msg, path: pathname });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      for (const obs of observers) obs.disconnect();
    };
  }, [pathname]);

  return null;
}
