"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PublicWebcam } from "@/lib/types";

export function RealMap({
  webcams,
  selectedSlug,
  onSelect,
  focusCoords,
}: {
  webcams: PublicWebcam[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  focusCoords?: { lng: number; lat: number; zoom: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [15, 22],
      zoom: 1.45,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const cam of webcams) {
      const isSelected = cam.slug === selectedSlug;
      const el = document.createElement("button");
      el.type = "button";
      el.title = `${cam.title} (${cam.city.name}, ${cam.country.name})`;
      el.style.width = isSelected ? "18px" : "14px";
      el.style.height = isSelected ? "18px" : "14px";
      el.style.borderRadius = "9999px";
      el.style.backgroundColor = isSelected ? "#ef4444" : "#10b981";
      el.style.border = "2.5px solid #ffffff";
      el.style.boxShadow = isSelected
        ? "0 0 0 5px rgba(37,99,235,0.28), 0 2px 6px rgba(0,0,0,0.3)"
        : "0 2px 5px rgba(0,0,0,0.28)";
      el.style.cursor = "pointer";
      el.style.transition = "transform 150ms ease";

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(cam.slug);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cam.city.lng, cam.city.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [webcams, selectedSlug, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCoords) return;
    map.flyTo({
      center: [focusCoords.lng, focusCoords.lat],
      zoom: focusCoords.zoom,
      duration: 900,
    });
  }, [focusCoords]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[380px] sm:h-[420px] bg-slate-100"
    />
  );
}
