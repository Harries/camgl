"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicWebcam } from "@/lib/types";
import { RealMap } from "./RealMap";

export function WorldExplorerClient({ webcams }: { webcams: PublicWebcam[] }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(webcams[0]?.slug ?? "");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [focusCoords, setFocusCoords] = useState<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>(null);

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
    return webcams.filter((w) => {
      if (selectedCountry && w.country.slug !== selectedCountry) return false;
      if (selectedCity && w.city.slug !== selectedCity) return false;
      if (catFilter !== "all" && !w.categories.some((c) => c.slug === catFilter)) return false;
      return true;
    });
  }, [webcams, selectedCountry, selectedCity, catFilter]);

  const activePin = filtered.find((w) => w.slug === selectedSlug) ?? filtered[0] ?? webcams[0];
  const categories = ["all", "city", "beach", "nature", "wildlife", "rail", "ski", "volcano", "port"];

  function resetAll() {
    setSelectedCountry(null);
    setSelectedCity(null);
    setCatFilter("all");
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <button onClick={resetAll} className="hover:underline text-slate-700 font-medium">
              World Explorer
            </button>
            {selectedCountry && (
              <>
                <span>/</span>
                <button
                  onClick={() => setSelectedCity(null)}
                  className="hover:underline text-slate-700 font-medium capitalize"
                >
                  {selectedCountry.replace(/-/g, " ")}
                </button>
              </>
            )}
            {selectedCity && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-semibold capitalize">
                  {selectedCity.replace(/-/g, " ")}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Explore by Map, Country &amp; City
          </h1>
          <p className="text-xs text-slate-500">
            Zoom, pan, or click any map marker, country, or city to filter live streams.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-colors ${
                catFilter === cat
                  ? "bg-blue-600 text-white border-transparent"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Real Map + Active Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs bg-slate-50 text-slate-500">
            <span>MapLibre GL · {filtered.length} matching cameras</span>
            <span className="inline-flex items-center gap-3 text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Live
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Selected
              </span>
            </span>
          </div>
          <RealMap
            webcams={filtered}
            selectedSlug={activePin?.slug ?? ""}
            onSelect={handleSelectPin}
            focusCoords={focusCoords}
          />
        </div>

        {/* Selected Pin Preview + Countries Quick List */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 shadow-sm">
          {activePin ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {activePin.country.flag} {activePin.country.name} · {activePin.city.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
                  {activePin.stream?.status ?? "LIVE"}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-900">{activePin.title}</h2>
              <p className="text-xs text-slate-500 line-clamp-3">{activePin.description}</p>
              <div className="text-xs text-slate-600">{activePin.weatherSummary}</div>
              <Link
                href={`/webcams/${activePin.slug}`}
                className="block w-full text-center py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Open Live Stream →
              </Link>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No cameras match this filter.</div>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-xs font-medium text-slate-500">Countries ({countries.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((ct) => {
                const active = selectedCountry === ct.slug;
                return (
                  <button
                    key={ct.slug}
                    onClick={() => handleSelectCountry(ct.slug)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors flex items-center gap-1 ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{ct.flag}</span>
                    <span>{ct.name}</span>
                    <span className={active ? "text-blue-100" : "text-slate-400"}>
                      ({ct.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cities Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Cities {selectedCountry ? `in ${selectedCountry.replace(/-/g, " ")}` : "Worldwide"}
          </h2>
          {(selectedCountry || selectedCity || catFilter !== "all") && (
            <button
              onClick={resetAll}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Reset all filters
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
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-300"
                }`}
              >
                <span className="font-medium">{city.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                    active ? "bg-white/20 text-white" : "bg-white border border-slate-200 text-slate-500"
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
          <h2 className="text-sm font-semibold text-slate-900">
            Matching Live Webcams ({filtered.length})
          </h2>
          {selectedCountry && (
            <Link
              href={
                selectedCity
                  ? `/countries/${selectedCountry}/${selectedCity}`
                  : `/countries/${selectedCountry}`
              }
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Open SEO directory page →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cam) => (
            <Link
              key={cam.id}
              href={`/webcams/${cam.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all shadow-sm flex flex-col"
            >
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-2xl mb-1">{cam.country.flag}</div>
                  <div className="text-xs opacity-80">{cam.city.name}</div>
                </div>
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
                  {cam.stream?.status ?? "LIVE"}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {cam.country.flag} {cam.country.name} · {cam.city.name}
                  </span>
                  <span>{cam.weatherSummary}</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {cam.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
