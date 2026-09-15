"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LIGHTS_POSITIONS = [
  { left: "20%", top: "10%", length: 150, delay: 0 },
  { left: "45%", top: "15%", length: 200, delay: 0.2 },
  { left: "70%", top: "5%", length: 120, delay: 0.5 },
  { left: "30%", top: "25%", length: 250, delay: 0.1 },
  { left: "85%", top: "20%", length: 180, delay: 0.4 },
  { left: "10%", top: "30%", length: 220, delay: 0.3 },
  { left: "60%", top: "35%", length: 280, delay: 0.6 },
  { left: "40%", top: "40%", length: 160, delay: 0.2 },
];

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1531123414708-f40f06bf3eb6?auto=format&fit=crop&q=80&w=800",
];

export default function FamilyFunctionLightsLayout({ images = [] }: { images?: any[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const safeCards = Array.from({ length: LIGHTS_POSITIONS.length }, (_, i) => {
    return images?.[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <div className="relative w-full h-[100vh] md:h-[120vh] bg-[#0c121e] overflow-hidden">
      {/* RESPONSIVE ASPECT-RATIO WRAPPER */}
      <div className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-full min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2">
        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            src="/string-lights-bg.jpg" 
            alt="String Lights" 
            className="w-full h-full object-cover"
            style={{ transformOrigin: "50% 30%" }}
            animate={{ scale: [1.0, 1.1, 1.0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c121e]/40 via-transparent to-[#0c121e]/80" />
        </div>

        {/* HANGING PHOTOS (from the lights) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {safeCards.map((card: any, idx: number) => {
            const pos = LIGHTS_POSITIONS[idx];
            if (!pos) return null;
            const imgUrl = card.displayUrl || card.url || card;

            return (
              <div 
                key={`hanging-${idx}`}
                className="absolute flex flex-col items-center pointer-events-auto"
                style={{ left: pos.left, top: pos.top }}
              >
                <motion.div
                  style={{ transformOrigin: "top center" }}
                  animate={{ rotateZ: [-3, 3, -3] }}
                  transition={{ duration: 4 + (idx % 3), repeat: Infinity, ease: "easeInOut", delay: pos.delay }}
                  className="flex flex-col items-center"
                >
                  {/* The String */}
                  <div className="w-[1px] bg-white/30" style={{ height: pos.length }} />
                  {/* The Clothespin */}
                  <div className="w-3 h-5 bg-[#8a755b] rounded-sm -mt-2 z-10 shadow-sm" />
                  
                  {/* The Photo */}
                  <motion.div
                    className="relative cursor-pointer bg-[#fcfbf9] p-2 md:p-3 pb-6 md:pb-8 shadow-xl -mt-2"
                    style={{ width: 120, height: 140 }}
                    whileHover={{ scale: 1.1, zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                    onClick={() => setActiveIdx(idx)}
                  >
                    <div className="relative w-full h-[90px] bg-[#0c121e] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt="memory" className="w-full h-full object-cover opacity-90" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Modal for Active Image */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#0c121e]/90 backdrop-blur-md cursor-zoom-out" 
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-[#fcfbf9] p-6 pb-20 shadow-2xl max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={safeCards[activeIdx].displayUrl || safeCards[activeIdx].url || safeCards[activeIdx]} 
                alt="Enlarged Memory"
                className="w-full h-auto max-h-[70vh] object-contain bg-[#0c121e]" 
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
