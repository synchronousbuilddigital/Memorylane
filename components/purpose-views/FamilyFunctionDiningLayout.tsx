"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";

const POLAROID_POSITIONS = [
  { left: "15%", top: "20%", rot: -12, size: 0.9 },
  { left: "75%", top: "15%", rot: 8, size: 0.95 },
  { left: "35%", top: "65%", rot: -5, size: 1.0 },
  { left: "60%", top: "60%", rot: 15, size: 0.85 },
  { left: "12%", top: "50%", rot: 22, size: 0.9 },
  { left: "80%", top: "70%", rot: -18, size: 1.05 },
];

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1531123414708-f40f06bf3eb6?auto=format&fit=crop&q=80&w=800",
];

export default function FamilyFunctionDiningLayout({ 
  images = [], 
  title = "The Family Table", 
  description = "Where our best stories are shared and memories are made.",
  onTitleChange,
  onDescriptionChange,
}: any) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const safeCards = Array.from({ length: POLAROID_POSITIONS.length }, (_, i) => {
    return images?.[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <div className="relative w-full h-[100vh] md:h-[120vh] bg-[#1a120e] overflow-hidden" style={{ perspective: "1500px" }}>
      {/* RESPONSIVE ASPECT-RATIO WRAPPER */}
      <div className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-full min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2">
        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            src="/dining-table-bg.jpg" 
            alt="Dining Table" 
            className="w-full h-full object-cover"
            style={{ transformOrigin: "center center" }}
            animate={{ scale: [1.0, 1.05, 1.0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Subtle vignette for focus */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-[#1a120e]/60" />
        </div>

        {/* SCATTERED POLAROIDS */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {safeCards.map((card: any, idx: number) => {
            const pos = POLAROID_POSITIONS[idx];
            if (!pos) return null;
            const imgUrl = card.displayUrl || card.url || card;

            return (
              <div 
                key={`polaroid-${idx}`}
                className="absolute pointer-events-auto"
                style={{ left: pos.left, top: pos.top }}
              >
                <motion.div
                  className="relative cursor-pointer bg-[#fcfbf9] p-3 md:p-4 pb-8 md:pb-12 shadow-[0_10px_20px_rgba(0,0,0,0.5)] border border-[#e8e0d5]"
                  style={{ width: 140, height: 160 }}
                  initial={{ rotateZ: pos.rot, scale: pos.size }}
                  whileHover={{ 
                    scale: pos.size * 1.1, 
                    rotateZ: pos.rot > 0 ? pos.rot + 5 : pos.rot - 5,
                    y: -10,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
                  }}
                  onClick={() => setActiveIdx(idx)}
                >
                  <div className="relative w-full h-[100px] bg-[#1a120e] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="memory" className="w-full h-full object-cover opacity-90 sepia-[0.2]" />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEXT CONTENT */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl pointer-events-auto text-center px-4">
        {/* Magic dark aura to obscure background */}
        <div className="absolute inset-0 bg-[#1a120e]/60 blur-2xl pointer-events-none rounded-full scale-150" />
        
        <div className="relative">
          <div className="mb-2">
            <span className="text-[#f4ece0] tracking-[0.3em] text-[10px] md:text-xs font-bold uppercase drop-shadow-lg">A Seat at the Table</span>
          </div>
          <InlineEditableText
            value={title}
            onChange={onTitleChange ?? (() => {})}
            className="text-4xl md:text-6xl font-serif font-bold text-[#fcfbf9] leading-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] mb-4"
          />
          <InlineEditableText
            value={description}
            onChange={onDescriptionChange ?? (() => {})}
            className="text-sm md:text-lg text-[#f4ece0]/90 leading-relaxed drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] font-medium mx-auto max-w-[300px] md:max-w-md"
          />
        </div>
      </div>

      {/* Full-Screen Modal for Active Image */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#1a120e]/90 backdrop-blur-md cursor-zoom-out" 
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, rotateZ: -5 }}
              animate={{ scale: 1, y: 0, rotateZ: 0 }}
              exit={{ scale: 0.8, y: 50, rotateZ: 5 }}
              className="bg-[#fcfbf9] p-6 pb-20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#e8e0d5] max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={safeCards[activeIdx].displayUrl || safeCards[activeIdx].url || safeCards[activeIdx]} 
                alt="Enlarged Memory"
                className="w-full h-auto max-h-[70vh] object-contain bg-[#1a120e]" 
              />
            </motion.div>
            <div className="absolute top-8 text-white/50 tracking-widest text-xs uppercase font-semibold">
              Click anywhere to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
