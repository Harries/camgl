"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicWebcam } from "@/lib/types";
import { RealMap, type MapBounds } from "./RealMap";
import { CountryFlag } from "./CountryFlag";
import { getSourceTypeMeta, getWebcamPreviewUrl } from "@/lib/source-badge";
import {
  formatMessage,
  getCategoryLabel,
  getCityLabel,
  getCountryLabel,
  getStreamStatusLabel,
  localizePath,
  localizeWeatherSummary,
} from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { WebcamThumbnail } from "./WebcamThumbnail";

export function WorldExplorerClient({ webcams }: { webcams: PublicWebcam[] }) {
  const { locale, messages } = useI18n();
  const tco = messages.countries;
  const tg = messages.grid;
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(webcams[0]?.slug ?? "");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "LIVE">("all");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [focusCoords, setFocusCoords] = useState<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [bboxWebcams, setBboxWebcams] = useState<PublicWebcam[] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const bboxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  useEffect(() => {
    if (!mapBounds) return;
    if (bboxTimerRef.current) clearTimeout(bboxTimerRef.current);
    const controller = new AbortController();
    bboxTimerRef.current = setTimeout(async () => {
      setMapLoading(true);
      try {
        const params = new URLSearchParams({
          bbox: `${mapBounds.minLng.toFixed(4)},${mapBounds.minLat.toFixed(4)},${mapBounds.maxLng.toFixed(4)},${mapBounds.maxLat.toFixed(4)}`,
          zoom: String(mapBounds.zoom),
        });
        if (selectedCountry) params.set("country", selectedCountry);
        if (catFilter !== "all") params.set("category", catFilter);
        if (statusFilter === "LIVE") params.set("status", "LIVE");

        const res = await fetch(`/api/v1/map?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { items?: PublicWebcam[] };
        if (Array.isArray(json.items)) {
          setBboxWebcams(json.items);
        }
      } catch {
        // ignore abort or network error
      } finally {
        setMapLoading(false);
      }
    }, 220);

    return () => {
      if (bboxTimerRef.current) clearTimeout(bboxTimerRef.current);
      controller.abort();
    };
  }, [mapBounds, selectedCountry, catFilter, statusFilter]);

  const countries = useMemo(() => {
    const map = new Map<
      string,
      { name: string; slug: string; flag: string; cities: Set<string>; count: number }
    >();
    for (const w of webcams) {
      const existing = map.get(w.country.slug) ?? {
        name: w.country.name,
        slug: w.country.slug,
        flag: w.country.flag,
        cities: new Set<string>(),
        count: 0,
      };
      existing.cities.add(w.city.slug);
      existing.count += 1;
      map.set(w.country.slug, existing);
    }
    return Array.from(map.values());
  }, [webcams]);

  const citiesInScope = useMemo(() => {
    const source = selectedCountry
      ? webcams.filter((w) => w.country.slug === selectedCountry)
      : webcams;
    const map = new Map<
      string,
      { name: string; slug: string; countrySlug: string; lat: number; lng: number; count: number }
    >();
    for (const w of source) {
      const key = `${w.country.slug}:${w.city.slug}`;
      const existing = map.get(key) ?? {
        name: w.city.name,
        slug: w.city.slug,
        countrySlug: w.country.slug,
        lat: w.city.lat,
        lng: w.city.lng,
        count: 0,
      };
      existing.count += 1;
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [webcams, selectedCountry]);

  const filtered = useMemo(() => {
    const source = bboxWebcams ?? webcams;
    return source.filter((w) => {
      if (selectedCountry && w.country.slug !== selectedCountry) return false;
      if (selectedCity && w.city.slug !== selectedCity) return false;
      if (catFilter !== "all" && !w.categories.some((c) => c.slug === catFilter)) return false;
      if (statusFilter === "LIVE" && (w.stream?.status ?? "LIVE") !== "LIVE") return false;
      return true;
    });
  }, [bboxWebcams, webcams, selectedCountry, selectedCity, catFilter, statusFilter]);

  const activePin = filtered.find((w) => w.slug === selectedSlug) ?? filtered[0] ?? webcams[0];
  const categories = ["all", "city", "beach", "nature", "wildlife", "rail", "ski", "volcano", "port", "airport", "mountain", "landmark"];
  const visibleWebcams = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCountry, selectedCity, catFilter, statusFilter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(filtered.length, prev + 12));
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  function resetAll() {
    setSelectedCountry(null);
    setSelectedCity(null);
    setCatFilter("all");
    setStatusFilter("all");
    setFocusCoords({ lng: 15, lat: 22, zoom: 1.45 });
  }

  function handleSelectCountry(slug: string) {
    if (selectedCountry === slug) {
      resetAll();
    } else {
      setSelectedCountry(slug);
      setSelectedCity(null);
      const firstInCountry = webcams.find((w) => w.country.slug === slug);
      if (firstInCountry) {
        setSelectedSlug(firstInCountry.slug);
        setFocusCoords({ lng: firstInCountry.city.lng, lat: firstInCountry.city.lat, zoom: 4.5 });
      }
    }
  }

  function handleSelectCity(city: {
    slug: string;
    countrySlug: string;
    lat: number;
    lng: number;
  }) {
    const isSame = selectedCity === city.slug;
    setSelectedCountry(city.countrySlug);
    setSelectedCity(isSame ? null : city.slug);
    setFocusCoords(
      isSame
        ? { lng: city.lng, lat: city.lat, zoom: 4.5 }
        : { lng: city.lng, lat: city.lat, zoom: 8 }
    );
  }

  function handleSelectPin(slug: string) {
    setSelectedSlug(slug);
    const cam = webcams.find((w) => w.slug === slug);
    if (cam) {
      setFocusCoords({ lng: cam.city.lng, lat: cam.city.lat, zoom: 6 });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <button onClick={resetAll} className="hover:underline text-slate-700 dark:text-slate-300 font-medium">
              {tco.worldExplorer}
            </button>
            {selectedCountry && (
              <>
                <span>/</span>
                <button
                  onClick={() => setSelectedCity(null)}
                  className="hover:underline text-slate-700 dark:text-slate-300 font-medium capitalize"
                >
                  {getCountryLabel(locale, selectedCountry, selectedCountry.replace(/-/g, " "))}
                </button>
              </>
            )}
            {selectedCity && (
              <>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-semibold capitalize">
                  {getCityLabel(locale, selectedCity, selectedCity.replace(/-/g, " "))}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {tco.heroTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tco.heroSubtitle}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label={tco.allCountries}
              value={selectedCountry ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedCountry(null);
                  setSelectedCity(null);
                  setFocusCoords({ lng: 15, lat: 22, zoom: 1.45 });
                } else {
                  handleSelectCountry(val);
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">{tco.allCountries}</option>
              {countries.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.flag} {getCountryLabel(locale, c.slug, c.name)} ({c.count})
                </option>
              ))}
            </select>
            <select
              aria-label={tco.allStatuses}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "LIVE")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{tco.allStatuses}</option>
              <option value="LIVE">{tco.statusLive}</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-colors ${
                  catFilter === cat
                    ? "bg-blue-600 text-white border-transparent"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {getCategoryLabel(locale, cat, cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-Width Real Map */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
          <span>
            {formatMessage(tco.matchingCameras, { count: filtered.length })}
            {mapLoading ? " · Updating viewport..." : ""}
          </span>
          <span className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {tco.live}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {tco.selected}
            </span>
          </span>
        </div>
        <RealMap
          webcams={filtered}
          selectedSlug={activePin?.slug ?? ""}
          onSelect={handleSelectPin}
          focusCoords={focusCoords}
          onBoundsChange={handleBoundsChange}
        />
      </div>

      {/* Selected Pin Preview Bar */}
      {activePin && (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag isoCode={activePin.country.isoCode} flag={activePin.country.flag} />
                <span>
                  {getCountryLabel(locale, activePin.country.slug, activePin.country.name, activePin.country.isoCode)} ·{" "}
                  {getCityLabel(locale, activePin.city.slug, activePin.city.name)}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-semibold">
                {getStreamStatusLabel(locale, activePin.stream?.status ?? "LIVE")}
              </span>
              <span>{localizeWeatherSummary(activePin.weatherSummary, locale)}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              {activePin.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {activePin.description}
            </p>
          </div>
          <Link
            href={localizePath(`/webcams/${activePin.slug}`, locale)}
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 text-center shadow-sm"
          >
            {tco.openLiveStream}
          </Link>
        </div>
      )}

      {/* Countries Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatMessage(tco.countriesTitle, { count: countries.length })}
          </h2>
          {selectedCountry && (
            <button
              onClick={resetAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {tco.showAllCountries}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {countries.map((ct) => {
            const active = selectedCountry === ct.slug;
            return (
              <button
                key={ct.slug}
                onClick={() => handleSelectCountry(ct.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs border transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                }`}
              >
                <CountryFlag flag={ct.flag} />
                <span className="font-medium">{getCountryLabel(locale, ct.slug, ct.name)}</span>
                <span className={active ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}>
                  ({ct.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cities Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {selectedCountry
              ? formatMessage(tco.citiesIn, {
                  country: getCountryLabel(locale, selectedCountry, selectedCountry.replace(/-/g, " ")),
                })
              : tco.citiesWorldwide}
          </h2>
          {(selectedCountry || selectedCity || catFilter !== "all") && (
            <button
              onClick={resetAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {tco.resetFilters}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {citiesInScope.map((city) => {
            const active = selectedCity === city.slug;
            return (
              <button
                key={`${city.countrySlug}-${city.slug}`}
                onClick={() => handleSelectCity(city)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-blue-500"
                }`}
              >
                <span className="font-medium">{getCityLabel(locale, city.slug, city.name)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                    active ? "bg-white/20 text-white" : "bg-white border border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  {city.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Webcams Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatMessage(tco.matchingWebcams, { count: filtered.length })}
          </h2>
          {selectedCountry && (
            <Link
              href={localizePath(
                selectedCity
                  ? `/countries/${selectedCountry}/${selectedCity}`
                  : `/countries/${selectedCountry}`,
                locale
              )}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {tco.openSeoPage}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleWebcams.map((cam) => (
            <Link
              key={cam.id}
              href={localizePath(`/webcams/${cam.slug}`, locale)}
              className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all shadow-sm flex flex-col"
            >
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <WebcamThumbnail
                  src={getWebcamPreviewUrl(cam.stream)}
                  alt={cam.title}
                  flag={cam.country.flag}
                  subtitle={getCityLabel(locale, cam.city.slug, cam.city.name)}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
                  {getStreamStatusLabel(locale, cam.stream?.status ?? "LIVE")}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CountryFlag isoCode={cam.country.isoCode} flag={cam.country.flag} />
                    <span>
                      {getCountryLabel(locale, cam.country.slug, cam.country.name, cam.country.isoCode)} ·{" "}
                      {getCityLabel(locale, cam.city.slug, cam.city.name)}
                    </span>
                  </span>
                  <span>{cam.weatherSummary}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {cam.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getSourceTypeMeta(cam.stream?.sourceType).badgeClass}`}>
                    {getSourceTypeMeta(cam.stream?.sourceType).label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div ref={sentinelRef} className="flex flex-col items-center justify-center py-4">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(filtered.length, prev + 12))}
              className="px-5 py-2 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {formatMessage(tg.loadMore, { loaded: visibleWebcams.length, total: filtered.length })}
            </button>
          ) : (
            filtered.length > 0 && (
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {formatMessage(tg.showingAll, { count: filtered.length })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
