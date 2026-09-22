"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GALLERY_POSITIONS = [
  { left: "10%", top: "25%", width: 180, height: 240, type: "gold" },
  { left: "30%", top: "45%", width: 220, height: 160, type: "wood" },
  { left: "50%", top: "15%", width: 160, height: 200, type: "gold" },
  { left: "75%", top: "35%", width: 200, height: 260, type: "wood" },
  { left: "15%", top: "65%", width: 140, height: 140, type: "gold" },
  { left: "60%", top: "60%", width: 240, height: 180, type: "wood" },
];

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511556532299-8f662fc26c06",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
];

export default function FamilyFunctionGalleryLayout({ images = [] }: { images?: any[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const safeCards = Array.from({ length: GALLERY_POSITIONS.length }, (_, i) => {
    return images?.[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <div className="relative w-full h-[100vh] md:h-[120vh] bg-[#1a0f0a] overflow-hidden">
      {/* Dolly shot container - moves slowly left to right */}
      <motion.div 
        className="absolute top-1/2 left-0 w-[120vw] h-[56.25vw] min-h-full min-w-[213.33vh] -translate-y-1/2"
        animate={{ x: ["-10%", "0%", "-10%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/gallery-wall-bg.jpg" 
            alt="Gallery Wall" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f0a]/80 via-transparent to-[#1a0f0a]/80" />
        </div>

        {/* FRAMES ON THE WALL */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {safeCards.map((card: any, idx: number) => {
            const pos = GALLERY_POSITIONS[idx];
            if (!pos) return null;
            const imgUrl = card.displayUrl || card.url || card;

            return (
              <div 
                key={`frame-${idx}`}
                className="absolute pointer-events-auto cursor-pointer"
                style={{ left: pos.left, top: pos.top }}
                onClick={() => setActiveIdx(idx)}
              >
                <motion.div
                  className={`relative flex items-center justify-center p-2 md:p-3 shadow-[0_20px_30px_rgba(0,0,0,0.8)] ${
                    pos.type === "gold" 
                      ? "bg-gradient-to-br from-[#d4af37] via-[#aa7c11] to-[#f9f1cc] rounded-sm" 
                      : "bg-gradient-to-br from-[#3d2314] via-[#1a0f0a] to-[#2c1a0e] rounded-md"
                  }`}
                  style={{ width: pos.width, height: pos.height }}
                  whileHover={{ scale: 1.05, zIndex: 50, boxShadow: "0 30px 50px rgba(0,0,0,0.9)" }}
                >
                  <div className="w-full h-full bg-[#1a0f0a] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imgUrl} 
                      alt="memory" 
                      className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all duration-500" 
                    />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Full-Screen Modal for Active Image */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a0f0a]/95 backdrop-blur-md cursor-zoom-out" 
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#1a0f0a] p-4 shadow-2xl max-w-4xl w-full border border-white/10 rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={safeCards[activeIdx].displayUrl || safeCards[activeIdx].url || safeCards[activeIdx]} 
                alt="Enlarged Memory"
                className="w-full h-auto max-h-[80vh] object-contain" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
