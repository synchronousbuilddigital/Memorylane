"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Users, Plane, Cake, PartyPopper, Sparkles, Images, ArrowRight, Edit3, Link as LinkIcon, Unlink, Loader2, X, Plus } from "lucide-react";
import type { AlbumSection } from "@/components/HomeAlbumList";

const STOCK = {
  family: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  travel: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1",
  event: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511795409834-ef04bbd61622",
};

const PURPOSE_META: Record<string, { label: string; Icon: any; stock: string }> = {
  family: { label: "Family", Icon: Users, stock: STOCK.family },
  travel: { label: "Travel", Icon: Plane, stock: STOCK.travel },
  birthday: { label: "Birthday", Icon: Cake, stock: "/wishing-tree-bg.jpg" },
  "family-function": { label: "Family Function", Icon: Sparkles, stock: STOCK.event },
  party: { label: "Party", Icon: PartyPopper, stock: STOCK.event },
};
const OTHER = { label: "Album", Icon: Images, stock: STOCK.family };

/* A marker on the rail. `at` is how far along the rail it sits, so it lights
   the moment the gold reaches it rather than sitting grey while the line runs
   straight through. The ramp is short so it reads as arriving, not fading. */
function RailMarker({ progress, at, kind }: { progress: MotionValue<number>; at: number; kind: "stop" | "branch" | "end" }) {
  const lit = useTransform(progress, [Math.max(0, at - 0.012), at], [0, 1]);
  const borderColor = useTransform(lit, [0, 1], ["#e8e0d5", "#c9a24a"]);
  const backgroundColor = useTransform(lit, [0, 1], ["#f8f6f3", "#fdf3d8"]);
  const scale = useTransform(lit, [0, 1], [1, 1.18]);
  const boxShadow = useTransform(lit, (v) => `0 0 ${16 * v}px ${4 * v}px rgba(201,162,74,${0.45 * v})`);

  if (kind === "branch") {
    return (
      <motion.span
        aria-hidden
        style={{ borderColor, backgroundColor, scale, boxShadow }}
        className="absolute left-10 md:left-1/2 -ml-[7px] top-1/2 -mt-[7px] w-3.5 h-3.5 rotate-45 border-2 z-[1]"
      />
    );
  }
  return (
    <motion.span
      aria-hidden
      style={{ borderColor, backgroundColor, scale, boxShadow }}
      className={`absolute left-10 md:left-1/2 -ml-3 w-6 h-6 rounded-full z-[1] ${kind === "end" ? "border-4 border-dashed" : "border-4"}`}
    />
  );
}

const metaFor = (s: AlbumSection) => PURPOSE_META[s.purpose ?? ""] ?? (s.theme?.includes("birthday") ? PURPOSE_META.birthday : OTHER);

function sized(url: string | null | undefined) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_600,c_limit,q_auto,f_auto/");
}

const shortDate = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function JourneyMap({ sections }: { sections: AlbumSection[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const railRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HTMLDivElement>(null);

  /* The rail used to span the whole container, which ran past the first stop at
     the top and past the last one at the bottom, leaving a length of line with
     nothing on it at each end. It is now inset to the exact centres of the
     first and last stop, measured after layout. */
  const [inset, setInset] = useState({ top: 0, bottom: 0 });
  /* How far along the rail each marker sits, 0 at the first stop and 1 at the
     last. The markers used to be inert: the gold ran straight through them and
     they stayed grey, so the line never looked connected to the journey. Each
     one now lights as the fill reaches it. */
  const [fracs, setFracs] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const el = nodesRef.current;
    if (!el) return;
    /* offsetTop, not getBoundingClientRect: the cards arrive with a translate on
       them, and a client rect includes that transform. Measuring the rect while
       a card was still 30px below its resting place left the rail 30px too long
       once it settled. Offsets are layout, so animation cannot skew them. */
    const offsetWithin = (node: HTMLElement, root: HTMLElement) => {
      let y = 0;
      let n: HTMLElement | null = node;
      while (n && n !== root) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return y;
    };
    const measure = () => {
      const stops = el.querySelectorAll<HTMLElement>("[data-stop]");
      if (stops.length === 0) return;
      const centre = (n: HTMLElement) => offsetWithin(n, el) + n.offsetHeight / 2;
      const first = centre(stops[0]);
      const last = centre(stops[stops.length - 1]);
      setInset({
        top: Math.max(0, Math.round(first)),
        bottom: Math.max(0, Math.round(el.offsetHeight - last)),
      });

      // the rail's extent comes from the stops; every marker, branches included,
      // is placed along that same span
      const span = Math.max(1, last - first);
      const next: Record<string, number> = {};
      el.querySelectorAll<HTMLElement>("[data-marker]").forEach((m) => {
        const key = m.getAttribute("data-marker");
        if (key) next[key] = Math.min(1, Math.max(0, (centre(m) - first) / span));
      });
      setFracs(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // images finishing later change the stop positions
    const t = setTimeout(measure, 600);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [sections.length]);

  /* Progress is measured against the RAIL, not the container. Against the
     container the line could never fill: it finished only once the container's
     end reached the viewport centre, and the container ended below the last
     stop, so at full scroll the gold stopped around 86%. */
  /* "end 85%" rather than "end center": completing at the viewport centre needs
     half a screen of page below the rail's end, which does not exist once the
     rail ends near the foot of the document — so the gold stopped short of the
     final stop. 85% completes it as the last stop nears the bottom of the
     screen, which is both reachable and where it feels finished. */
  const { scrollYProgress } = useScroll({ target: railRef, offset: ["start center", "end 85%"] });
  const pathProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const glowY = useTransform(pathProgress, [0, 1], ["0%", "100%"]);

  // Grouping logic for branches
  const mainTrunk = sections.filter(s => !s.linkedToId);
  const branchMap = new Map<string, AlbumSection[]>();
  sections.filter(s => s.linkedToId).forEach(b => {
    const list = branchMap.get(b.linkedToId!) || [];
    list.push(b);
    branchMap.set(b.linkedToId!, list);
  });

  const handleLink = async (sourceId: string, targetId: string | null) => {
    setLinkingFrom(null);
    startTransition(async () => {
      await fetch("/api/sections/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: sourceId, linkedToId: targetId })
      });
      router.refresh();
    });
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-[#e8e0d5] rounded-3xl shadow-sm max-w-2xl mx-auto px-6">
        <div className="w-16 h-16 bg-[#f4eee6] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5a4d41]">
          <Plane size={24} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1c1917] mb-3">Your journey begins here</h2>
        <p className="text-[#8a755b] mb-8">Create your first Memory Lane album to start charting your life's journey.</p>
        <Link href="/#create" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1c1917] text-white font-semibold hover:bg-[#3d3329] transition-colors">
          Start a New Lane <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const renderNode = (section: AlbumSection, isLeft: boolean, isBranch: boolean = false) => {
    const meta = metaFor(section);
    const Icon = meta.Icon;
    const covers = section.images && section.images.length > 0 
      ? section.images.map(img => sized(img.thumbUrl || img.displayUrl)).filter(Boolean)
      : [meta.stock];

    return (
      <motion.div 
        key={section.id}
        initial={{ opacity: 0, x: isLeft ? -50 : 50, y: 30 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
        data-marker={section.id}
        {...(!isBranch ? { "data-stop": "" } : {})}
        className={`relative flex items-center justify-start md:justify-center w-full mb-10 md:mb-20 last:mb-0 ${isBranch ? 'mt-4 md:mt-8 opacity-95' : ''}`}
      >
        {/* The stop on the rail. It sits on the mobile rail too — it used to be
            desktop-only, so the phone had a line with no stops on it. */}
        {!isBranch && <RailMarker progress={pathProgress} at={fracs[section.id] ?? 0} kind="stop" />}
        
        {/* A branch hangs off the main line rather than sitting on it: a hollow
            diamond where it leaves the rail, and a dashed run out to the card.
            The old version was a vertical line at top:-100px, height 140px,
            offset 20% — three fixed numbers that lined up with nothing. These
            are anchored to the rail and to the row's own centre, so they meet
            the card whatever size it is. */}
        {isBranch && (
          <>
            <span aria-hidden className={`absolute top-1/2 -mt-px border-t-2 border-dashed border-[#d9cbb8] z-0 w-6 md:w-12 ${isLeft ? "left-10 md:left-auto md:right-1/2" : "left-10 md:left-1/2"}`} />
            <RailMarker progress={pathProgress} at={fracs[section.id] ?? 0} kind="branch" />
          </>
        )}
        
        <div className={`w-full pl-16 sm:pl-20 md:pl-0 md:w-[42%] ${isLeft ? "md:pr-12 md:mr-[50%] md:text-right" : "md:pl-12 md:ml-[50%] md:text-left"}`}>
          <div className={`flex flex-col ${isLeft ? "md:items-end" : "md:items-start"}`}>
            
            {/* Meta */}
            <div className={`flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3907a] ${isLeft ? "md:flex-row-reverse" : ""}`}>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e8e0d5] shadow-sm text-[#2c241b]">
                <Icon size={12} /> {meta.label}
              </span>
              <span>{shortDate(section.createdAt)}</span>
            </div>

            {/* Preview */}
            {/* The wrapper needs the width. It had none, so the Link's `w-full`
                resolved against a shrink-to-fit box and every polaroid came out
                85px square, sized by its caption rather than the layout. */}
            <div className="relative group w-full max-w-[280px] md:max-w-[320px] mb-4">
              {/* The page already fetches three photos per album and used to show
                  one. The other two sit behind as a fanned stack, so an album with
                  more in it looks like it. */}
              {covers.slice(1, 3).map((c, k) => (
                <span
                  key={`fan-${k}`}
                  aria-hidden
                  className="absolute inset-x-0 top-0 aspect-square rounded-sm bg-[#fdfbf7] border border-[#e8e0d5] shadow-[0_10px_24px_rgba(28,25,23,0.10)] transition-transform duration-500 group-hover:-translate-y-1"
                  style={{ transform: `rotate(${(isLeft ? 1 : -1) * (k + 1) * 3.5}deg) translateY(${(k + 1) * 3}px)`, zIndex: 0 }}
                />
              ))}
              <Link href={`/share/${section.id}`} className="relative z-[1] block w-full aspect-square rounded-sm bg-[#fdfbf7] p-2 pb-[4.5rem] border border-[#e8e0d5] shadow-[0_15px_35px_rgba(28,25,23,0.12)] hover:shadow-[0_25px_50px_rgba(28,25,23,0.2)] hover:-translate-y-2 transition-all duration-500" style={{ transform: `rotate(${isLeft ? -2 : 2.5}deg)` }}>
                <div className="relative w-full h-full bg-gray-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={covers[0] as string} alt={section.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <span className="absolute inset-x-2 bottom-3 text-center font-handwriting text-[1.4rem] text-[#2c241b] line-clamp-1 group-hover:text-[#8a755b] transition-colors">{section.title}</span>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#f4ead5]/90 backdrop-blur-sm shadow-sm rotate-2" />
              </Link>

              {/* Edit Mode Controls */}
              {isEditMode && (
                <div className={`absolute top-4 ${isLeft ? '-left-14' : '-right-14'} z-20 flex flex-col gap-2`}>
                  {section.linkedToId ? (
                    <button onClick={() => handleLink(section.id, null)} className="w-10 h-10 rounded-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center shadow-lg transition-colors" title="Unlink album">
                      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Unlink size={16} />}
                    </button>
                  ) : (
                    <button onClick={() => setLinkingFrom(section.id)} className="w-10 h-10 rounded-full bg-[#1c1917] text-white hover:bg-[#3d3329] flex items-center justify-center shadow-lg transition-colors" title="Link to another album">
                      <LinkIcon size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <h3 className="font-serif text-2xl font-black text-[#1c1917] tracking-tight mb-2">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-[#5a4d41] text-sm leading-relaxed max-w-sm line-clamp-2">
                {section.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full pb-32 pt-10">
      
      {/* Top Controls */}
      <div className="absolute top-0 right-4 md:right-0 z-30">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all shadow-sm ${isEditMode ? 'bg-[#c9a24a] text-white border-transparent' : 'bg-white border border-[#e8e0d5] text-[#5a4d41] hover:text-[#1c1917]'}`}
        >
          <Edit3 size={16} /> {isEditMode ? "Done Editing" : "Customize Journey"}
        </button>
      </div>

      {/* No minHeight: it was mainTrunk.length * 350, an arbitrary number that
          padded the container past its own content and stretched the rail with it. */}
      <div ref={containerRef} className="relative mt-20">
        {/* The Central Path Line */}
        <div
          ref={railRef}
          className="absolute left-10 md:left-1/2 w-[4px] -ml-[2px] rounded-full bg-[#e8e0d5]"
          style={{ top: inset.top, bottom: inset.bottom }}
        >
          <motion.div className="absolute top-0 left-0 w-full bg-[#c9a24a] rounded-full origin-top" style={{ height: "100%", scaleY: pathProgress }} />
          {/* -mt-2 centres the marker on the fill's leading edge; without it the
              marker hung its own height below the gold. */}
          <motion.div className="absolute left-1/2 -ml-2 -mt-2 w-4 h-4 bg-white border-[3px] border-[#c9a24a] rounded-full shadow-[0_0_15px_rgba(201,162,74,0.6)] z-10" style={{ top: glowY }} />
        </div>

        {/* The Journey Nodes */}
        <div ref={nodesRef} className="relative z-10 w-full">
          {mainTrunk.map((section, i) => {
            const isLeft = i % 2 === 0;
            const branches = branchMap.get(section.id) || [];
            const year = new Date(section.createdAt).getFullYear();
            const prevYear = i > 0 ? new Date(mainTrunk[i - 1].createdAt).getFullYear() : null;

            return (
              <div key={`group-${section.id}`} className="relative">
                {/* A year badge sits on the rail wherever the year turns over,
                    so the line reads as a timeline rather than a list. */}
                {year !== prevYear && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.45 }}
                    className={`relative flex w-full ${i === 0 ? "mb-8 md:mb-12" : "mt-2 mb-10 md:mt-6 md:mb-16"}`}
                  >
                    <span className="absolute left-10 md:left-1/2 -translate-x-1/2 rounded-full bg-[#1c1917] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e6c56d] shadow-[0_8px_20px_rgba(28,25,23,0.25)] tabular-nums">
                      {year}
                    </span>
                    <span className="block h-7" />
                  </motion.div>
                )}

                {/* Render Main Trunk Item */}
                {renderNode(section, isLeft)}
                
                {/* Render any branches attached to it */}
                {branches.map((branch) => renderNode(branch, isLeft, true))}
              </div>
            );
          })}

          {/* The line has to end somewhere. Ending it on an invitation rather
              than mid-air also means the gold fill completes when you arrive. */}
          <motion.div
            data-stop
            data-marker="__end"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative mt-10 md:mt-20 flex w-full items-center justify-start md:justify-center"
          >
            <RailMarker progress={pathProgress} at={fracs["__end"] ?? 1} kind="end" />
            <div className="w-full pl-16 sm:pl-20 md:w-[42%] md:pl-12 md:ml-[50%] md:text-left">
              <Link
                href="/#create"
                className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-dashed border-[#d9cbb8] bg-white/70 px-5 py-3 text-sm font-semibold text-[#5a4d41] shadow-sm transition-all hover:border-[#c9a24a] hover:text-[#1c1917]"
              >
                <Plus size={16} className="text-[#c9a24a]" />
                Start your next chapter
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Linking Modal */}
      {linkingFrom && (
        <div className="fixed inset-0 bg-[#1c1917]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setLinkingFrom(null)} className="absolute top-6 right-6 text-[#8a755b] hover:text-[#1c1917]">
              <X size={20} />
            </button>
            <h3 className="font-serif text-2xl font-bold text-[#1c1917] mb-2">Connect Album</h3>
            <p className="text-[#5a4d41] text-sm mb-6">Select an album to branch off from this point in your journey.</p>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {sections.filter(s => s.id !== linkingFrom && !s.linkedToId).map(target => (
                <button
                  key={target.id}
                  onClick={() => handleLink(linkingFrom, target.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-[#e8e0d5] hover:border-[#c9a24a] hover:bg-[#fcfbf9] transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-semibold text-[#1c1917]">{target.title}</div>
                    <div className="text-xs text-[#8a755b]">{shortDate(target.createdAt)}</div>
                  </div>
                  <LinkIcon size={16} className="text-[#d9cbb8] group-hover:text-[#c9a24a]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
