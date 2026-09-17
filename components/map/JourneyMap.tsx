"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Users, Plane, Cake, PartyPopper, Sparkles, Images, ArrowRight, Edit3, Link as LinkIcon, Unlink, Loader2, X } from "lucide-react";
import type { AlbumSection } from "@/components/HomeAlbumList";

const STOCK = {
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  travel: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
  event: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
};

const PURPOSE_META: Record<string, { label: string; Icon: any; stock: string }> = {
  family: { label: "Family", Icon: Users, stock: STOCK.family },
  travel: { label: "Travel", Icon: Plane, stock: STOCK.travel },
  birthday: { label: "Birthday", Icon: Cake, stock: "/wishing-tree-bg.jpg" },
  "family-function": { label: "Family Function", Icon: Sparkles, stock: STOCK.event },
  party: { label: "Party", Icon: PartyPopper, stock: STOCK.event },
};
const OTHER = { label: "Album", Icon: Images, stock: STOCK.family };

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
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start center", "end center"] });
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
        className={`relative flex items-center justify-start md:justify-center w-full mb-16 md:mb-32 ${isBranch ? 'mt-8 md:mt-16 opacity-90 scale-95' : ''}`}
      >
        {/* Connector line dot on desktop (only for main trunk) */}
        {!isBranch && <div className="hidden md:block absolute left-1/2 -ml-3 w-6 h-6 bg-[#f8f6f3] border-4 border-[#e8e0d5] rounded-full z-0" />}
        
        {/* Branch connector line */}
        {isBranch && (
          <div className={`hidden md:block absolute top-[-100px] w-px h-[140px] border-l-2 border-dashed border-[#d9cbb8] z-0 ${isLeft ? 'right-[20%]' : 'left-[20%]'}`} />
        )}
        
        <div className={`w-full pl-12 md:pl-0 md:w-[42%] ${isLeft ? "md:pr-12 md:mr-[50%] md:text-right" : "md:pl-12 md:ml-[50%] md:text-left"}`}>
          <div className={`flex flex-col ${isLeft ? "md:items-end" : "md:items-start"}`}>
            
            {/* Meta */}
            <div className={`flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a3907a] ${isLeft ? "md:flex-row-reverse" : ""}`}>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e8e0d5] shadow-sm text-[#2c241b]">
                <Icon size={12} /> {meta.label}
              </span>
              <span>{shortDate(section.createdAt)}</span>
            </div>

            {/* Preview */}
            <div className="relative group">
              <Link href={`/share/${section.id}`} className="block w-full max-w-[280px] md:max-w-[320px] aspect-square rounded-sm bg-[#fdfbf7] p-2 pb-[4.5rem] border border-[#e8e0d5] shadow-[0_15px_35px_rgba(28,25,23,0.12)] hover:shadow-[0_25px_50px_rgba(28,25,23,0.2)] hover:-translate-y-2 transition-all duration-500 mb-4" style={{ transform: `rotate(${isLeft ? -2 : 2.5}deg)` }}>
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

      <div ref={containerRef} className="relative mt-20" style={{ minHeight: mainTrunk.length * 350 }}>
        {/* The Central Path Line */}
        <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-[4px] -ml-[2px] rounded-full bg-[#e8e0d5]">
          <motion.div className="absolute top-0 left-0 w-full bg-[#c9a24a] rounded-full origin-top" style={{ height: "100%", scaleY: pathProgress }} />
          <motion.div className="absolute left-1/2 -ml-2 w-4 h-4 bg-white border-[3px] border-[#c9a24a] rounded-full shadow-[0_0_15px_rgba(201,162,74,0.6)] z-10" style={{ top: glowY }} />
        </div>

        {/* The Journey Nodes */}
        <div className="relative z-10 w-full">
          {mainTrunk.map((section, i) => {
            const isLeft = i % 2 === 0;
            const branches = branchMap.get(section.id) || [];
            
            return (
              <div key={`group-${section.id}`} className="relative">
                {/* Render Main Trunk Item */}
                {renderNode(section, isLeft)}
                
                {/* Render any branches attached to it */}
                {branches.map((branch, j) => renderNode(branch, isLeft, true))}
              </div>
            );
          })}
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
