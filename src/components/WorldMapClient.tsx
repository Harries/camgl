"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicWebcam } from "@/lib/types";

export function WorldMapClient({ webcams }: { webcams: PublicWebcam[] }) {
  const [selectedSlug, setSelectedSlug] = useState(webcams[0]?.slug ?? "");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = webcams.filter(
    (w) => catFilter === "all" || w.categories.some((c) => c.slug === catFilter)
  );
  const active = filtered.find((w) => w.slug === selectedSlug) ?? filtered[0] ?? webcams[0];

  const categories = ["all", "city", "beach", "nature", "wildlife", "ski", "volcano", "port"];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Global Live Webcam Map</h1>
          <p className="text-xs text-slate-500">
            Click any marker to preview local weather and open the official live stream
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden min-h-[420px] flex flex-col shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs bg-slate-50 text-slate-500">
            <span>Interactive Marker Map · {filtered.length} active locations</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>
          <div className="relative flex-1 bg-sky-50/40 p-4 flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-auto max-h-[420px] select-none">
              <defs>
                <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1000" height="500" fill="url(#mapgrid)" />
              <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2">
                <path d="M 95 75 L 250 60 L 315 110 L 285 185 L 230 225 L 195 255 L 160 220 L 120 170 L 85 125 Z" />
                <path d="M 245 265 L 315 275 L 355 340 L 310 435 L 270 455 L 250 385 L 235 315 Z" />
                <path d="M 445 75 L 555 65 L 580 120 L 545 160 L 470 165 L 440 130 Z" />
                <path d="M 455 185 L 555 180 L 605 245 L 565 365 L 515 415 L 475 345 L 440 255 Z" />
                <path d="M 565 70 L 820 75 L 875 145 L 835 225 L 745 255 L 650 235 L 585 185 L 565 130 Z" />
                <path d="M 760 325 L 870 320 L 895 395 L 825 425 L 765 390 Z" />
              </g>
              {filtered.map((cam) => {
                const selected = active?.slug === cam.slug;
                return (
                  <g
                    key={cam.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSlug(cam.slug)}
                  >
                    <circle
                      cx={cam.mapX}
                      cy={cam.mapY}
                      r={selected ? 14 : 9}
                      fill="#2563eb"
                      opacity="0.22"
                    />
                    <circle
                      cx={cam.mapX}
                      cy={cam.mapY}
                      r={selected ? 7 : 5}
                      fill={selected ? "#ef4444" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {selected && (
                      <text
                        x={cam.mapX}
                        y={cam.mapY - 14}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#0f172a"
                      >
                        {cam.city.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 shadow-sm">
          {active && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                {active.country.flag} {active.country.name} · {active.city.name}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{active.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3">{active.description}</p>
              <div className="text-xs text-slate-600">{active.weatherSummary}</div>
              <Link
                href={`/webcams/${active.slug}`}
                className="block w-full text-center py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Open Live Stream →
              </Link>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-1.5 max-h-48 overflow-y-auto">
            {filtered.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setSelectedSlug(cam.slug)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between ${
                  active?.slug === cam.slug
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>
                  {cam.city.name}, {cam.country.name}
                </span>
                <span className="text-slate-400">{cam.categories[0]?.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
