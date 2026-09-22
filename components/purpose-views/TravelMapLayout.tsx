"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import InlineEditableText from "@/components/InlineEditableText";

const Lightbox = dynamic(() => import("@/components/Lightbox"), { ssr: false });

const MAP_LOCATIONS = [
  { id: "sf", label: "San Francisco", x: 18, y: 35, rotate: -3 },
  { id: "ny", label: "New York", x: 28, y: 30, rotate: 2 },
  { id: "miami", label: "Miami", x: 26, y: 45, rotate: -2 },
  { id: "rio", label: "Rio de Janeiro", x: 34, y: 70, rotate: 4 },
  { id: "london", label: "London", x: 44, y: 25, rotate: -4 },
  { id: "paris", label: "Paris", x: 49, y: 28, rotate: 1 },
  { id: "rome", label: "Rome", x: 54, y: 32, rotate: -2 },
  { id: "cape", label: "Cape Town", x: 52, y: 75, rotate: 3 },
  { id: "dubai", label: "Dubai", x: 60, y: 45, rotate: -3 },
  { id: "mumbai", label: "Mumbai", x: 66, y: 52, rotate: 2 },
  { id: "bangkok", label: "Bangkok", x: 74, y: 55, rotate: -1 },
  { id: "bali", label: "Bali", x: 76, y: 70, rotate: 4 },
  { id: "tokyo", label: "Tokyo", x: 84, y: 35, rotate: -3 },
  { id: "sydney", label: "Sydney", x: 85, y: 78, rotate: 2 },
  { id: "fiji", label: "Fiji", x: 88, y: 65, rotate: -2 },
];

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1496442226666-8d4d0e62e6e9", // NY
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1", // Paris
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1503899036084-c55cdd92da26", // Tokyo
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1537996194471-e657df975ab4", // Bali
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1483729558449-99ef09a8c325", // Rio
];

/* ── LOOP TIMING ──
   Total entry time for 15 pins:
     last pin delay = (14-1)*0.8 + 2.5 = 12.9s, spring duration 1.5s → finishes ~14.4s
   VISIBLE_PAUSE: how long all pins stay shown before retracting
   EXIT_DURATION: how long the retract animation takes
   RESET_GAP: pause between retract finishing and next entry                       */
const ENTER_TOTAL_MS  = 17000; // ms until we trigger exit (entry anim + visible pause)
const EXIT_DURATION_MS = 1000; // ms for retract animation
const RESET_GAP_MS     =  600; // ms gap before next loop starts

type Phase = "ENTERING" | "EXITING";

function PolaroidPin({ x, y, rotate, img, label, delay, onClick, phase }: any) {
  const isExiting = phase === "EXITING";
  return (
    <motion.div
      className="absolute z-20 cursor-pointer flex flex-col items-center origin-top"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, y: 50, x: "-50%" }}
      animate={
        isExiting
          ? { opacity: 0, scale: 0, y: 60, x: "-50%" }
          : { opacity: 1, scale: 1, y: "-10px", x: "-50%" }
      }
      transition={
        isExiting
          ? { duration: EXIT_DURATION_MS / 1000, ease: "easeIn" }
          : { type: "spring", bounce: 0.4, duration: 1.5, delay }
      }
      whileHover={isExiting ? {} : { scale: 1.2, zIndex: 50, y: "-30px", x: "-50%", rotate: 0 }}
      onClick={isExiting ? undefined : onClick}
    >
      {/* The Pin / String */}
      <div className="w-[2px] h-8 bg-gradient-to-b from-white/60 to-transparent absolute top-2 left-1/2 -translate-x-1/2 origin-top z-10" />
      <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-[0_2px_8px_rgba(255,0,0,0.8)] absolute top-0 left-1/2 -translate-x-1/2 z-20" />

      {/* Polaroid Body */}
      <motion.div
        className="bg-[#fdfbf7] p-1.5 sm:p-2 md:p-3 pb-6 sm:pb-8 md:pb-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] rounded-sm border border-[#e5dfd5] w-14 sm:w-20 md:w-28 lg:w-32 mt-6 relative"
        animate={{ rotate: isExiting ? 0 : rotate }}
        whileHover={isExiting ? {} : { rotate: 0, scale: 1.05 }}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-200 shadow-inner">
          <Image src={img} alt={label} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none" />
        </div>
        <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 text-center w-full px-2">
          <span className="font-handwriting text-[#2c241b] text-xs sm:text-base md:text-xl opacity-90 inline-block -rotate-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[90%]">
            {label}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TravelMapLayout({ 
  images = [],
  content = {},
  onContentChange 
}: { 
  images?: any[];
  content?: any;
  onContentChange?: (key: string, val: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Grab all images assigned to Position 1 (Map Journey slot)
  const mapImages = images.filter(img => img.position === 1).sort((a, b) => {
    // Sort by creation date if available so the journey sequence makes sense
    if (a.createdAt && b.createdAt) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  // If the user hasn't uploaded anything, default to showing 5 placeholders so the map isn't completely empty
  const itemsToRender = mapImages.length > 0 ? mapImages : Array(5).fill(null);

  // Map the items to the physical coordinates in sequence
  const safeImages = itemsToRender.map((img, i) => {
    if (i >= 15) return null; // Cap at 15 max
    const loc = MAP_LOCATIONS[i];
    const resolvedUrl = img?.originalUrl || img?.url || PLACEHOLDERS[i % PLACEHOLDERS.length];
    return {
      ...img,
      url: resolvedUrl,
      displayUrl: resolvedUrl,
      note: img?.caption || img?.note || loc.label,
      ...loc
    };
  }).filter(Boolean) as any[];

  const [activeImage, setActiveImage] = useState<number | null>(null);

  /* A 16:9 map cannot cover a 9:19.5 screen without running far past both edges,
     taking the pins with it. Below lg it becomes a centred band instead. */
  const [narrowMap, setNarrowMap] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrowMap(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Infinite loop state ──
  const [phase, setPhase]       = useState<Phase>("ENTERING");
  const [cycleKey, setCycleKey] = useState(0); // incrementing forces fresh re-mount of pins

  useEffect(() => {
    let enterTimer: ReturnType<typeof setTimeout>;
    let exitTimer:  ReturnType<typeof setTimeout>;
    let resetTimer: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      setPhase("ENTERING");
      // After all pins have dropped in + visible pause, start the exit
      enterTimer = setTimeout(() => {
        setPhase("EXITING");
        // After exit animation finishes, bump cycleKey to remount pins fresh
        exitTimer = setTimeout(() => {
          setCycleKey((k) => k + 1);
          // Small gap then restart
          resetTimer = setTimeout(runCycle, RESET_GAP_MS);
        }, EXIT_DURATION_MS + 200);
      }, ENTER_TOTAL_MS);
    };

    runCycle();
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(resetTimer);
    };
  }, []);

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const spX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const spY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const rotateYContainer = useTransform(spX, [0, 1], [-8, 8]);
  const rotateXContainer = useTransform(spY, [0, 1], [8, -8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div 
      className="relative min-h-screen w-full bg-[#051014] overflow-hidden font-sans select-none flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
      style={{ perspective: "2000px" }}
    >
      {/* ── BACKGROUND AMBIENCE ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1518] to-[#020508] pointer-events-none" />
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle at center, rgba(100,180,255,0.1) 0%, transparent 70%)" }} />

      {/* ── 3D MAP CONTAINER ── */}
      <motion.div 
        className="absolute z-10"
        style={{
          // Portrait gets a wide band instead of a full-bleed cover: the whole
          // map, and therefore every pin, stays on screen.
          width: narrowMap ? "132vw" : "max(120vw, 120vh * (16/9))",
          height: narrowMap ? "calc(132vw * 9 / 16)" : "max(120vh, 120vw * (9/16))",
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          rotateX: rotateXContainer,
          rotateY: rotateYContainer,
          transformStyle: "preserve-3d"
        }}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        {/* The World Map Image Layer */}
        <div className="absolute inset-0 z-0" style={{ transform: "translateZ(-50px)" }}>
          <Image 
            src="/3d-world-map.jpg" 
            alt="3D World Map" 
            fill 
            className="object-cover drop-shadow-2xl opacity-90" 
            priority
            unoptimized={true}
          />
          {/* Vignette Overlay to darken edges and focus center */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#020508] via-transparent to-[#020508] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,1)] pointer-events-none" />
        </div>

        {/* ── THE FLIGHT PATHS (SVG) ── */}
        <div className="absolute inset-0 z-10" style={{ transform: "translateZ(20px)" }}>
          {safeImages.map((loc, i) => {
            if (i === safeImages.length - 1) return null;
            const nextLoc = safeImages[i + 1];
            // We need to convert % to absolute values based on the viewBox, but since the container is relatively sized,
            // we can use percentages inside the SVG if we wrap it in a 100x100 viewBox.
            return (
              <svg key={`path-${cycleKey}-${i}`} className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                  d={`M ${loc.x} ${loc.y} Q ${(loc.x + nextLoc.x) / 2} ${Math.min(loc.y, nextLoc.y) - 6} ${nextLoc.x} ${nextLoc.y}`}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="0.25"
                  strokeDasharray="1 1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    phase === "EXITING"
                      ? { pathLength: 0, opacity: 0 }
                      : { pathLength: 1, opacity: 1 }
                  }
                  transition={
                    phase === "EXITING"
                      ? { duration: EXIT_DURATION_MS / 1000, ease: "easeIn" }
                      : { duration: 1.5, ease: "easeInOut", delay: i * 0.8 + 1 }
                  }
                />
              </svg>
            );
          })}
        </div>

        {/* ── THE POLAROID PINS ── */}
        {/* cycleKey forces a full remount so entry delays replay from scratch each loop */}
        <div key={cycleKey} className="absolute inset-0 z-20" style={{ transform: "translateZ(50px)" }}>
          {safeImages.map((loc, i) => (
            <PolaroidPin
              key={i}
              x={loc.x}
              y={loc.y}
              rotate={loc.rotate}
              img={loc.url}
              label={loc.note}
              delay={i === 0 ? 1 : (i - 1) * 0.8 + 2.5}
              phase={phase}
              onClick={() => setActiveImage(i)}
            />
          ))}
        </div>
      </motion.div>

      {/* ── FLOATING CLOUDS / FOG (Foreground parallax) ── */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-30 opacity-20 mix-blend-screen"
        style={{ 
          backgroundImage: "url('https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2560/memory_lane/stock/photo-1550684376-efcbd6e3f031')",
          backgroundSize: "cover",
          x: useTransform(spX, [0, 1], [-50, 50]),
          y: useTransform(spY, [0, 1], [-50, 50]),
          filter: "blur(20px)"
        }}
      />

      {/* ── HEADER ── */}
      <motion.div 
        className="absolute top-8 md:top-12 w-full text-center z-40 pointer-events-auto"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <h1 className="font-serif text-5xl md:text-6xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          <InlineEditableText
            value={content?.mapTitle || "Explore Your World"}
            onChange={(val) => onContentChange && onContentChange("mapTitle", val)}
            as="span"
          />
        </h1>
        <p className="font-handwriting text-2xl md:text-3xl text-[#b4cdd6] mt-4 opacity-90" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
          <InlineEditableText
            value={content?.mapSubtitle || "Every pin tells a story."}
            onChange={(val) => onContentChange && onContentChange("mapSubtitle", val)}
            as="span"
          />
        </p>
      </motion.div>

      {/* ── STATS BAR (Bottom) ── */}
      <motion.div
        className="absolute bottom-8 left-0 w-full flex justify-center z-40 pointer-events-none"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 bg-[#0a1518]/60 backdrop-blur-md px-10 py-5 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
          {[["12", "Countries"], ["250+", "Memories"], ["35+", "Cities"], ["Countless", "Adventures"]].map(([val, lbl], i, arr) => (
            <React.Fragment key={lbl}>
              <div className="flex flex-col items-center">
                <span className="text-xl md:text-2xl font-serif text-[#e0ecef] italic">{val}</span>
                <span className="text-[9px] md:text-[10px] font-sans uppercase tracking-[0.3em] text-[#86a2ab] mt-1">{lbl}</span>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-white/10 hidden md:block" />}
            </React.Fragment>
          ))}
          
          <button className="ml-4 bg-white text-black font-semibold px-6 py-2 rounded-full text-sm pointer-events-auto hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            View My Journey →
          </button>
        </div>
      </motion.div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {activeImage !== null && (
          <Lightbox 
            images={safeImages as any} 
            currentIndex={activeImage}
            onClose={() => setActiveImage(null)} 
            onNavigate={(newIndex) => setActiveImage(newIndex)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
