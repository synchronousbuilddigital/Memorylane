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
import { setSharing } from "@/app/actions/shareSection";
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
  linkedToId?: string | null;
  isPublic?: boolean | null;
  shareSlug?: string | null;
};

/* ───────────── Purposes: how albums are stored → how they're grouped and shown ───────────── */
type Group = "family" | "travel" | "event" | "other";
type Meta = { label: string; group: Group; Icon: LucideIcon; stock: string; create: string };
const STOCK = {
  family: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  travel: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1",
  event: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511795409834-ef04bbd61622",
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

  const copyLink = async (section: AlbumSection) => {
    setMenuFor(null);
    try {
      let slug = section.shareSlug;
      let live = !!section.isPublic;

      // an album that has never been shared gets a link the moment one is asked for
      if (!live || !slug) {
        const res = await setSharing(section.id, true);
        if (!res.ok) return setToast(res.error);
        slug = res.shareSlug;
        live = res.isPublic;
        router.refresh();
      }
      if (!slug) return setToast("Couldn't create a link — try again");

      await navigator.clipboard.writeText(`${window.location.origin}/share/${slug}`);
      setToast(section.isPublic ? "Share link copied" : "Sharing turned on — link copied");
    } catch {
      setToast("Couldn't copy — try again");
    }
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
            className="flex gap-6 md:gap-8 items-start overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12 pt-6 pb-6 scroll-px-4 sm:scroll-px-6 md:scroll-px-12"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((section, i) => (
                <div key={section.id} data-card className="snap-start shrink-0 w-[74vw] sm:w-[44vw] md:w-[33vw] lg:w-[264px] xl:w-[284px]">
                  <PolaroidCard
                    section={section}
                    index={i}
                    reduce={!!reduce}
                    isFavorite={favorites.has(section.id)}
                    onToggleFavorite={() => toggleFavorite(section.id)}
                    menuOpen={menuFor === section.id}
                    onMenu={(open) => setMenuFor(open ? section.id : null)}
                    onCopy={() => copyLink(section)}
                    onDelete={() => remove(section.id)}
                    deleting={deletingId === section.id}
                  />
                </div>
              ))}
            </AnimatePresence>
            {/* the row ends with a doorway to the full page */}
            {shown.length > 0 && (
              <Link
                href={albumsHref}
                className="group relative snap-start shrink-0 w-[60vw] sm:w-[34vw] md:w-[26vw] lg:w-[212px] self-start bg-[#fdfbf7] p-3 pb-[6.6rem] rounded-sm border border-dashed border-[#d9cbb8] shadow-[0_10px_30px_rgba(28,25,23,0.10)] rotate-[1.6deg] hover:rotate-0 hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="aspect-square w-full bg-[#f4eee6] flex flex-col items-center justify-center gap-3 text-center px-4">
                  <span className="w-11 h-11 rounded-full bg-[#fdfbf7] border border-[#e8e0d5] flex items-center justify-center text-[#2c241b] transition-transform duration-500 group-hover:translate-x-1"><ArrowRight size={18} /></span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a755b]">{sections.length} in your collection</span>
                </div>
                <span className="absolute inset-x-3 bottom-[2.6rem] h-[3.6rem] flex items-center justify-center text-center font-handwriting text-[1.45rem] leading-[1.15] text-[#2c241b]">See them all ♡</span>
              </Link>
            )}
          </div>
          {/* edge fades */}
          <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-10 md:w-16 bg-gradient-to-r from-[#f8f6f3] to-transparent transition-opacity duration-300 ${canLeft ? "opacity-100" : "opacity-0"}`} />
          <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-10 md:w-16 bg-gradient-to-l from-[#f8f6f3] to-transparent transition-opacity duration-300 ${canRight ? "opacity-100" : "opacity-0"}`} />
          {/* arrows (desktop) */}
          <button type="button" onClick={() => scrollStrip(-1)} aria-label="Scroll albums left" disabled={!canLeft} className={`hidden md:flex absolute left-0 top-[35%] -translate-x-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d5] shadow-lg items-center justify-center text-[#1c1917] hover:bg-[#fcfbf9] transition-all ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scrollStrip(1)} aria-label="Scroll albums right" disabled={!canRight} className={`hidden md:flex absolute right-0 top-[35%] translate-x-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d5] shadow-lg items-center justify-center text-[#1c1917] hover:bg-[#fcfbf9] transition-all ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}><ChevronRight size={18} /></button>
        </div>
      ) : (
      <>
      {/* Editorial list */}
      <motion.div layout ref={listRef} className="w-full border-t border-[#e8e0d5]">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((section, i) => (
            <ListRow
              key={section.id}
              section={section}
              index={i}
              reduce={!!reduce}
              isFavorite={favorites.has(section.id)}
              onToggleFavorite={() => toggleFavorite(section.id)}
              menuOpen={menuFor === section.id}
              onMenu={(open) => setMenuFor(open ? section.id : null)}
              onCopy={() => copyLink(section)}
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

/* ═══════════════════════════ Shared per-album bits ═══════════════════════════ */
type CardProps = {
  section: AlbumSection; index: number; reduce: boolean; isFavorite: boolean; onToggleFavorite: () => void;
  menuOpen: boolean; onMenu: (open: boolean) => void; onCopy: () => void; onDelete: () => void; deleting: boolean;
};

// The album's own photos (first few); the stock picture only when it has none
function useCovers(section: AlbumSection, stock: string, count: number) {
  return useMemo(() => {
    const own = [...(section.images ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((img) => sized(img.thumbUrl || img.displayUrl))
      .filter(Boolean)
      .slice(0, count);
    return own.length ? own : [stock];
  }, [section.images, stock, count]);
}

function useMenuState(menuOpen: boolean) {
  const [confirm, setConfirm] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!menuOpen) setConfirm(false); }, [menuOpen]);
  return { confirm, setConfirm, menuBtn };
}

/* The contents of the ⋮ menu, shared by both presentations */
function MenuBody({ section, confirm, setConfirm, onCopy, onDelete }: {
  section: AlbumSection; confirm: boolean; setConfirm: (v: boolean) => void; onCopy: () => void; onDelete: () => void;
}) {
  if (confirm) {
    return (
      <div className="p-2">
        <p className="text-sm font-semibold text-[#1c1917] mb-1">Delete this album?</p>
        <p className="text-xs text-[#8a755b] mb-3">Its photos and notes go with it. This can&apos;t be undone.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onDelete} className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">Delete</button>
          <button type="button" onClick={() => setConfirm(false)} className="flex-1 px-3 py-2 rounded-xl bg-[#f4eee6] text-[#2c241b] text-xs font-bold hover:bg-[#e8e0d5] transition-colors">Keep</button>
        </div>
      </div>
    );
  }
  return (
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
  );
}

function FavouriteButton({ isFavorite, reduce, onToggle, className }: { isFavorite: boolean; reduce: boolean; onToggle: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={className}
    >
      <motion.span animate={isFavorite && !reduce ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} className="flex">
        <Heart size={16} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
      </motion.span>
    </button>
  );
}

const shortDate = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ═══════════════════════════ Home strip: a polaroid print ═══════════════════════════
   A photo in a cream border with a handwritten title, a strip of tape and a slight
   tilt — the same language as the hero. Hover straightens and lifts it. */
const TILTS = [-2.4, 1.7, -1.1, 2.3, -1.9, 1.2, -2.6, 0.9];
const TAPE = [-4, 3, -2, 5, -3, 2];

const PolaroidCard = forwardRef<HTMLElement, CardProps>(function PolaroidCard(
  { section, index, reduce, isFavorite, onToggleFavorite, menuOpen, onMenu, onCopy, onDelete, deleting }, ref,
) {
  const meta = metaFor(section);
  const Icon = meta.Icon;
  const photoCount = section.images?.length ?? 0;
  const covers = useCovers(section, meta.stock, 3);
  const { confirm, setConfirm, menuBtn } = useMenuState(menuOpen);
  const [hover, setHover] = useState(false);
  const [cover, setCover] = useState(0);
  const tilt = TILTS[index % TILTS.length];

  useEffect(() => {
    if (!hover || covers.length < 2 || reduce) { setCover(0); return; }
    const t = setInterval(() => setCover((c) => (c + 1) % covers.length), 1100);
    return () => clearInterval(t);
  }, [hover, covers.length, reduce]);

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: reduce ? 0 : 26, rotate: reduce ? 0 : tilt }}
      animate={{ opacity: 1, y: 0, rotate: reduce ? 0 : tilt }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      whileHover={reduce ? undefined : { rotate: 0, y: -10 }}
      transition={{ duration: reduce ? 0.2 : 0.55, delay: Math.min(index, 8) * 0.05, ease: EASE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative bg-[#fdfbf7] p-3 pb-[6.6rem] rounded-sm border border-[#e8e0d5] shadow-[0_14px_34px_rgba(28,25,23,0.16)] hover:shadow-[0_26px_54px_rgba(28,25,23,0.26)] transition-shadow duration-500 ${deleting ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* tape */}
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 w-16 h-7 bg-[#f4ead5]/85 backdrop-blur-sm border border-white/40 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
        style={{ transform: `translateX(-50%) rotate(${TAPE[index % TAPE.length]}deg)` }}
      />

      {/* the print */}
      <Link href={`/share/${section.id}`} className="relative block aspect-square w-full overflow-hidden bg-[#e8e0d5]">
        {covers.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === 0 ? section.title : ""}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${i === cover ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#fdfbf7]/92 text-[#2c241b] text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-1 shadow-sm">
          <Icon size={10} /> {meta.label}
        </span>
        {photoCount === 0 && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-100/95 text-amber-800 text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-1 shadow-sm">Draft</span>
        )}

        {covers.length > 1 && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {covers.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === cover ? "bg-white" : "bg-white/40"}`} />)}
          </span>
        )}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
          <Images size={11} /> {photoCount === 0 ? "No photos yet" : photoCount}
        </span>
      </Link>

      <FavouriteButton
        isFavorite={isFavorite}
        reduce={reduce}
        onToggle={onToggleFavorite}
        className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition-colors duration-300 ${isFavorite ? "bg-[#fdfbf7] text-rose-500" : "bg-[#fdfbf7]/80 text-[#2c241b] hover:bg-[#fdfbf7] hover:text-rose-500"}`}
      />

      {/* the written margin */}
      <div className="absolute inset-x-3 bottom-3">
        <Link href={`/share/${section.id}`} className="flex h-[3.6rem] items-center justify-center overflow-hidden">
          <h3 className="font-handwriting text-[1.45rem] leading-[1.15] text-[#2c241b] text-center line-clamp-2 hover:text-[#8a755b] transition-colors">
            {section.title}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[9px] font-bold text-[#a3907a] uppercase tracking-[0.16em]">{shortDate(section.createdAt)}</span>
          <button
            ref={menuBtn}
            data-album-menu-button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMenu(!menuOpen); }}
            aria-label="Album actions"
            aria-expanded={menuOpen}
            className={`w-7 h-7 -mr-1 rounded-full flex items-center justify-center transition-colors ${menuOpen ? "bg-[#e8e0d5] text-[#1c1917]" : "text-[#a3907a] hover:text-[#1c1917] hover:bg-[#f4eee6]"}`}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={16} className="rotate-90" />}
          </button>
          <PortalMenu open={menuOpen} anchor={menuBtn} reduce={reduce} onClose={() => onMenu(false)}>
            <MenuBody section={section} confirm={confirm} setConfirm={setConfirm} onCopy={onCopy} onDelete={onDelete} />
          </PortalMenu>
        </div>
      </div>
    </motion.article>
  );
});

/* ═══════════════════════════ Albums page: an editorial row ═══════════════════════════
   No card, no panel — a hairline rule, the title set large, and a strip of the album's
   own thumbnails on the right. */
const ListRow = forwardRef<HTMLElement, CardProps>(function ListRow(
  { section, index, reduce, isFavorite, onToggleFavorite, menuOpen, onMenu, onCopy, onDelete, deleting }, ref,
) {
  const meta = metaFor(section);
  const Icon = meta.Icon;
  const photoCount = section.images?.length ?? 0;
  const covers = useCovers(section, meta.stock, 5);
  const { confirm, setConfirm, menuBtn } = useMenuState(menuOpen);

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: reduce ? 0.2 : 0.5, delay: Math.min(index, 10) * 0.035, ease: EASE }}
      className={`group relative border-b border-[#e8e0d5] transition-colors duration-300 hover:bg-[#fcfbf9] ${deleting ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 py-6 md:py-7 px-2 md:px-4">
        {/* words */}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a3907a] mb-2">
            <Icon size={11} /> {meta.label}
            {photoCount === 0 && <span className="ml-2 text-amber-700">· Draft</span>}
          </span>
          <Link href={`/share/${section.id}`} className="block">
            <h3 className="font-serif font-black text-[#1c1917] text-2xl md:text-[1.9rem] leading-[1.1] tracking-tight transition-transform duration-300 md:group-hover:translate-x-1">
              {section.title}
            </h3>
          </Link>
          <p className="text-[#5a4d41] text-sm leading-relaxed mt-1.5 line-clamp-1 max-w-xl">
            {photoCount === 0
              ? "No photos yet. Add some, or this draft is removed automatically."
              : section.description || "These are some of my favorite moments — little pieces of life that make the big picture beautiful."}
          </p>
        </div>

        {/* the album's own photos */}
        <Link href={`/share/${section.id}`} className="hidden sm:flex items-center gap-1.5 shrink-0" aria-hidden tabIndex={-1}>
          {covers.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-sm border border-[#e8e0d5] transition-transform duration-500"
              style={{ transform: `translateY(${i % 2 ? 3 : 0}px)` }}
            />
          ))}
        </Link>

        {/* meta and actions */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <div className="md:text-right">
            <div className="text-[10px] font-bold text-[#a3907a] uppercase tracking-[0.16em]">{shortDate(section.createdAt)}</div>
            <div className="text-xs font-semibold text-[#5a4d41] tabular-nums">{photoCount} {photoCount === 1 ? "photo" : "photos"}</div>
          </div>

          <FavouriteButton
            isFavorite={isFavorite}
            reduce={reduce}
            onToggle={onToggleFavorite}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isFavorite ? "text-rose-500" : "text-[#a3907a] hover:text-rose-500 hover:bg-[#f4eee6]"}`}
          />

          <div className="relative">
            <button
              ref={menuBtn}
              data-album-menu-button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMenu(!menuOpen); }}
              aria-label="Album actions"
              aria-expanded={menuOpen}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${menuOpen ? "bg-[#e8e0d5] text-[#1c1917]" : "text-[#a3907a] hover:text-[#1c1917] hover:bg-[#f4eee6]"}`}
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={18} className="rotate-90" />}
            </button>
            <PortalMenu open={menuOpen} anchor={menuBtn} reduce={reduce} onClose={() => onMenu(false)}>
              <MenuBody section={section} confirm={confirm} setConfirm={setConfirm} onCopy={onCopy} onDelete={onDelete} />
            </PortalMenu>
          </div>
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
