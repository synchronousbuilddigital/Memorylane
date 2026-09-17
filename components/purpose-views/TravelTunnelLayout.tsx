"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import InlineEditableText from "@/components/InlineEditableText";
import { useCoarsePointer } from "@/lib/useCoarsePointer";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/* ── PLACEHOLDERS ── */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504280655513-890259b6911c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop",
];

const LABELS = [
  "Swiss Alps", "Norwegian Fjords", "Patagonia", "Kyoto, Japan",
  "Bali, Indonesia", "Iceland", "New York", "Santorini",
  "Dubai", "Grand Canyon", "Maldives", "Yosemite",
];

/* ── TUNNEL CONSTANTS ── */
const RING_COUNT      = 24;
const IMAGES_PER_RING = 3;
const RING_SPACING    = 600;
const TUNNEL_LENGTH   = RING_COUNT * RING_SPACING;
const INERTIA         = 0.88;
const SCROLL_SPEED    = 3.5;

/* ── RING POSITIONS — spiral helix ── 
   Each ring rotates by 20° relative to the previous one, 
   so 3 photos form a slowly-spinning triangle as you fly deeper.
   This creates an authentic cylindrical tunnel feel.             */
const HELIX_RADIUS  = 260;  // cylinder radius (px) — keeps photos on-screen
const HELIX_STEP    = 22;   // degrees rotation per ring (controls spiral speed)
const HELIX_Y_BIAS  = -60;  // shift whole circle slightly up to look centred

function getRingPositions(ringIndex: number) {
  // Base angle for this ring (spiral grows with depth)
  const baseRad = (ringIndex * HELIX_STEP * Math.PI) / 180;

  return [0, 1, 2].map((i) => {
    const angle  = baseRad + (i * (2 * Math.PI)) / 3; // 120° apart
    const x      = Math.cos(angle) * HELIX_RADIUS;
    const y      = Math.sin(angle) * HELIX_RADIUS + HELIX_Y_BIAS;
    // Tilt each card inward so it faces the camera as it passes
    const rotY   = -Math.cos(angle) * 22;
    const rotX   =  Math.sin(angle) * 12;
    const scale  = 0.92 + (i === 0 ? 0.08 : 0);
    return { x, y, rotY, rotX, scale };
  });
}

/* ── SINGLE PHOTO CARD ── */
function TunnelCard({
  src, label, ringIndex, posIndex, tunnelZ, onClick,
}: {
  src: string; label: string; ringIndex: number; posIndex: number;
  tunnelZ: number; onClick: () => void;
}) {
  const pos       = getRingPositions(ringIndex)[posIndex];
  const absoluteZ = -(ringIndex * RING_SPACING) + tunnelZ;
  const clampedZ  = ((absoluteZ % TUNNEL_LENGTH) + TUNNEL_LENGTH) % TUNNEL_LENGTH;
  const nearCam   = clampedZ > TUNNEL_LENGTH * 0.76;
  const opacity   = nearCam ? Math.max(0, 1 - (clampedZ - TUNNEL_LENGTH * 0.76) / (TUNNEL_LENGTH * 0.09)) : 1;

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        transform: `translate3d(${pos.x}px,${pos.y}px,${-(ringIndex * RING_SPACING)}px) rotateY(${pos.rotY}deg) rotateX(${pos.rotX}deg) scale(${pos.scale})`,
        opacity,
        transition: "opacity 0.2s ease",
        willChange: "opacity, transform",
      }}
      onClick={onClick}
    >
      {/* Warm gold glow halo */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: "0 0 50px 10px rgba(212,168,67,0.12), 0 0 100px 20px rgba(200,148,46,0.07)",
          filter: "blur(2px)",
        }}
      />
      {/* Polaroid-style card */}
      <div
        className="relative bg-[#fdfbf7] rounded-sm overflow-hidden"
        style={{
          width: 200,
          paddingBottom: 14,
          boxShadow: "0 24px 70px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,240,200,0.06)",
          border: "1px solid rgba(229,223,213,0.3)",
        }}
      >
        {/* Washi tape strip at top */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-[#f4ead5]/70 rotate-[-1deg] shadow-sm z-10" />
        <div className="relative w-full overflow-hidden" style={{ height: 164 }}>
          <Image src={src} alt={label} fill sizes="200px" className="object-cover sepia-[.08] contrast-[1.04]" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
        <div className="px-3 pt-3 pb-0.5 text-center">
          <span
            className="block text-[#2c241b] text-xs font-medium truncate"
            style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── LIGHTBOX ── */
function TunnelLightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-4xl w-full mx-8"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          <Image src={src} alt={label} fill className="object-cover sepia-[.08]" unoptimized />
        </div>
        <p className="text-center text-[#b49877] mt-4 text-lg" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
          {label}
        </p>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-[#2a160b]/80 hover:bg-[#3a2215] rounded-full flex items-center justify-center text-[#d4a843] backdrop-blur-md border border-[#d4a843]/20 transition-colors"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function TravelTunnelLayout({ 
  images = [],
  content = {},
  onContentChange 
}: { 
  images?: any[];
  content?: any;
  onContentChange?: (key: string, val: string) => void;
}) {

  /* ── Source images (slot position 2) ── */
  const slotImages  = images.filter((img) => img?.position === 2);
  const rawImages   = slotImages.length > 0 ? slotImages : [];
  const totalNeeded = RING_COUNT * IMAGES_PER_RING;
  const sourceList: { src: string; label: string }[] = Array.from({ length: totalNeeded }, (_, i) => {
    const img = rawImages[i % Math.max(rawImages.length, 1)];
    return {
      src:   img?.displayUrl || img?.originalUrl || img?.url || PLACEHOLDERS[i % PLACEHOLDERS.length],
      label: img?.caption    || img?.note        || LABELS[i % LABELS.length],
    };
  });

  /* ── Scroll-driven tunnel Z ── */
  const tunnelZRef   = useRef(0);
  const velocityRef  = useRef(0);
  const rafRef       = useRef<number>(0);
  const isHoveredRef = useRef(false);
  const coarse       = useCoarsePointer();
  const [tunnelZ, setTunnelZ]       = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  /* ── Mouse parallax ── */
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 18 });

  const tunnelPanelRef = useRef<HTMLDivElement>(null);

  /* ── RAF inertia loop ── */
  useEffect(() => {
    const loop = () => {
      if (Math.abs(velocityRef.current) > 0.05) {
        tunnelZRef.current += velocityRef.current;
        tunnelZRef.current  = ((tunnelZRef.current % TUNNEL_LENGTH) + TUNNEL_LENGTH) % TUNNEL_LENGTH;
        velocityRef.current *= INERTIA;
        setTunnelZ(tunnelZRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Wheel — only fires when right panel is hovered ── */
  useEffect(() => {
    const el = tunnelPanelRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!isHoveredRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      velocityRef.current += e.deltaY * SCROLL_SPEED * 0.01;
      velocityRef.current  = Math.max(-40, Math.min(40, velocityRef.current));
      setHasScrolled(true);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ── Touch — a sideways drag flies the tunnel ──
     The wheel path above is gated on isHoveredRef, which never becomes true on a
     phone, so the tunnel was frozen. Horizontal is the right axis to borrow: the
     panel keeps touch-action pan-y, so a vertical swipe still scrolls the page
     and this gesture never has to fight it. The tunnel loops, so there is no end
     to hand scrolling back at — which is exactly why it must not take vertical. */
  useEffect(() => {
    const el = tunnelPanelRef.current;
    if (!el) return;
    let lastX: number | null = null;
    const onStart = (e: TouchEvent) => { lastX = e.touches[0]?.clientX ?? null; };
    const onMove = (e: TouchEvent) => {
      const x = e.touches[0]?.clientX;
      if (x == null || lastX == null) return;
      const dx = lastX - x;
      lastX = x;
      velocityRef.current += dx * SCROLL_SPEED * 0.05;
      velocityRef.current = Math.max(-40, Math.min(40, velocityRef.current));
      setHasScrolled(true);
    };
    const onEnd = () => { lastX = null; };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = tunnelPanelRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width  - 0.5) * 100);
    mouseY.set(((e.clientY - rect.top)  / rect.height - 0.5) * 70);
  }, [mouseX, mouseY]);

  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const progress = Math.round((tunnelZ / TUNNEL_LENGTH) * 100);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100vh", background: "#0a0705" }}
    >
      {/* ── SHARED FULL-WIDTH BACKGROUND LAYERS ── */}
      {/* Vintage map texture — same as suitcase slot */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "sepia(0.8) contrast(1.2)",
        }}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0502_100%)] pointer-events-none" />
      {/* Warm golden centre glow — unifies both panels */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 55% at 60% 50%, rgba(212,168,67,0.07) 0%, transparent 70%)" }}
      />

      {/* ── GOLDEN DUST PARTICLES (full width) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const startX = (i * 17) % 100;
          const startY = (i * 23) % 100;
          const dur    = 10 + (i % 10) * 2;
          const size   = (i % 3) + 2;
          return (
            <motion.div
              key={i}
              className="absolute bg-[#f0c060] rounded-full shadow-[0_0_10px_2px_rgba(240,192,96,0.6)]"
              style={{ width: size, height: size, left: `${startX}vw`, top: `${startY}vh` }}
              animate={{ y: [0, -200], x: [0, i % 2 === 0 ? 60 : -60], opacity: [0, 0.7, 0] }}
              transition={{ duration: dur, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
            />
          );
        })}
      </div>

      {/* ════════════════════════════════
           SPLIT LAYOUT  (left | right)
          Seamlessly blended — no divider
          ════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row w-full" style={{ minHeight: "100vh" }}>

        {/* ══════════════════════════════════
             LEFT — Vintage Text Panel
            ══════════════════════════════════ */}
        <div className="relative flex flex-col justify-center w-full lg:w-[42%] px-10 md:px-16 py-20 lg:py-32 z-10 shrink-0">
          {/* Gradient that fades into the shared background — no hard edge */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0705]/95 via-[#0a0705]/80 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-md">

            {/* Section tag */}
            <motion.div
              className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-[#b49877] mb-5 font-semibold"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            >
              <InlineEditableText
                value={content?.tunnelTag || "Section III · Memory Tunnel"}
                onChange={(val) => onContentChange && onContentChange("tunnelTag", val)}
                as="span"
              />
            </motion.div>

            {/* Headline */}
            <motion.h2
              className="text-4xl md:text-5xl xl:text-6xl font-bold text-[#f7f1e6] leading-tight mb-6"
              style={{ fontFamily: "'Georgia', serif", textShadow: "0 4px 20px rgba(212,168,67,0.25)" }}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 1 }}
            >
              <InlineEditableText
                value={content?.tunnelTitle || "Through\nThe Tunnel"}
                onChange={(val) => onContentChange && onContentChange("tunnelTitle", val)}
                as="p"
                className="whitespace-pre-line"
              />
            </motion.h2>

            {/* Gold divider */}
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              style={{ originX: 0 }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-[#d4a843]/50 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-[#d4a843]/50" />
            </motion.div>

            {/* Description */}
            <motion.div
              className="text-[#c4b5a3] text-base md:text-lg leading-relaxed mb-10"
              style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            >
              <InlineEditableText
                value={content?.tunnelDesc || "Every memory rushes toward you in an\ninfinite tunnel of warmth and light.\nHover over the right side and scroll\nto fly through your journey."}
                onChange={(val) => onContentChange && onContentChange("tunnelDesc", val)}
                as="p"
                className="whitespace-pre-line"
              />
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex gap-10 mb-12"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }}
            >
              {[
                { val: rawImages.length > 0 ? `${rawImages.length}` : "∞", label: "Photos" },
                { val: `${RING_COUNT}`, label: "Rings"  },
                { val: "∞",            label: "Loop"   },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-2xl font-bold text-[#e5d5be] italic" style={{ fontFamily: "'Georgia', serif" }}>{val}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#8a755b] mt-1">{label}</span>
                </div>
              ))}
            </motion.div>

            {/* Scroll hint — vintage badge */}
            <motion.div
              className="inline-flex items-center gap-3 bg-[#1a120e]/60 border border-[#d4a843]/20 rounded-full px-5 py-3 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.7 }}
            >
              <div className="w-5 h-8 rounded-full border border-[#d4a843]/40 flex items-start justify-center pt-1 shrink-0">
                <motion.div
                  className="w-1 h-2 bg-[#d4a843]/80 rounded-full"
                  animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-[#8a755b] text-xs uppercase tracking-[0.3em] font-semibold">
                Scroll on the tunnel →
              </span>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#5a4d41] text-[10px] uppercase tracking-[0.3em]">Journey progress</span>
                <span className="text-[#d4a843]/60 text-[10px] font-bold">{progress}%</span>
              </div>
              <div className="w-full h-px bg-[#3a2215] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #c8942e, #f0c060)",
                  }}
                />
              </div>
            </motion.div>

          </div>
        </div>

        {/* ══════════════════════════════════════
             RIGHT — 3D Tunnel (no background)
             Sits on the shared section background
            ══════════════════════════════════════ */}
        <div
          ref={tunnelPanelRef}
          className="relative w-full lg:w-[58%] overflow-hidden"
          style={{ minHeight: "100vh", touchAction: "pan-y" }}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            mouseX.set(0);
            mouseY.set(0);
          }}
          onMouseMove={handleMouseMove}
        >
          {/* Left-edge gradient — narrow, just covers the seam */}
          <div
            className="absolute inset-y-0 left-0 z-20 pointer-events-none"
            style={{
              width: "80px",
              background: "linear-gradient(to right, #0a0705 0%, rgba(10,7,5,0.6) 60%, transparent 100%)",
            }}
          />
          {/* Right, top, bottom soft fades */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0705]/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0705]/50 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0705]/80 to-transparent z-20 pointer-events-none" />

          {/* Warm golden radial glow centred on tunnel */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 55% 50%, rgba(212,168,67,0.09) 0%, rgba(160,100,20,0.04) 50%, transparent 75%)" }}
          />

          {/* 3D Tunnel Viewport */}
          <div
            className="absolute inset-0 flex items-center justify-center scale-[0.52] sm:scale-[0.72] lg:scale-100"
            style={{ perspective: "1100px", perspectiveOrigin: "50% 50%" }}
          >
            <motion.div
              className="relative"
              style={{ transformStyle: "preserve-3d", x: smoothX, y: smoothY }}
            >
              <div style={{ transformStyle: "preserve-3d", transform: `translateZ(${tunnelZ}px)` }}>

                {/* Photo cards */}
                {Array.from({ length: RING_COUNT }).map((_, ringIndex) =>
                  Array.from({ length: IMAGES_PER_RING }).map((_, posIndex) => {
                    const flatIndex = ringIndex * IMAGES_PER_RING + posIndex;
                    const { src, label } = sourceList[flatIndex];
                    return (
                      <TunnelCard
                        key={`card-${ringIndex}-${posIndex}`}
                        src={src} label={label}
                        ringIndex={ringIndex} posIndex={posIndex}
                        tunnelZ={tunnelZ}
                        onClick={() => setLightbox({ src, label })}
                      />
                    );
                  })
                )}

                {/* Vanishing point warm glow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 4, height: 4, marginLeft: -2, marginTop: -2,
                    transform: `translateZ(${-TUNNEL_LENGTH * 0.8}px)`,
                    boxShadow: "0 0 200px 80px rgba(212,168,67,0.18), 0 0 400px 160px rgba(200,120,20,0.08)",
                    borderRadius: "50%",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Scroll hint — shown until first scroll */}
          <AnimatePresence>
            {!hasScrolled && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
              >
                <motion.div
                  className="flex flex-col items-center gap-3 mt-32"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-8 h-14 rounded-full border-2 border-[#d4a843]/30 flex items-start justify-center pt-2">
                    <motion.div
                      className="w-1.5 h-3 bg-[#d4a843]/70 rounded-full"
                      animate={coarse ? { x: [0, 14, 0], opacity: [1, 0.2, 1] } : { y: [0, 14, 0], opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <span className="text-[#8a755b] text-[11px] uppercase tracking-[0.4em] font-semibold text-center">
                    {coarse ? <>Swipe sideways<br />to fly through</> : <>Hover &amp; scroll<br />to fly through</>}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom controls — vintage style */}
          <div className="absolute bottom-6 left-0 w-full flex justify-center z-30 pointer-events-none">
            <div className="flex items-center gap-5 bg-[#1a120e]/60 backdrop-blur-xl border border-[#d4a843]/15 px-6 py-3 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <button
                className="text-[#8a755b] hover:text-[#d4a843] text-xs font-bold uppercase tracking-widest pointer-events-auto transition-colors px-2 py-1 rounded-full hover:bg-[#2a160b]/60"
                onClick={() => { velocityRef.current = -18; }}
              >
                ← Back
              </button>
              {/* Animated waveform in gold */}
              <div className="flex gap-1 items-end h-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-[#d4a843]/50 rounded-full"
                    animate={{ height: [4, 14, 4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <button
                className="text-[#8a755b] hover:text-[#d4a843] text-xs font-bold uppercase tracking-widest pointer-events-auto transition-colors px-2 py-1 rounded-full hover:bg-[#2a160b]/60"
                onClick={() => { velocityRef.current = 18; }}
              >
                Forward →
              </button>
            </div>
          </div>

        </div>{/* end right panel */}
      </div>{/* end split row */}

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox && (
          <TunnelLightbox src={lightbox.src} label={lightbox.label} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
