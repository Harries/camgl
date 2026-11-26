"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PublicWebcam } from "@/lib/types";

function buildGeoJson(webcams: PublicWebcam[], selectedSlug: string) {
  return {
    type: "FeatureCollection" as const,
    features: webcams.map((cam) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [cam.city.lng, cam.city.lat] as [number, number],
      },
      properties: {
        slug: cam.slug,
        title: cam.title,
        selected: cam.slug === selectedSlug ? 1 : 0,
        status: cam.stream?.status ?? "LIVE",
      },
    })),
  };
}

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  zoom: number;
}

export function RealMap({
  webcams,
  selectedSlug,
  onSelect,
  focusCoords,
  onBoundsChange,
}: {
  webcams: PublicWebcam[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  focusCoords?: { lng: number; lat: number; zoom: number } | null;
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const latestDataRef = useRef({ webcams, selectedSlug });
  const onSelectRef = useRef(onSelect);
  const onBoundsChangeRef = useRef(onBoundsChange);

  latestDataRef.current = { webcams, selectedSlug };
  onSelectRef.current = onSelect;
  onBoundsChangeRef.current = onBoundsChange;

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

    map.on("load", () => {
      loadedRef.current = true;
      const { webcams: currentCams, selectedSlug: currentSlug } = latestDataRef.current;

      map.addSource("webcams", {
        type: "geojson",
        data: buildGeoJson(currentCams, currentSlug),
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 44,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "webcams",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#2563eb",
            10,
            "#1d4ed8",
            30,
            "#1e40af",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 21, 30, 26],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "webcams",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "webcams",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "selected"], 1],
            "#ef4444",
            ["!=", ["get", "status"], "LIVE"],
            "#f59e0b",
            "#10b981",
          ],
          "circle-radius": ["case", ["==", ["get", "selected"], 1], 9, 7],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const feature = features[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("webcams") as maplibregl.GeoJSONSource | undefined;
        if (!source || clusterId === undefined) return;
        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
            duration: 500,
          });
        } catch {
          // ignore expansion error
        }
      });

      map.on("click", "unclustered-point", (e) => {
        const slug = e.features?.[0]?.properties?.slug;
        if (typeof slug === "string" && slug) {
          onSelectRef.current(slug);
        }
      });

      for (const layer of ["clusters", "unclustered-point"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      const emitBounds = () => {
        if (!onBoundsChangeRef.current) return;
        const b = map.getBounds();
        onBoundsChangeRef.current({
          minLng: Math.max(-180, b.getWest()),
          minLat: Math.max(-90, b.getSouth()),
          maxLng: Math.min(180, b.getEast()),
          maxLat: Math.min(90, b.getNorth()),
          zoom: Number(map.getZoom().toFixed(2)),
        });
      };

      map.on("moveend", emitBounds);
      emitBounds();
    });

    mapRef.current = map;

    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource("webcams") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildGeoJson(webcams, selectedSlug));
    }
  }, [webcams, selectedSlug]);

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
      className="w-full h-[420px] sm:h-[500px] bg-slate-100 dark:bg-slate-900"
    />
  );
}
