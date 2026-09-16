"use client";

import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Heart, Search, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, ArrowRight, Loader2, X, Check,
  Users, Plane, Cake, PartyPopper, Sparkles, Images, Pencil, Link2, Trash2, type LucideIcon,
} from "lucide-react";
import { deleteSection } from "@/app/actions/deleteSection";
import { EASE } from "./motion/Reveal";

/* ───────────── Types (what the home page passes from Prisma) ───────────── */
type Img = { id: string; displayUrl?: string | null; thumbUrl?: string | null; position?: number | null };
export type AlbumSection = {
  id: string;
  title: string;
  description?: string | null;
  purpose?: string | null;
  theme?: string | null;
  createdAt: string | Date;
  images?: Img[];
};

/* ───────────── Purposes: how albums are stored → how they're grouped and shown ───────────── */
type Group = "family" | "travel" | "event" | "other";
type Meta = { label: string; group: Group; Icon: LucideIcon; stock: string; create: string };
const STOCK = {
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  travel: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
  event: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
};
const PURPOSE_META: Record<string, Meta> = {
  family: { label: "Family", group: "family", Icon: Users, stock: STOCK.family, create: "/purpose/family" },
  travel: { label: "Travel", group: "travel", Icon: Plane, stock: STOCK.travel, create: "/purpose/travel" },
  birthday: { label: "Birthday", group: "event", Icon: Cake, stock: "/wishing-tree-bg.jpg", create: "/purpose/birthday" },
  "family-function": { label: "Family Function", group: "event", Icon: Sparkles, stock: STOCK.event, create: "/purpose/family-function" },
  party: { label: "Party", group: "event", Icon: PartyPopper, stock: STOCK.event, create: "/purpose/family-function" },
};
const OTHER: Meta = { label: "Album", group: "other", Icon: Images, stock: STOCK.family, create: "/purpose/family" };
const metaFor = (s: AlbumSection): Meta =>
  PURPOSE_META[s.purpose ?? ""] ?? (s.theme?.includes("birthday") ? PURPOSE_META.birthday : OTHER);

const FILTERS: { value: string; label: string; icon?: LucideIcon; create?: string; empty: string }[] = [
  { value: "all", label: "All Albums", empty: "No memory lanes yet", create: "/purpose/family" },
  { value: "family", label: "Family", empty: "No family albums yet", create: "/purpose/family" },
  { value: "travel", label: "Travel", empty: "No travel albums yet", create: "/purpose/travel" },
  { value: "event", label: "Events", empty: "No event albums yet", create: "/purpose/birthday" },
  { value: "favorites", label: "Favorites", icon: Heart, empty: "No favorites yet" },
];

const SORTS = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A – Z" },
  { value: "photos", label: "Most photos" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

const PAGE = 8;
const FAV_KEY = "memorylane-favorites";

// Card covers only need ~600px; Cloudinary resizes on the fly
function sized(url: string | null | undefined) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_600,c_limit,q_auto,f_auto/");
}

/* ═══════════════════════════ The section ═══════════════════════════
   layout="strip": one horizontal, snap-scrolling row (the home page) with a link to the full page.
   layout="grid":  the full grid with search and sort (the Albums page). */
export default function HomeAlbumList({
  sections, layout = "grid", initialFilter = "all", title = "Your Albums", subtitle = "Little pieces of life that make the big picture beautiful.",
}: { sections: AlbumSection[]; layout?: "strip" | "grid"; initialFilter?: string; title?: string; subtitle?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const isStrip = layout === "strip";
  void pathname;

  const [filter, setFilter] = useState(FILTERS.some((f) => f.value === initialFilter) ? initialFilter : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Favorites live in this browser (no database column for them yet)
  useEffect(() => {
    try { const raw = localStorage.getItem(FAV_KEY); if (raw) setFavorites(new Set(JSON.parse(raw))); } catch { /* private mode etc. */ }
  }, []);
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  };

  // Close menus on outside click / Escape (the card menu renders in a portal, so check it by attribute)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest("[data-album-menu]") && !t.closest("[data-album-menu-button]")) setMenuFor(null);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuFor(null); setSortOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Strip: arrow buttons and edge fades follow the scroll position
  const stripRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const updateArrows = () => {
    const el = stripRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    if (!isStrip) return;
    const el = stripRef.current;
    if (!el) return;
    updateArrows();
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", updateArrows); };
  }, [isStrip, sections.length]);
  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 2, behavior: reduce ? "auto" : "smooth" });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sections.length, family: 0, travel: 0, event: 0, favorites: 0 };
    for (const s of sections) {
      const g = metaFor(s).group;
      if (g in c) c[g] += 1;
      if (favorites.has(s.id)) c.favorites += 1;
    }
    return c;
  }, [sections, favorites]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sections.filter((s) => {
      const m = metaFor(s);
      if (filter === "favorites" && !favorites.has(s.id)) return false;
      if (filter !== "all" && filter !== "favorites" && m.group !== filter) return false;
      if (q && !`${s.title} ${s.description ?? ""} ${m.label}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const time = (s: AlbumSection) => new Date(s.createdAt).getTime();
    return [...list].sort((a, b) => {
      if (sort === "oldest") return time(a) - time(b);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "photos") return (b.images?.length ?? 0) - (a.images?.length ?? 0);
      return time(b) - time(a);
    });
  }, [sections, filter, query, sort, favorites]);

  const shown = expanded || isStrip ? visible : visible.slice(0, PAGE);
  const allShown = filter === "all" && !query.trim() && shown.length === sections.length;
  const activeFilter = FILTERS.find((f) => f.value === filter)!;
  const albumsHref = filter === "all" ? "/albums" : `/albums?filter=${filter}`;

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${id}`);
      setToast("Share link copied");
    } catch {
      setToast("Couldn't copy — try again");
    }
    setMenuFor(null);
  };

  const remove = (id: string) => {
    setDeletingId(id);
    setMenuFor(null);
    startTransition(async () => {
      try {
        const res = await deleteSection(id);
        if (res && "error" in res && res.error) {
          setToast(res.error);
        } else {
          setToast("Album deleted");
          router.refresh();
        }
      } catch {
        setToast("Couldn't delete this album. Please try again.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 w-full">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isStrip ? "border-t border-[#e8e0d5] pt-10 md:pt-12" : ""}`}>
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#1c1917] tracking-tight mb-2">{title}</h2>
          <p className="text-[#5a4d41] text-sm">{subtitle}</p>
        </div>
        {isStrip ? (
          <Link href={albumsHref} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors">
            View all <span className="text-[#8a755b] font-medium">({sections.length})</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : allShown ? (
          <span className="text-sm font-medium text-[#8a755b]">Showing all {sections.length} {sections.length === 1 ? "album" : "albums"}</span>
        ) : (
          <button
            type="button"
            onClick={() => { setFilter("all"); setQuery(""); setExpanded(true); }}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors"
          >
            View all <span className="text-[#8a755b] font-medium">({sections.length})</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      {sections.length > 0 && (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
          {/* Filter pills with a sliding highlight */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setFilter(f.value); setExpanded(false); }}
                  aria-pressed={active}
                  className={`relative shrink-0 px-4 sm:px-5 py-2.5 rounded-full font-semibold text-sm tracking-wide border transition-colors flex items-center gap-2 ${
                    active ? "text-white border-transparent" : "bg-[#fcfbf9] text-[#5a4d41] border-[#e8e0d5] hover:text-[#1c1917] hover:border-[#d9cbb8]"
                  }`}
                >
                  {active && (
                    <motion.span layoutId="album-filter-pill" className="absolute inset-0 rounded-full bg-[#2c241b] shadow-md" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {Icon && <Icon size={14} className={active ? "text-rose-300 fill-rose-300" : "text-rose-500"} />}
                    {f.label}
                    <span className={`text-[11px] font-bold tabular-nums ${active ? "text-white/70" : "text-[#8a755b]"}`}>{counts[f.value] ?? 0}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + sort (full page only) */}
          {!isStrip && <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 xl:flex-none">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a755b] pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setExpanded(false); }}
                placeholder="Search your memories..."
                aria-label="Search albums"
                className="pl-10 pr-10 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-full text-sm font-medium w-full xl:w-72 focus:outline-none focus:ring-2 focus:ring-[#2c241b] transition-shadow placeholder:font-normal [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#8a755b] hover:bg-[#e8e0d5] hover:text-[#1c1917] transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative shrink-0" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                className="px-4 sm:px-5 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-white hover:border-[#d9cbb8] transition-colors"
              >
                {SORTS.find((s) => s.value === sort)?.label}
                <ChevronDown size={14} className={`text-[#8a755b] transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.ul
                    role="listbox"
                    initial={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -4, scale: reduce ? 1 : 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-xl border border-[#e8e0d5] rounded-2xl shadow-xl p-1.5 z-40 origin-top-right"
                  >
                    {SORTS.map((s) => (
                      <li key={s.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={sort === s.value}
                          onClick={() => { setSort(s.value); setSortOpen(false); }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${sort === s.value ? "bg-[#f4eee6] text-[#1c1917]" : "text-[#5a4d41] hover:bg-[#fcfbf9] hover:text-[#1c1917]"}`}
                        >
                          {s.label}
                          {sort === s.value && <Check size={14} />}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>}
        </div>
      )}

      {/* Strip: one row that scrolls sideways */}
      {isStrip ? (
        <div className="relative">
          <div
            ref={stripRef}
            className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12 pb-4 scroll-px-4 sm:scroll-px-6 md:scroll-px-12"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((section, i) => (
                <div key={section.id} data-card className="snap-start shrink-0 w-[82vw] sm:w-[46vw] md:w-[38vw] lg:w-[300px] xl:w-[330px]">
                  <AlbumCard
                    section={section}
                    index={i}
                    reduce={!!reduce}
                    isFavorite={favorites.has(section.id)}
                    onToggleFavorite={() => toggleFavorite(section.id)}
                    menuOpen={menuFor === section.id}
                    onMenu={(open) => setMenuFor(open ? section.id : null)}
                    onCopy={() => copyLink(section.id)}
                    onDelete={() => remove(section.id)}
                    deleting={deletingId === section.id}
                  />
                </div>
              ))}
            </AnimatePresence>
            {/* the row ends with a doorway to the full page */}
            {shown.length > 0 && (
              <Link href={albumsHref} className="snap-start shrink-0 w-[60vw] sm:w-[36vw] md:w-[28vw] lg:w-[220px] rounded-[1.5rem] border-2 border-dashed border-[#e8e0d5] bg-[#fcfbf9] hover:bg-white hover:border-[#d9cbb8] transition-colors flex flex-col items-center justify-center gap-3 text-center p-6 group">
                <span className="w-12 h-12 rounded-full bg-[#f4eee6] flex items-center justify-center text-[#2c241b] transition-transform group-hover:scale-110"><ArrowRight size={20} /></span>
                <span className="font-serif font-bold text-[#1c1917] text-lg">See all albums</span>
                <span className="text-xs text-[#8a755b]">{sections.length} in your collection</span>
              </Link>
            )}
          </div>
          {/* edge fades */}
          <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 md:w-16 bg-gradient-to-r from-[#f8f6f3] to-transparent transition-opacity duration-300 ${canLeft ? "opacity-100" : "opacity-0"}`} />
          <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 md:w-16 bg-gradient-to-l from-[#f8f6f3] to-transparent transition-opacity duration-300 ${canRight ? "opacity-100" : "opacity-0"}`} />
          {/* arrows (desktop) */}
          <button type="button" onClick={() => scrollStrip(-1)} aria-label="Scroll albums left" disabled={!canLeft} className={`hidden md:flex absolute left-0 top-[35%] -translate-x-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d5] shadow-lg items-center justify-center text-[#1c1917] hover:bg-[#fcfbf9] transition-all ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scrollStrip(1)} aria-label="Scroll albums right" disabled={!canRight} className={`hidden md:flex absolute right-0 top-[35%] translate-x-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d5] shadow-lg items-center justify-center text-[#1c1917] hover:bg-[#fcfbf9] transition-all ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}><ChevronRight size={18} /></button>
        </div>
      ) : (
      <>
      {/* Grid */}
      <motion.div layout ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((section, i) => (
            <AlbumCard
              key={section.id}
              section={section}
              index={i}
              reduce={!!reduce}
              isFavorite={favorites.has(section.id)}
              onToggleFavorite={() => toggleFavorite(section.id)}
              menuOpen={menuFor === section.id}
              onMenu={(open) => setMenuFor(open ? section.id : null)}
              onCopy={() => copyLink(section.id)}
              onDelete={() => remove(section.id)}
              deleting={deletingId === section.id}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* More */}
      {!expanded && visible.length > PAGE && (
        <div className="flex justify-center">
          <button type="button" onClick={() => setExpanded(true)} className="px-6 py-3 rounded-full bg-[#fcfbf9] border border-[#e8e0d5] text-sm font-semibold text-[#2c241b] hover:bg-white hover:border-[#d9cbb8] transition-colors">
            Show {visible.length - PAGE} more
          </button>
        </div>
      )}
      </>
      )}

      {/* Empty state */}
      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="py-16 md:py-20 px-6 text-center border-2 border-dashed border-[#e8e0d5] rounded-3xl bg-[#fcfbf9]">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#f4eee6] flex items-center justify-center mb-4">
            {filter === "favorites" ? <Heart size={20} className="text-rose-500" /> : <Images size={20} className="text-[#5a4d41]" />}
          </div>
          <h3 className="text-[#2c241b] font-serif text-2xl font-bold mb-2">
            {query.trim() ? `Nothing matches “${query.trim()}”` : activeFilter.empty}
          </h3>
          <p className="text-[#8a755b] text-sm max-w-sm mx-auto">
            {query.trim()
              ? "Try another word, or clear the search."
              : filter === "favorites"
                ? "Tap the heart on any album to keep it here."
                : "Start a new lane and it will show up here."}
          </p>
          {query.trim() ? (
            <button type="button" onClick={() => setQuery("")} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1c1917] text-white text-sm font-semibold hover:bg-[#3d3329] transition-colors">
              Clear search
            </button>
          ) : activeFilter.create ? (
            <Link href={activeFilter.create} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1c1917] text-white text-sm font-semibold hover:bg-[#3d3329] transition-colors">
              Create one <ArrowRight size={14} />
            </Link>
          ) : null}
        </motion.div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-[#1c1917] text-white text-sm font-semibold shadow-xl flex items-center gap-2"
            role="status"
          >
            <Check size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════ One album card ═══════════════════════════ */
type CardProps = {
  section: AlbumSection; index: number; reduce: boolean; isFavorite: boolean; onToggleFavorite: () => void;
  menuOpen: boolean; onMenu: (open: boolean) => void; onCopy: () => void; onDelete: () => void; deleting: boolean;
};
// forwardRef: AnimatePresence's popLayout mode needs a handle on the element while a card leaves
const AlbumCard = forwardRef<HTMLElement, CardProps>(function AlbumCard(
  { section, index, reduce, isFavorite, onToggleFavorite, menuOpen, onMenu, onCopy, onDelete, deleting }, ref,
) {
  const meta = metaFor(section);
  const Icon = meta.Icon;
  const photoCount = section.images?.length ?? 0;

  // The album's own photos as covers (first three), the stock picture only when it has none
  const covers = useMemo(() => {
    const own = [...(section.images ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((img) => sized(img.thumbUrl || img.displayUrl))
      .filter(Boolean)
      .slice(0, 3);
    return own.length ? own : [meta.stock];
  }, [section.images, meta.stock]);

  // Hovering flicks through the covers
  const [hover, setHover] = useState(false);
  const [cover, setCover] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!hover || covers.length < 2 || reduce) { setCover(0); return; }
    const t = setInterval(() => setCover((c) => (c + 1) % covers.length), 1100);
    return () => clearInterval(t);
  }, [hover, covers.length, reduce]);
  useEffect(() => { if (!menuOpen) setConfirm(false); }, [menuOpen]);

  const date = new Date(section.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: reduce ? 0 : 22, scale: reduce ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: reduce ? 0.2 : 0.55, delay: Math.min(index, 8) * 0.05, ease: EASE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative flex flex-col bg-[#fcfbf9] rounded-[1.5rem] border border-[#e8e0d5] transition-shadow duration-500 hover:shadow-[0_24px_50px_-16px_rgba(28,25,23,0.22)] ${deleting ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Cover */}
      <Link href={`/share/${section.id}`} className="relative aspect-[4/3] w-full overflow-hidden block rounded-t-[1.5rem] bg-[#e8e0d5]">
        {covers.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === 0 ? section.title : ""}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] ${i === cover ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />

        {/* purpose badge */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[#2c241b] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 shadow-sm">
          <Icon size={11} /> {meta.label}
        </span>

        {/* cover dots while flicking */}
        {covers.length > 1 && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {covers.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === cover ? "bg-white" : "bg-white/40"}`} />)}
          </span>
        )}

        {photoCount === 0 && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-100/95 text-amber-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 shadow-sm">Draft</span>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide"><Images size={12} /> {photoCount === 0 ? "No photos yet" : `${photoCount} ${photoCount === 1 ? "Photo" : "Photos"}`}</span>
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300" />
        </div>
      </Link>

      {/* favourite */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition-all duration-300 ${isFavorite ? "bg-white text-rose-500" : "bg-white/80 text-[#2c241b] hover:bg-white hover:text-rose-500"}`}
      >
        <motion.span animate={isFavorite && !reduce ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} className="flex">
          <Heart size={16} className={isFavorite ? "fill-rose-500" : ""} />
        </motion.span>
      </button>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/share/${section.id}`} className="min-w-0">
            <h3 className="font-serif font-bold text-[#1c1917] text-lg leading-tight hover:text-[#8a755b] transition-colors line-clamp-2">{section.title}</h3>
          </Link>

          {/* menu */}
          <div className="relative shrink-0">
            <button
              ref={menuBtn}
              data-album-menu-button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMenu(!menuOpen); }}
              aria-label="Album actions"
              aria-expanded={menuOpen}
              className={`w-9 h-9 -mt-1.5 -mr-1.5 rounded-full flex items-center justify-center transition-colors ${menuOpen ? "bg-[#e8e0d5] text-[#1c1917]" : "text-[#8a755b] hover:text-[#1c1917] hover:bg-[#e8e0d5]"}`}
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={18} className="rotate-90" />}
            </button>
            <PortalMenu open={menuOpen} anchor={menuBtn} reduce={reduce} onClose={() => onMenu(false)}>
                  {confirm ? (
                    <div className="p-2">
                      <p className="text-sm font-semibold text-[#1c1917] mb-1">Delete this album?</p>
                      <p className="text-xs text-[#8a755b] mb-3">Its photos and notes go with it. This can&apos;t be undone.</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={onDelete} className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">Delete</button>
                        <button type="button" onClick={() => setConfirm(false)} className="flex-1 px-3 py-2 rounded-xl bg-[#f4eee6] text-[#2c241b] text-xs font-bold hover:bg-[#e8e0d5] transition-colors">Keep</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/section/${section.id}`} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#1c1917] hover:bg-[#fcfbf9] transition-colors">
                        <Pencil size={15} className="text-[#8a755b]" /> Edit album
                      </Link>
                      <button type="button" onClick={onCopy} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#1c1917] hover:bg-[#fcfbf9] transition-colors text-left">
                        <Link2 size={15} className="text-[#8a755b]" /> Copy share link
                      </button>
                      <div className="h-px bg-[#e8e0d5] my-1 mx-2" />
                      <button type="button" onClick={() => setConfirm(true)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                        <Trash2 size={15} /> Delete
                      </button>
                    </>
                  )}
            </PortalMenu>
          </div>
        </div>

        <p className="text-[#5a4d41] text-xs leading-relaxed line-clamp-2 mb-5">
          {photoCount === 0
            ? "No photos yet. Add some, or this draft is removed automatically."
            : section.description || "These are some of my favorite moments — little pieces of life that make the big picture beautiful."}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#8a755b] uppercase tracking-widest">{date}</span>
          <Link href={`/section/${section.id}`} className="text-xs font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors inline-flex items-center gap-1">
            Edit <Pencil size={11} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
});

/* ═══════════════════════════ Card menu in a portal ═══════════════════════════
   The strip is a scroll container, which clips anything hanging below a card. The menu
   is rendered at the document level and positioned next to its button instead, and it
   closes on scroll or resize so it never drifts away from the card. */
function PortalMenu({ open, anchor, reduce, onClose, children }: {
  open: boolean; anchor: React.RefObject<HTMLButtonElement>; reduce: boolean; onClose: () => void; children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const W = 208, H = 170, GAP = 8;

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const up = r.bottom + GAP + H > window.innerHeight && r.top - GAP - H > 0;
      const left = Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8));
      setPos({ top: up ? r.top - GAP : r.bottom + GAP, left, up });
    };
    place();
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open, anchor, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          data-album-menu
          initial={{ opacity: 0, y: reduce ? 0 : (pos.up ? 6 : -6), scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : (pos.up ? 4 : -4), scale: reduce ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: W, transform: pos.up ? "translateY(-100%)" : undefined, transformOrigin: pos.up ? "bottom right" : "top right" }}
          className="bg-white/95 backdrop-blur-xl border border-[#e8e0d5] rounded-2xl shadow-xl p-1.5 z-[120]"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
