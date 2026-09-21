"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Crosshair, X, Loader2, Check, ArrowRight, Globe2, Search } from "lucide-react";
import { setSectionPlace, clearSectionPlace } from "@/app/actions/setSectionPlace";
import { useCoarsePointer } from "@/lib/useCoarsePointer";
import type { Place } from "./Globe";
import { HANDOFF_WIDTH_M } from "./Globe";

// leaflet reads `window` at module scope, so it cannot be server-rendered
const PlaceMap = dynamic(() => import("./PlaceMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#fdfbf7] text-[#a3907a]">
      <Loader2 size={18} className="animate-spin" />
    </div>
  ),
});

/* Which Leaflet zoom shows the same width of ground the globe was showing
   when it handed over. Web Mercator's scale depends on latitude, so this has
   to be worked out where the viewer actually is, not once for the world. */
function groundZoom(lat: number, widthPx: number) {
  const metresPerPixelAtZ0 = 156543.03392 * Math.cos((lat * Math.PI) / 180);
  const z = Math.log2((widthPx * metresPerPixelAtZ0) / HANDOFF_WIDTH_M);
  return Math.max(2, Math.min(18, Math.round(z)));
}

// three.js has no business in the server bundle
const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[#a3907a]">
      <Loader2 size={22} className="animate-spin" />
    </div>
  ),
});

export type MapAlbum = {
  id: string;
  title: string;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  cover: string | null;
};

/** One match from /api/geocode. */
type GeoHit = { id: string; label: string; lat: number; lng: number };

const coords = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "W"}`;

export default function GlobeView({ albums }: { albums: MapAlbum[] }) {
  const router = useRouter();
  const coarse = useCoarsePointer();   // a phone has no wheel to scroll
  const [activeId, setActiveId] = useState<string | null>(null);
  const [spinTo, setSpinTo] = useState<{ lat: number; lng: number } | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);      // album awaiting a pin
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [saving, startSave] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  // the place search: the field's text is both what is searched and what gets
  // saved, so picking a result simply rewrites it
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const skipSearch = useRef(false);   // set when we rewrote the text ourselves

  /* Zooming past the globe's limit hands over to the flat map, in the same
     round window. `ground` is null while the globe has the view. */
  const [ground, setGround] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [groundShown, setGroundShown] = useState(false);   // drives the fade
  const [returnKey, setReturnKey] = useState(0);
  const shell = useRef<HTMLDivElement>(null);

  const pinned = useMemo(
    () => albums.filter((a): a is MapAlbum & { lat: number; lng: number } => a.lat != null && a.lng != null),
    [albums],
  );
  const unpinned = useMemo(() => albums.filter((a) => a.lat == null || a.lng == null), [albums]);

  // while placing, the draft pin stands in for the album being placed
  const places: Place[] = useMemo(() => {
    const live = pinned.map((a) => ({ id: a.id, title: a.title, placeName: a.placeName, lat: a.lat, lng: a.lng, cover: a.cover }));
    if (placing && draft) {
      const album = albums.find((a) => a.id === placing);
      return [...live.filter((p) => p.id !== placing), { id: placing, title: album?.title ?? "New pin", placeName: placeName || "Dropped pin", lat: draft.lat, lng: draft.lng }];
    }
    return live;
  }, [pinned, placing, draft, placeName, albums]);

  /* Look the typed place up, a beat after typing stops. An in-flight search
     is abandoned when the text changes again, so the answer that lands is
     always the answer to the current question. */
  useEffect(() => {
    if (!placing) return;
    if (skipSearch.current) { skipSearch.current = false; return; }

    const q = placeName.trim();
    if (q.length < 2) { setHits([]); setSearching(false); setSearchNote(null); return; }

    let alive = true;
    const ctl = new AbortController();
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        if (!res.ok) {
          throw new Error(res.status === 429 ? "Too many searches — wait a moment" : "Could not look that place up");
        }
        const { hits: found } = (await res.json()) as { hits: GeoHit[] };
        if (!alive) return;
        setHits(found ?? []);
        setHighlight(-1);
        setOpenList(true);
        setSearchNote((found ?? []).length ? null : "No place found — you can still tap the globe.");
      } catch (err) {
        if (!alive || (err as Error)?.name === "AbortError") return;
        setHits([]);
        setSearchNote(err instanceof Error ? err.message : "Could not look that place up");
      } finally {
        if (alive) setSearching(false);
      }
    }, 350);

    return () => { alive = false; clearTimeout(timer); ctl.abort(); };
  }, [placeName, placing]);

  const stopPlacing = () => {
    setPlacing(null); setDraft(null); setPlaceName("");
    setHits([]); setOpenList(false); setHighlight(-1); setSearchNote(null);
  };

  /* A chosen result drops the pin and flies the globe to it, so the answer is
     visible on the sphere and not just in the field. */
  const pickHit = (h: GeoHit) => {
    skipSearch.current = true;
    setPlaceName(h.label);
    setDraft({ lat: h.lat, lng: h.lng });
    setSpinTo({ lat: h.lat, lng: h.lng });
    setHits([]); setOpenList(false); setHighlight(-1); setSearchNote(null);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openList || hits.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter") { e.preventDefault(); pickHit(hits[highlight >= 0 ? highlight : 0]); }
    else if (e.key === "Escape") { setOpenList(false); }
  };

  const enterGround = (centre: { lat: number; lng: number }) => {
    const width = shell.current?.getBoundingClientRect().width ?? 640;
    setGround({ ...centre, zoom: groundZoom(centre.lat, width) });
    // paint once at zero opacity, then fade, or the transition never runs
    requestAnimationFrame(() => requestAnimationFrame(() => setGroundShown(true)));
  };

  const leaveGround = (centre: { lat: number; lng: number }) => {
    setGroundShown(false);
    setSpinTo({ ...centre });          // the globe comes back looking at the same place
    setReturnKey((k) => k + 1);
    window.setTimeout(() => setGround(null), 320);   // after the fade
  };

  /* A pin is the album. Opening it is the point of having put it there, so
     a click goes to the live view rather than only lighting the pin. */
  const open = (id: string) => router.push(`/share/${id}`);

  const look = (a: { id: string; lat: number; lng: number }) => {
    setActiveId(a.id);
    setSpinTo({ lat: a.lat, lng: a.lng });
  };

  const onPick = (id: string) => {
    if (placing) return;                       // while placing, clicks drop pins
    const a = pinned.find((p) => p.id === id);
    if (a) look(a);
  };

  const save = () => {
    if (!placing || !draft) return;
    startSave(async () => {
      const res = await setSectionPlace({ sectionId: placing, lat: draft.lat, lng: draft.lng, placeName });
      if (!res.ok) return setNote(res.error);
      stopPlacing(); setNote(null);
      router.refresh();
    });
  };

  const remove = (id: string) => startSave(async () => {
    const res = await clearSectionPlace(id);
    if (!res.ok) return setNote(res.error);
    if (activeId === id) setActiveId(null);
    router.refresh();
  });

  /* minmax(0,...) on both breakpoints. A plain auto track refuses to shrink
     below its content's min-content width, which on a phone made the column
     wider than the screen and scrolled the whole page sideways. */
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
      {/* the globe */}
      <div>
        {/* A round window onto the globe.

            The box is square and clipped to a circle. Sitting still that clip
            is invisible — the canvas is transparent and the sphere is already
            round inside it. Zoomed in it is what saves the view: without it
            the magnified map ran into the corners of a rectangle and stopped
            looking like a globe at all. Square also suits the sphere, which
            is sized by whichever side is shorter, so a taller box only ever
            added a band of nothing underneath. */}
        <div ref={shell} className="relative mx-auto aspect-square w-full max-w-[74vh]">
          <Globe
            places={places}
            activeId={activeId}
            spinTo={spinTo}
            onPick={onPick}
            onOpen={placing ? undefined : open}
            onDropPin={placing ? (p) => setDraft(p) : undefined}
            onZoomThrough={placing ? undefined : enterGround}
            returnKey={returnKey}
            className="h-full w-full overflow-hidden rounded-full"
          />

          {/* Past the globe's limit the flat map takes the same window, at a
              matched scale, so the two read as one continuous zoom. */}
          {ground && (
            <div
              className={`absolute inset-0 overflow-hidden rounded-full transition-opacity duration-300 ${groundShown ? "opacity-100" : "opacity-0"}`}
            >
              <PlaceMap
                key={`${ground.lat.toFixed(3)},${ground.lng.toFixed(3)},${ground.zoom}`}
                center={{ lat: ground.lat, lng: ground.lng }}
                zoom={ground.zoom}
                markers={pinned.map((a) => ({
                  id: a.id, lat: a.lat, lng: a.lng,
                  label: a.placeName || a.title, active: a.id === activeId,
                }))}
                onPick={open}
                onExit={leaveGround}
                wheelLive
                className="h-full w-full"
              />
            </div>
          )}
          {/* Shades the rim so the disc still reads as a ball once the map
              has filled it and the silhouette is gone. */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_70px_-26px_rgba(58,42,26,0.55)] ring-1 ring-[#8a755b]/15" />
        </div>

        <p className="mx-auto mt-4 w-fit whitespace-nowrap rounded-full border border-[#e8e0d5] bg-[#fdfbf7] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a755b]">
          {placing
            ? "Search · or tap the globe"
            : ground
              ? "Zoom out to return to the globe"
              : coarse
                ? "Pinch to zoom · keep going for the street map"
                : "Scroll to zoom · keep going for the street map"}
        </p>
      </div>

      {/* the list: a globe only ever shows half the world, so nothing here is
          reachable by spinning alone */}
      <div className="space-y-5">
        {placing ? (
          <div className="rounded-2xl border border-[#c9a24a]/50 bg-[#fdfbf7] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-bold text-[#1c1917]">
                  Where was &ldquo;{albums.find((a) => a.id === placing)?.title}&rdquo;?
                </h3>
                <p className="mt-1 text-xs text-[#8a755b]">
                  {draft ? coords(draft.lat, draft.lng) : "Type the place below, or tap the globe."}
                </p>
              </div>
              <button type="button" onClick={stopPlacing} aria-label="Cancel"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8a755b] transition-colors hover:bg-[#f4eee6] hover:text-[#1c1917]">
                <X size={17} />
              </button>
            </div>

            {/* Type the place and it is found for you. Tapping the globe still
                works, and still fills in whatever name is written here. */}
            <div className="relative mt-4">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3907a]" />
              <input
                value={placeName}
                onChange={(e) => { setPlaceName(e.target.value); setOpenList(true); }}
                onKeyDown={onSearchKey}
                onFocus={() => { if (hits.length) setOpenList(true); }}
                onBlur={() => setTimeout(() => setOpenList(false), 150)}
                maxLength={120}
                autoComplete="off"
                role="combobox"
                aria-expanded={openList && hits.length > 0}
                aria-controls="place-hits"
                aria-autocomplete="list"
                placeholder="Search a place — Jaipur, Paris, Goa…"
                className="w-full rounded-xl border border-[#e8e0d5] bg-[#fcfbf9] py-3 pl-10 pr-10 text-base outline-none transition-colors focus:border-[#1c1917] placeholder:text-[#a3907a]"
              />
              {searching && (
                <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#a3907a]" />
              )}

              {openList && hits.length > 0 && (
                <ul id="place-hits" role="listbox"
                  className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-[#e8e0d5] bg-[#fdfbf7] shadow-[0_18px_40px_-20px_rgba(28,25,23,0.45)]">
                  {hits.map((h, i) => (
                    <li key={h.id} role="option" aria-selected={i === highlight}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => pickHit(h)}
                        className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${i === highlight ? "bg-[#f4eee6]" : ""}`}
                      >
                        <MapPin size={14} className="mt-0.5 shrink-0 text-[#c9a24a]" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#1c1917]">{h.label}</span>
                          <span className="block text-[11px] tabular-nums text-[#a3907a]">{coords(h.lat, h.lng)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {searchNote && <p className="mt-2 text-xs text-[#8a755b]">{searchNote}</p>}
            <button
              type="button" onClick={save} disabled={!draft || saving}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1c1917] px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save this place
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8a755b]">
            <Globe2 size={13} /> {pinned.length} of {albums.length} on the globe
          </div>
        )}

        {note && <p className="text-sm font-medium text-red-700">{note}</p>}

        {pinned.length > 0 && (
          <ul className="space-y-2">
            {pinned.map((a) => (
              <li key={a.id}>
                <div className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-colors ${activeId === a.id ? "border-[#c9a24a] bg-[#fdfbf7]" : "border-[#e8e0d5] bg-[#fcfbf9] hover:border-[#d9cbb8]"}`}>
                  <button type="button" onClick={() => look(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#f4eee6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {a.cover && <img src={a.cover} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#1c1917]">{a.title}</span>
                      <span className="block truncate text-xs text-[#8a755b]">
                        {a.placeName || coords(a.lat, a.lng)}
                      </span>
                    </span>
                  </button>
                  <Link href={`/share/${a.id}`} aria-label={`Open ${a.title}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#8a755b] transition-colors hover:bg-[#f4eee6] hover:text-[#1c1917]">
                    <ArrowRight size={16} />
                  </Link>
                  <button type="button" onClick={() => remove(a.id)} disabled={saving} aria-label={`Remove ${a.title} from the globe`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#a3907a] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                    <X size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {unpinned.length > 0 && !placing && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a3907a]">Not placed yet</p>
            <ul className="space-y-2">
              {unpinned.map((a) => (
                <li key={a.id}>
                  <button
                    type="button" onClick={() => { setPlacing(a.id); setDraft(null); setPlaceName(""); setActiveId(null); }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#d9cbb8] bg-transparent p-2.5 text-left transition-colors hover:border-[#c9a24a] hover:bg-[#fdfbf7]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4eee6] text-[#8a755b]">
                      <MapPin size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1c1917]">{a.title}</span>
                      <span className="block text-xs text-[#8a755b]">Add it to the globe</span>
                    </span>
                    <Crosshair size={15} className="shrink-0 text-[#c9a24a]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {albums.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#e8e0d5] py-10 text-center text-sm text-[#a3907a]">
            Create an album and it will show up here to place.
          </p>
        )}
      </div>
    </div>
  );
}
