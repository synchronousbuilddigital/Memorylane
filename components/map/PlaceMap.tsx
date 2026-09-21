"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";

/* The ground half of the map.

   The globe carries the view from orbit down to about 1,950km across, which
   is all its baked texture holds. Below that this takes over: real tiles,
   real streets, real names. They are two components because their
   projections are two: tiles are Web Mercator, the globe's texture is
   equirectangular, and the two agree nowhere but the equator — so tiles
   cannot simply be pasted onto the sphere.

   The seam is hidden by handing over at a matched scale, so scrolling through
   it reads as one continuous zoom rather than a swap.

   Leaflet reaches for `window` at module scope, so every caller must load
   this through a dynamic import with ssr: false. */

export type MapMarker = { id: string; lat: number; lng: number; label: string; active?: boolean };

export type PlaceMapProps = {
  center: { lat: number; lng: number };
  zoom: number;
  markers?: MapMarker[];
  /** Zooming out past `zoom` is the request for the globe back. */
  onExit?: (centre: { lat: number; lng: number }) => void;
  onPick?: (id: string) => void;
  /** True when the viewer arrived by scrolling, so the wheel is already theirs. */
  wheelLive?: boolean;
  className?: string;
};

/* Both are public by necessity: the browser fetches tiles itself, so a
   provider key in the URL is visible in the network tab wherever it is kept.
   Providers expect that and scope keys by domain in their dashboard, which is
   the protection that actually works — not secrecy.

   Unset, this falls back to OpenStreetMap's own tile server, which needs no
   key and is right for local work. Their usage policy does not allow a
   deployed app, so set a provider before going live. */
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || OSM_URL;
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || OSM_ATTRIBUTION;
const usingOsmFallback = TILE_URL === OSM_URL;

if (typeof window !== "undefined" && usingOsmFallback && process.env.NODE_ENV === "production") {
  console.warn(
    "[PlaceMap] No tile provider configured, so this build is using OpenStreetMap's " +
    "public tile server. Its usage policy does not permit a deployed app. " +
    "Set NEXT_PUBLIC_MAP_TILE_URL (and NEXT_PUBLIC_MAP_TILE_ATTRIBUTION) to a provider.",
  );
}

/* Tiles arrive in OpenStreetMap's own palette — near-white land, bright blue
   water — which next to the parchment globe looked like a different product
   the moment the view handed over.

   The fix is a per-channel scale, not a hue rotation. Measuring the globe's
   own colours against the tiles', land wants (x0.95, x0.90, x0.81) and water
   wants (x0.92, x0.88, x0.81) — near enough the same multiply for both. That
   is why sepia and hue-rotate did worse than nothing: they push every colour
   towards one hue, flattening the difference between sea and land, where a
   multiply keeps it and only warms the whole thing.

   Done as an SVG matrix rather than a CSS filter because CSS has no
   per-channel multiply, and applied to the tile pane alone so the pins and
   the controls keep the site's real colours. sRGB interpolation is set
   explicitly: SVG filters work in linear light by default, which would not
   be the space the numbers were measured in. */
const TINT_ID = "memory-lane-parchment-tiles";

const dot = (active?: boolean) =>
  '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:' +
  (active ? "#c9a24a" : "#6b4423") +
  ';border:3px solid #1c1917;box-shadow:0 2px 6px rgba(28,25,23,.45)"></span>';

export default function PlaceMap({
  center, zoom, markers = [], onExit, onPick, wheelLive = false, className,
}: PlaceMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [failed, setFailed] = useState(false);

  /* Callbacks are reached through refs so a parent re-rendering with new
     function identities cannot tear the map down and rebuild it. */
  const exitRef = useRef(onExit);
  const pickRef = useRef(onPick);
  exitRef.current = onExit;
  pickRef.current = onPick;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    let leaving = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !host.current) return;

        /* Leaflet parks its controls and attribution in the corners, which
           this map does not have — it is clipped to a circle, so anything in
           a corner is cut off. Both are switched off here and drawn below,
           inside the circle. The attribution is not decoration: OSM's licence
           requires it to be visible. */
        map = L.map(el, {
          center: [center.lat, center.lng],
          zoom,
          minZoom: 2,
          scrollWheelZoom: wheelLive,
          zoomControl: false,
          attributionControl: false,
        });
        mapRef.current = map;

        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

        const tiles = map.getPane("tilePane");
        if (tiles) tiles.style.filter = `url(#${TINT_ID})`;

        /* Leaflet's default marker is a PNG resolved relative to its CSS,
           which a bundler rewrites and breaks. A divIcon needs no asset and
           lets these pins match the ones on the globe. */
        for (const m of markers) {
          L.marker([m.lat, m.lng], {
            title: m.label,
            alt: m.label,
            icon: L.divIcon({ className: "", iconSize: [16, 16], iconAnchor: [8, 8], html: dot(m.active) }),
          })
            .addTo(map)
            .on("click", () => pickRef.current?.(m.id));
        }

        // zooming back out past where the globe handed over asks for it back
        map.on("zoomend", () => {
          if (!map || leaving) return;
          if (map.getZoom() >= zoom) return;
          leaving = true;

          /* From here the parent is winding this map down. Freeze it first:
             any gesture that started a fresh zoom in the meantime would still
             be animating when the map is torn down, and Leaflet's
             transition-end handler would then reach for panes that no longer
             exist. */
          map.dragging.disable();
          map.scrollWheelZoom.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();

          const c = map.getCenter();
          exitRef.current?.({ lat: c.lat, lng: c.lng });
        });

        // arriving any other way, the wheel stays the page's until clicked
        if (!wheelLive) {
          map.on("click", () => map?.scrollWheelZoom.enable());
          map.on("mouseout", () => map?.scrollWheelZoom.disable());
        }
      } catch (err) {
        console.error("PlaceMap could not start:", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      if (!map) return;

      /* Tearing a Leaflet map down mid-animation throws: remove() deletes
         _mapPane, and a zoom transition still in flight fires afterwards
         into _move(), which reads the pane that has just gone —
         "Cannot read properties of undefined (reading '_leaflet_pos')".
         Leaflet guards that handler on _animatingZoom, so clearing the flag
         is what makes the late event harmless. A remount from Fast Refresh
         hits this same path, which is why it must be safe and not merely
         unlikely. */
      map.off();
      map.stop();
      (map as unknown as { _animatingZoom?: boolean })._animatingZoom = false;
      map.remove();
    };
    // built once per entry; the parent remounts it with a key to recentre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#fdfbf7] text-sm text-[#8a755b] ${className ?? ""}`}>
        The map could not be loaded.
      </div>
    );
  }

  const step = "flex h-9 w-9 items-center justify-center bg-[#fdfbf7] text-[#1c1917] transition-colors hover:bg-[#f4eee6] disabled:opacity-40";

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <filter id={TINT_ID} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.945 0 0 0 0
                    0 0.901 0 0 0
                    0 0 0.809 0 0
                    0 0 0 1 0"
          />
        </filter>
      </svg>

      <div ref={host} className="h-full w-full" />

      {/* kept well inside the circle, where a corner would be clipped away */}
      <div className="absolute left-[7%] top-1/2 z-[500] -translate-y-1/2 overflow-hidden rounded-xl border border-[#e8e0d5] shadow-sm">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className={`${step} border-b border-[#e8e0d5]`}>
          <Plus size={15} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className={step}>
          <Minus size={15} />
        </button>
      </div>

      <p
        className="pointer-events-auto absolute bottom-[7%] left-1/2 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#fdfbf7]/90 px-3 py-1 text-[10px] text-[#5a4d41] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: TILE_ATTRIBUTION }}
      />
    </div>
  );
}
