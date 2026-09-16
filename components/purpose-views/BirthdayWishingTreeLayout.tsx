import React, { useState } from "react";
import { motion } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";

const LANTERN_POSITIONS = [
  // Original 8 (Covering baked-in frames)
  { left: "28%", top: "28%", size: 1.0 }, // Top left
  { left: "40%", top: "18%", size: 1.1 }, // Top mid
  { left: "64%", top: "25%", size: 1.0 }, // Top right
  { left: "28%", top: "50%", size: 0.9 }, // Mid left
  { left: "37%", top: "42%", size: 1.05 }, // Center left
  { left: "54%", top: "38%", size: 1.0 }, // Center right
  { left: "74%", top: "30%", size: 0.95 }, // Far right mid
  { left: "68%", top: "45%", size: 1.05 }, // Right low
  // New Extra Lanterns!
  { left: "10%", top: "22%", size: 0.8 }, // Far Top left
  { left: "15%", top: "58%", size: 0.9 }, // Far Bottom left
  { left: "82%", top: "20%", size: 0.85 }, // Far Top Right
  { left: "86%", top: "40%", size: 0.9 }, // Far Mid Right
  { left: "78%", top: "55%", size: 0.95 }, // Far Bottom Right
  { left: "48%", top: "58%", size: 1.1 }, // Bottom Center Low
];

const TAG_POSITIONS = [
  { text: "Good\nPeople\n♡", left: "24%", top: "38%", rot: -5 },
  { text: "Better\nDays\n♡", left: "48%", top: "32%", rot: 3 },
  { text: "More\nTo\nCome\n♡", left: "77%", top: "47%", rot: -4 },
];

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800",
];

export default function BirthdayWishingTreeLayout({
  title,
  description,
  cards,
  onTitleChange,
  onDescriptionChange,
}: any) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const safeCards = Array.from({ length: LANTERN_POSITIONS.length }, (_, i) => {
    return cards?.[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <div className="relative w-full h-[100vh] md:h-[120vh] bg-[#140a05] overflow-hidden" style={{ perspective: "1500px" }}>
      {/* RESPONSIVE ASPECT-RATIO WRAPPER (Simulates object-cover) */}
      <div 
        className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-full min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
      >
        {/* BACKGROUND TREE */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            src="/wishing-tree-bg.jpg" 
            alt="Magical Wishing Tree" 
            className="w-full h-full object-cover"
            style={{ transformOrigin: "center center", filter: "sepia(0.55) saturate(0.7) hue-rotate(-12deg) brightness(0.85)" }}
            animate={{ scale: [1.0, 1.03, 1.0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* The stock picture has captions baked into its margins; these sit in image space and hide them */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg,#140a05 0%,rgba(20,10,5,0.9) 7%,transparent 15%,transparent 84%,rgba(20,10,5,0.9) 93%,#140a05 100%), linear-gradient(180deg,#140a05 0%,rgba(20,10,5,0.85) 8%,transparent 17%,transparent 80%,rgba(20,10,5,0.92) 90%,#140a05 100%)" }} />
          {/* soft rectangles over each caption: top-left title, top-right, left column, bottom-left, bottom-centre, bottom-right */}
          <div className="absolute top-0 left-0 w-[48%] h-[36%] bg-[#140a05] blur-[30px] pointer-events-none" />
          <div className="absolute top-0 left-[82%] w-[18%] h-[18%] bg-[#140a05] blur-[24px] pointer-events-none" />
          <div className="absolute top-[26%] left-0 w-[12%] h-[24%] bg-[#140a05] blur-[22px] pointer-events-none" />
          <div className="absolute top-[58%] left-0 w-[22%] h-[42%] bg-[#140a05] blur-[24px] pointer-events-none" />
          <div className="absolute top-[68%] left-[40%] w-[24%] h-[20%] bg-[#140a05] blur-[22px] pointer-events-none opacity-95" />
          <div className="absolute top-[84%] left-[82%] w-[18%] h-[16%] bg-[#140a05] blur-[24px] pointer-events-none" />
        </div>


      {/* HANGING LANTERN FRAMES */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {safeCards.map((card: any, idx: number) => {
          const pos = LANTERN_POSITIONS[idx];
          if (!pos) return null;
          const isAct = activeIdx === idx;
          const imgUrl = card.displayUrl || card.url || card;

          return (
            <div 
              key={`lantern-${idx}`}
              className="absolute pointer-events-auto"
              style={{ left: pos.left, top: pos.top }}
            >
              <motion.div
                className="relative cursor-pointer"
                style={{ transformOrigin: "top center" }}
                animate={{ rotateZ: [-2, 2, -2] }}
                transition={{ duration: 4 + (idx % 3), repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.05 }}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(isAct ? null : idx); }}
              >
                {/* String */}
                <div className="absolute left-1/2 -top-[150px] w-[2px] h-[150px] bg-gradient-to-b from-transparent to-[#c89850] shadow-[0_0_5px_rgba(200,150,80,0.5)] -translate-x-1/2" />
                
                {/* Glowing Lantern Frame */}
                <motion.div
                  animate={isAct ? { scale: 1.1, zIndex: 20 } : { scale: pos.size, zIndex: 10 }}
                  className="relative bg-gradient-to-br from-[#f8e5c0] to-[#b88040] p-1.5 md:p-2 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.9)] 
                             w-[90px] h-[100px] md:w-[155px] md:h-[165px]" 
                >
                  {/* Outer Glow to obscure background edges */}
                  <div className="absolute -inset-6 rounded-xl bg-[#ffcca0] opacity-50 blur-2xl pointer-events-none" />
                  
                  {/* Image Container */}
                  <div className="relative w-full h-full bg-[#1a0f14] rounded-lg overflow-hidden border-2 border-[#30150a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="memory" className="w-full h-full object-cover opacity-90 transition-opacity duration-300 hover:opacity-100" />
                    
                    {/* Inner Warm Glow Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ffb15e]/40 to-transparent pointer-events-none mix-blend-overlay" />
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,200,100,0.5)] rounded-lg pointer-events-none" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          );
        })}

        {/* HANGING PAPER TAGS */}
        {TAG_POSITIONS.map((tag, idx) => (
          <div key={`tag-${idx}`} className="absolute pointer-events-none" style={{ left: tag.left, top: tag.top }}>
            <motion.div
              className="relative scale-75 md:scale-100"
              style={{ transformOrigin: "top center", rotateZ: tag.rot }}
              animate={{ rotateZ: [tag.rot - 4, tag.rot + 4, tag.rot - 4] }}
              transition={{ duration: 5 + (idx % 2), repeat: Infinity, ease: "easeInOut", delay: idx }}
            >
              <div className="absolute left-1/2 -top-[120px] w-[1px] h-[120px] bg-black/50 -translate-x-1/2" />
              <div className="bg-[#f4ece0] px-3 md:px-5 py-4 md:py-6 rounded-b-xl rounded-t-sm shadow-[0_15px_30px_rgba(0,0,0,0.5)] text-center border-b-2 border-black/10">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner" />
                <p className="font-serif italic text-xs md:text-[15px] text-[#3a2a20] whitespace-pre-line leading-relaxed">
                  {tag.text}
                </p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      </div> {/* Close RESPONSIVE ASPECT-RATIO WRAPPER */}
      
      {/* Dark overlay for text readability mapped to the screen, NOT the tree wrapper */}
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#140a05]/90 via-[#140a05]/45 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#140a05]/80 to-transparent z-10 pointer-events-none" />

      {/* TEXT CONTENT (Left Center Aligned) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-[5%] md:left-[8%] z-20 max-w-xs md:max-w-xl pointer-events-auto">
        <div className="relative">
          <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4 text-[#e6c56d]/85"><span className="w-8 h-[1px] bg-[#c9a24a]" /> Chapter IV · Wishing tree</p>
          <h2 className="text-4xl md:text-6xl font-serif font-black text-[#f4eee6] leading-[1.05] drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] mb-5 whitespace-pre-wrap">
            {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
          </h2>
          <p className="text-sm md:text-lg text-[#d9cbb8] font-serif italic leading-relaxed drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] max-w-[280px] md:max-w-lg whitespace-pre-wrap">
            {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
          </p>
        </div>
      </div>
      
      {/* Full-Screen Modal for Active Image */}
      {activeIdx !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out" onClick={() => setActiveIdx(null)}>
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            src={safeCards[activeIdx].displayUrl || safeCards[activeIdx].url || safeCards[activeIdx]} 
            alt="Enlarged Memory"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#c9a24a]" 
            onClick={(e) => e.stopPropagation()}
          />
          {/* Close button instruction */}
          <div className="absolute top-8 text-white/50 tracking-widest text-xs uppercase font-semibold">
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
