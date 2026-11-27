"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicWebcam } from "@/lib/types";
import { getWebcamPreviewUrl } from "@/lib/source-badge";
import {
  getCityLabel,
  getCountryLabel,
  getStreamStatusLabel,
  localizePath,
} from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { CountryFlag } from "./CountryFlag";

export function HeroCarousel({ slides }: { slides: PublicWebcam[] }) {
  const { locale, messages } = useI18n();
  const th = messages.home;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, 5500);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const current = slides[safeIndex];
  const preview = getWebcamPreviewUrl(current.stream);

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + count) % count);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % count);
  };

  return (
    <div
      className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white group overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href={localizePath(`/webcams/${current.slug}`, locale)}
        className="absolute inset-0 p-6 flex flex-col justify-between"
      >
        {preview && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={preview}
              alt={current.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
          </>
        )}

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white live-dot" />
            {getStreamStatusLabel(locale, current.stream?.status ?? "LIVE")}
          </span>
          {count > 1 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 backdrop-blur tabular-nums">
              {safeIndex + 1} / {count}
            </span>
          )}
        </div>

        <div className="relative z-10 flex items-end justify-between gap-4 pb-2">
          <div className="min-w-0">
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <CountryFlag isoCode={current.country.isoCode} flag={current.country.flag} />
              <span>
                {getCountryLabel(
                  locale,
                  current.country.slug,
                  current.country.name,
                  current.country.isoCode
                )}{" "}
                · {getCityLabel(locale, current.city.slug, current.city.name)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 line-clamp-2">
              {current.title}
            </h1>
          </div>
          <span className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-slate-900 group-hover:scale-105 transition-transform shrink-0 shadow">
            {th.watchLive}
          </span>
        </div>
      </Link>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous featured webcam"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next featured webcam"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === safeIndex
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
