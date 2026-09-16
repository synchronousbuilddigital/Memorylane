"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import TravelMapLayout from "./TravelMapLayout";
import TravelTunnelLayout from "./TravelTunnelLayout";
import TravelAstrolabeLayout from "./TravelAstrolabeLayout";
import InlineEditableText from "@/components/InlineEditableText";

/* ── PLACEHOLDER DATA ── */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529154036614-a60975f5c760?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504280655513-890259b6911c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop"
];

const LOCATIONS = [
  "Bali, Indonesia", "Zermatt, Switzerland", "Oia, Santorini", "Tokyo, Japan", "New York, USA",
  "Dubai, UAE", "Paris, France", "Swiss Alps", "London, UK", "Cinque Terre, Italy",
  "Maldives", "Grand Canyon", "Kyoto, Japan", "Patagonia", "Yosemite, USA"
];

/* Pre-compute final scattered positions for the 15 polaroids around the suitcase */
const SCATTER = Array.from({ length: 15 }, (_, i) => {
  // Funnel effect: stack upwards and spread out
  const progress = i / 14;
  const y = -120 - (progress * 480); // Go higher
  const maxSpread = 80 + (progress * 400); // Wider spread at top

  const angle = i * 2.4;
  const x = Math.cos(angle) * maxSpread;

  return {
    x,
    y,
    rotate: Math.sin(angle) * 35,
    delay: i * 0.08,
    closeDelay: (14 - i) * 0.05,
    size: 130 + (i % 3) * 20, // slightly smaller so they overlap better
  };
});

/* ── SINGLE POLAROID ── */
function Polaroid({ img, label, scatter, isOpen }: { img: string; label: string; scatter: typeof SCATTER[0]; isOpen: boolean }) {
  return (
    <motion.div
      className={`absolute top-[40%] left-1/2 cursor-grab active:cursor-grabbing ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        width: scatter.size,
        marginLeft: -scatter.size / 2,
        marginTop: -scatter.size / 2,
        zIndex: 20 + Math.round(scatter.delay * 100)
      }}
      initial={{ x: 0, y: 0, scale: 0.1, opacity: 0, rotate: 0 }}
      animate={isOpen ? {
        x: scatter.x,
        y: scatter.y,
        scale: 1,
        opacity: 1,
        rotate: scatter.rotate,
      } : {
        x: 0,
        y: 60, // Fall slightly back down into the base
        scale: 0.1,
        opacity: 0,
        rotate: 0
      }}
      transition={{
        type: "spring",
        delay: isOpen ? scatter.delay + 0.4 : scatter.closeDelay,
        duration: isOpen ? 1.5 : 0.8,
        bounce: isOpen ? 0.35 : 0,
      }}
      whileHover={isOpen ? { scale: 1.15, rotate: 0, zIndex: 999, y: scatter.y - 15 } : {}}
    >
      <div className="bg-[#fdfbf7] p-3 pb-12 shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-sm border border-[#e5dfd5]">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#f4ead5]/80 rotate-[-2deg] shadow-sm z-10 backdrop-blur-sm" />
        <div className="relative aspect-square w-full overflow-hidden bg-gray-200 shadow-inner">
          <Image src={img} alt={label} fill className="object-cover sepia-[.1] contrast-[1.05]" />
          <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none" />
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center w-full px-2">
          <span className="font-handwriting text-[#2c241b] text-xl opacity-90 inline-block -rotate-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[90%]">
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── MAIN COMPONENT ── */
export default function TravelSuitcaseLayout({ 
  images = [],
  title,
  description,
  content = {},
  onTitleChange,
  onDescriptionChange,
  onContentChange 
}: { 
  images?: any[];
  title?: string;
  description?: string;
  content?: any;
  onTitleChange?: (val: string) => void;
  onDescriptionChange?: (val: string) => void;
  onContentChange?: (key: string, val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const flat = images.flat().filter(Boolean);
  const safeImages = flat.length > 0
    ? flat.slice(0, 15).map((img, i) => ({
      url: img.originalUrl || img.url || (typeof img === 'string' ? img : PLACEHOLDERS[i % PLACEHOLDERS.length]),
      note: img.caption || img.note || LOCATIONS[i % LOCATIONS.length]
    }))
    : PLACEHOLDERS.map((src, i) => ({ url: src, note: LOCATIONS[i] }));
  while (safeImages.length < 15) {
    safeImages.push({ url: PLACEHOLDERS[safeImages.length % 15], note: LOCATIONS[safeImages.length % 15] });
  }

  const mX = useMotionValue(0.5), mY = useMotionValue(0.5);
  const spX = useSpring(mX, { damping: 30, stiffness: 80 });
  const spY = useSpring(mY, { damping: 30, stiffness: 80 });
  const bgX = useTransform(spX, [0, 1], [15, -15]);
  const bgY = useTransform(spY, [0, 1], [15, -15]);
  const rotateYContainer = useTransform(spX, [0, 1], [-12, 12]);
  const rotateXContainer = useTransform(spY, [0, 1], [12, -12]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mX.set(e.clientX / window.innerWidth);
      mY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mX, mY]);

  const handleLockClick = () => {
    if (!unlocked) {
      setUnlocked(true);
      return;
    }
    setIsOpen(o => !o);
  };

  return (
    <main className="w-full bg-[#0a0705] overflow-x-hidden">
      <div className="relative min-h-screen w-full font-sans">
      {/* Vintage Map Texture Background */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-screen"
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'sepia(0.8) contrast(1.2)' }} />
           
      {/* Deep Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0502_100%)] pointer-events-none" />

      {/* Floating Ambient Glowing Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const startX = (i * 17) % 100;
          const startY = (i * 23) % 100;
          const duration = 10 + (i % 10) * 2;
          const size = (i % 3) + 2; // 2px to 4px
          return (
            <motion.div
              key={i}
              className="absolute bg-[#f0c060] rounded-full shadow-[0_0_10px_2px_rgba(240,192,96,0.6)]"
              style={{ width: size, height: size, left: `${startX}vw`, top: `${startY}vh` }}
              animate={{
                y: [0, -200],
                x: [0, i % 2 === 0 ? 60 : -60],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.5
              }}
            />
          );
        })}
      </div>

      <div className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-between z-10 px-8 lg:px-16 pt-24 lg:pt-0 pb-32 lg:pb-0 gap-8">

        {/* ── LEFT COLUMN: HERO TEXT ── */}
        <div className="flex-1 w-full max-w-lg flex flex-col items-start justify-center z-20 select-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-[#b49877] block mb-4">
            <InlineEditableText
              value={content?.suitcaseSubtitle || "Your Memories. Your Journey."}
              onChange={(val) => onContentChange && onContentChange("suitcaseSubtitle", val)}
              as="span"
            />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[#f7f1e6] leading-tight drop-shadow-2xl mb-4"
            style={{ textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
            <InlineEditableText
              value={title || "Collect\nMoments,\nNot Things"}
              onChange={(val) => onTitleChange && onTitleChange(val)}
              as="p"
              className="whitespace-pre-line"
            />
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1 }}
            className="font-serif italic text-[#c4b5a3] text-lg max-w-sm">
            <InlineEditableText
              value={description || "Every adventure, beautifully preserved inside."}
              onChange={(val) => onDescriptionChange && onDescriptionChange(val)}
              as="p"
              className="whitespace-pre-line"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, rotate: -6 }} animate={{ opacity: 0.8, rotate: -4 }} transition={{ delay: 1.8 }}
            className="mt-12 font-handwriting text-3xl md:text-4xl text-[#d9ceb8] drop-shadow-sm select-none"
          >
            <InlineEditableText
              value={content?.suitcaseQuote || "Same Places,\nDifferent You ♥"}
              onChange={(val) => onContentChange && onContentChange("suitcaseQuote", val)}
              as="p"
              className="whitespace-pre-line"
            />
          </motion.div>

          {/* ── HELPER TEXT ── */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
            className="mt-12 text-[#8a755b] text-[10px] uppercase tracking-[0.4em] pointer-events-none select-none bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm"
          >
            {!unlocked ? "Click the gold lock to unlock" : !isOpen ? "Click to open suitcase" : "Hover over your memories"}
          </motion.p>
        </div>

        {/* ── RIGHT COLUMN: SUITCASE SCENE ── */}
        <div className="flex-1 flex items-center justify-center w-full h-[500px] lg:h-screen lg:pr-24 lg:pt-32" style={{ perspective: "1500px" }}>
          <div className="relative z-20 w-full max-w-[700px] aspect-[16/10]">

            {/* The polaroids */}
            <div className="absolute inset-0 z-30 pointer-events-none" style={{ transform: "translateZ(20px)" }}>
              {safeImages.map((img, i) => (
                <Polaroid key={i} img={img.url} label={img.note} scatter={SCATTER[i]} isOpen={isOpen} />
              ))}
            </div>

            {/* The Physical Suitcase Container */}
            <motion.div
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d", rotateX: rotateXContainer, rotateY: rotateYContainer }}
            >
              {/* Magical Light Beam (Synced inside container) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0, x: "-50%", z: 20 }}
                    animate={{
                      opacity: 1,
                      scaleY: 1,
                      x: "-50%",
                      z: 20
                    }}
                    exit={{ opacity: 0, scaleY: 0, x: "-50%", z: 20 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="absolute bottom-[60%] left-1/2 w-[600px] h-[800px] pointer-events-none z-20 origin-bottom"
                    style={{
                      background: "linear-gradient(to top, rgba(255,220,150,0.6) 0%, rgba(255,220,150,0.15) 50%, transparent 100%)",
                      filter: "blur(40px)",
                      mixBlendMode: "screen"
                    }}
                  />
                )}
              </AnimatePresence>
              {/* ── BASE 3D BOX (Bottom Half) ── */}
              <div className="absolute inset-x-[5%] bottom-0 h-[60%] z-10" style={{ transformStyle: "preserve-3d" }}>
                {/* BACK FACE (Inside bottom cavity) */}
                <div className="absolute inset-0 bg-[#1c0e07] flex items-center justify-center shadow-[inset_0_40px_80px_rgba(0,0,0,0.9)]" style={{ transform: "translateZ(0px)" }}>
                  <div className="absolute inset-0 bg-[#25150c] opacity-50" />
                </div>

                {/* FRONT FACE (Outside bottom) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3b2113] via-[#2a160b] to-[#1c0e07] border-x-[8px] border-b-[8px] border-[#1a0e08] shadow-[0_40px_80px_rgba(0,0,0,0.8),inset_0_-10px_30px_rgba(0,0,0,0.6)]" style={{ transform: "translateZ(40px)" }}>
                  <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at center, transparent 0%, #000 120%), url('https://www.transparenttextures.com/patterns/leather.png')" }} />
                  {/* Corner Guards */}
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-[#1a0e08] to-[#0a0502] border-t-2 border-r-2 border-[#3d2010] z-20"><div className="absolute top-4 right-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /><div className="absolute bottom-4 left-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#1a0e08] to-[#0a0502] border-t-2 border-l-2 border-[#3d2010] z-20"><div className="absolute top-4 left-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /><div className="absolute bottom-4 right-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /></div>
                  {/* Straps */}
                  <div className="absolute top-0 bottom-0 left-[22%] w-14 bg-gradient-to-r from-[#1a0f0a] via-[#2a170f] to-[#1a0f0a] shadow-[4px_0_15px_rgba(0,0,0,0.5),-4px_0_15px_rgba(0,0,0,0.5)] border-x-[1.5px] border-dashed border-[#5a4030] z-20" />
                  <div className="absolute top-0 bottom-0 right-[22%] w-14 bg-gradient-to-r from-[#1a0f0a] via-[#2a170f] to-[#1a0f0a] shadow-[4px_0_15px_rgba(0,0,0,0.5),-4px_0_15px_rgba(0,0,0,0.5)] border-x-[1.5px] border-dashed border-[#5a4030] z-20" />
                  <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-20 opacity-80 mix-blend-luminosity">
                    <div className="flex flex-col items-center"><span className="font-serif text-[#d4a843] text-xl font-bold tracking-[0.2em] drop-shadow-md">ML</span></div>
                  </div>
                </div>

                {/* SIDE WALLS FOR BASE */}
                <div className="absolute top-0 inset-x-0 h-[40px] bg-gradient-to-r from-[#2a160b] to-[#1c0e07] border-t-4 border-[#1a0e08] origin-top" style={{ transform: "rotateX(-90deg)" }} />
                <div className="absolute bottom-0 inset-x-0 h-[40px] bg-[#0a0502] border-b-8 border-[#1a0e08] origin-bottom" style={{ transform: "rotateX(90deg)" }} />
                <div className="absolute left-0 inset-y-0 w-[40px] bg-[#1c0e07] border-l-8 border-[#1a0e08] origin-left" style={{ transform: "rotateY(90deg)" }} />
                <div className="absolute right-0 inset-y-0 w-[40px] bg-[#1c0e07] border-r-8 border-[#1a0e08] origin-right" style={{ transform: "rotateY(-90deg)" }} />
              </div>

              {/* ── LID 3D BOX (Top Half) ── */}
              <motion.div
                className="absolute inset-x-[5%] top-0 h-[40%] origin-bottom z-40 pointer-events-none"
                style={{ transformStyle: "preserve-3d" }}
                initial={false}
                animate={{ rotateX: isOpen ? 70 : 0 }}
                transition={{ duration: 1.4, type: "spring", bounce: 0.25, delay: isOpen ? 0 : 0.8 }}
              >
                {/* BACK FACE (Inside top cavity facing camera when open) */}
                <div className="absolute inset-0 bg-[#25150c] border-[8px] border-[#1a0e08] shadow-[inset_0_20px_40px_rgba(0,0,0,0.9)]" style={{ transform: "translateZ(0px) rotateX(180deg)" }}>
                  <div className="absolute inset-0 opacity-20 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at center, transparent 0%, #000 120%), url('https://www.transparenttextures.com/patterns/leather.png')" }} />
                  <div className="absolute inset-4 bg-[#b5987c] opacity-90 border border-dashed border-[#5a4030] shadow-inner flex items-center justify-center">
                    <span className="font-serif italic text-[#5a4030] opacity-50 text-3xl font-bold tracking-widest">Memory Lane</span>
                  </div>
                </div>

                {/* FRONT FACE (Outside top) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#3b2113] via-[#2a160b] to-[#1c0e07] border-x-[8px] border-t-[8px] border-[#1a0e08] shadow-[inset_0_10px_30px_rgba(0,0,0,0.6)]" style={{ transform: "translateZ(40px)" }}>
                  <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at center, transparent 0%, #000 120%), url('https://www.transparenttextures.com/patterns/leather.png')" }} />
                  {/* Corner Guards */}
                  <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#1a0e08] to-[#0a0502] border-b-2 border-r-2 border-[#3d2010] z-20"><div className="absolute bottom-4 right-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /><div className="absolute top-4 left-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /></div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-tl from-[#1a0e08] to-[#0a0502] border-b-2 border-l-2 border-[#3d2010] z-20"><div className="absolute bottom-4 left-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /><div className="absolute top-4 right-4 w-3 h-3 bg-[#c8942e] rounded-full shadow-inner border border-[#7a5010]" /></div>
                  {/* Straps */}
                  <div className="absolute top-0 bottom-0 left-[22%] w-14 bg-gradient-to-r from-[#1a0f0a] via-[#2a170f] to-[#1a0f0a] shadow-[4px_0_15px_rgba(0,0,0,0.5),-4px_0_15px_rgba(0,0,0,0.5)] border-x-[1.5px] border-dashed border-[#5a4030] z-20" />
                  <div className="absolute top-0 bottom-0 right-[22%] w-14 bg-gradient-to-r from-[#1a0f0a] via-[#2a170f] to-[#1a0f0a] shadow-[4px_0_15px_rgba(0,0,0,0.5),-4px_0_15px_rgba(0,0,0,0.5)] border-x-[1.5px] border-dashed border-[#5a4030] z-20" />
                </div>

                {/* SIDE WALLS FOR LID */}
                <div className="absolute top-0 inset-x-0 h-[40px] bg-[#1c0e07] border-t-[8px] border-[#1a0e08] origin-top" style={{ transform: "rotateX(-90deg)" }} />
                <div className="absolute bottom-0 inset-x-0 h-[40px] bg-gradient-to-r from-[#2a160b] to-[#1c0e07] border-b-4 border-[#1a0e08] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] origin-bottom" style={{ transform: "rotateX(90deg)" }} />
                <div className="absolute left-0 inset-y-0 w-[40px] bg-[#1c0e07] border-l-[8px] border-[#1a0e08] origin-left" style={{ transform: "rotateY(90deg)" }} />
                <div className="absolute right-0 inset-y-0 w-[40px] bg-[#1c0e07] border-r-[8px] border-[#1a0e08] origin-right" style={{ transform: "rotateY(-90deg)" }} />

                {/* TOP CARRY HANDLE */}
                <div className="absolute -top-8 left-1/2 w-48 h-12 flex justify-between z-10 items-end px-2" style={{ transform: "translateX(-50%) translateZ(20px)" }}>
                  <div className="w-6 h-8 bg-gradient-to-br from-[#c8942e] to-[#7a5010] rounded-t-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] border border-[#3d2010]" />
                  <div className="w-6 h-8 bg-gradient-to-br from-[#c8942e] to-[#7a5010] rounded-t-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] border border-[#3d2010]" />
                  <div className="absolute top-0 left-0 w-full h-7 bg-gradient-to-b from-[#2a170f] to-[#1a0f0a] rounded-t-2xl border border-[#3d2010] shadow-[0_-5px_15px_rgba(0,0,0,0.6)]" />
                </div>
              </motion.div>

              {/* CENTER SEAM & GOLD LOCK (Positioned perfectly on the front face) */}
              <div className="absolute inset-x-[5%] top-[40%] -translate-y-1/2 h-14 z-50 pointer-events-none flex items-center justify-center" style={{ transform: "translateZ(45px)" }}>
                <div className="absolute inset-x-0 h-3 bg-gradient-to-b from-[#d4a843] via-[#8a6520] to-[#c8942e] shadow-[0_2px_10px_rgba(0,0,0,0.8)] border-y border-[#5a4030]" />

                <div className="absolute left-[22%] w-16 h-12 bg-gradient-to-br from-[#1a0f0a] to-[#0a0502] border-x-2 border-[#c8942e] shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center rounded-sm">
                  <div className="w-10 h-6 border-[4px] border-[#c8942e] rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
                </div>
                <div className="absolute right-[22%] w-16 h-12 bg-gradient-to-br from-[#1a0f0a] to-[#0a0502] border-x-2 border-[#c8942e] shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center rounded-sm">
                  <div className="w-10 h-6 border-[4px] border-[#c8942e] rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
                </div>

                <button
                  onClick={handleLockClick}
                  className="relative w-24 h-24 bg-gradient-to-br from-[#f0c060] via-[#c8942e] to-[#7a5010] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_4px_8px_rgba(255,255,200,0.6)] border-[6px] border-[#1a0f0a] flex flex-col items-center justify-center pointer-events-auto hover:scale-105 active:scale-95 transition-transform duration-200 group"
                  style={{ zIndex: 60 }}
                >
                  <AnimatePresence mode="wait">
                    {!unlocked ? (
                      <motion.svg key="locked" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f120c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </motion.svg>
                    ) : (
                      <motion.svg key="unlocked" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f120c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR (Bottom) ── */}
      <motion.div
        className="absolute bottom-8 left-0 w-full flex justify-center z-50 pointer-events-none"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 bg-[#1a120e]/60 backdrop-blur-md px-12 py-5 rounded-full border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
          {[
            { vKey: "statVal0", lKey: "statLbl0", defVal: "12", defLbl: "Countries" },
            { vKey: "statVal1", lKey: "statLbl1", defVal: "250+", defLbl: "Memories" },
            { vKey: "statVal2", lKey: "statLbl2", defVal: "35", defLbl: "Cities" },
            { vKey: "statVal3", lKey: "statLbl3", defVal: "Countless", defLbl: "Stories" },
          ].map(({ vKey, lKey, defVal, defLbl }, i, arr) => (
            <React.Fragment key={vKey}>
              <div className="flex flex-col items-center">
                <span className="text-xl md:text-2xl font-serif text-[#e5d5be] italic">
                  <InlineEditableText
                    value={content?.[vKey] || defVal}
                    onChange={(val) => onContentChange && onContentChange(vKey, val)}
                  />
                </span>
                <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#8a755b] mt-1">
                  <InlineEditableText
                    value={content?.[lKey] || defLbl}
                    onChange={(val) => onContentChange && onContentChange(lKey, val)}
                  />
                </span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-white/10" />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      </div>

      {/* ── SECTION 2: TRAVEL MAP ── */}
      <TravelMapLayout images={images} content={content} onContentChange={onContentChange} />

      {/* ── SECTION 3: 3D INFINITE TUNNEL ── */}
      <TravelTunnelLayout images={images} content={content} onContentChange={onContentChange} />

      {/* ── SECTION 4: 3D ASTROLABE ── */}
      <TravelAstrolabeLayout images={images} content={content} onContentChange={onContentChange} />
    </main>
  );
}
