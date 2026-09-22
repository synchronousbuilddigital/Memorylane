"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Mouse, X } from "lucide-react";
import InlineEditableText from "@/components/InlineEditableText";

/* ────────────────────────────────────────────────────────────────────────────
   Birthday Skies — floating glowing photo cubes
   Each cube carries six photographs and turns as it drifts up through the
   night, a handwritten caption hanging beneath it. Captions are editable in
   the editor; a click opens the cube's photo. The section is transparent at
   its edges so the album's shared sky shows through and it blends into the
   next chapter.
   ──────────────────────────────────────────────────────────────────────────── */

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511795409834-ef04bbd61622",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1469474968028-56623f02e42e",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1501785888041-af3ef285b470",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1464349095431-e9a21285b5f3",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1609234656388-0ff363383899",
];
const DEFAULT_CAPTIONS_S1 = ["Some Madness ♡", "Good Friends ♡", "Next Stop More Life ♡", "Unforgettable ♡", "Cheers ♡"];

const CUBE_SIZE = 220;
const H = CUBE_SIZE / 2;

function GlowingLanternCube({
  imgs, caption, speed = 14, initialRotation = 0, onCaptionChange,
}: { imgs: string[]; caption: string; speed?: number; initialRotation?: number; onCaptionChange?: (v: string) => void }) {
  const PolaroidFace = ({ src, transform, opacity = 1 }: { src: string; transform: string; opacity?: number }) => (
    <div style={{
      position: "absolute", inset: 0, transform,
      border: "2px solid rgba(201,162,74,0.6)", boxSizing: "border-box",
      overflow: "hidden", opacity, background: "#0a0500",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="memory" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 80%, rgba(255,177,94,0.18) 0%, transparent 65%)",
        pointerEvents: "none", mixBlendMode: "overlay",
      }} />
    </div>
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      filter: "drop-shadow(0 0 18px rgba(255,177,94,0.85)) drop-shadow(0 0 45px rgba(255,150,80,0.5)) drop-shadow(0 0 80px rgba(200,120,60,0.3))",
    }}>
      <div style={{ width: CUBE_SIZE, height: CUBE_SIZE, perspective: 900 }}>
        <motion.div
          style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
          animate={{ rotateY: [initialRotation, initialRotation + 360], rotateX: [4, 9, 4, 0, 4] }}
          transition={{
            rotateY: { duration: speed, repeat: Infinity, ease: "linear" },
            rotateX: { duration: speed * 1.4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.div
            style={{
              position: "absolute", top: "50%", left: "50%", width: 88, height: 88,
              transform: "translateX(-50%) translateY(-50%) translateZ(0px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,240,210,1) 0%, rgba(255,201,138,0.95) 28%, rgba(255,150,80,0.8) 55%, transparent 78%)",
              pointerEvents: "none",
            }}
            animate={{ scale: [1, 1.12, 0.93, 1.08, 1], opacity: [0.88, 1, 0.82, 1, 0.88] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <PolaroidFace src={imgs[0]} transform={`translateZ(${H}px)`} opacity={1} />
          <PolaroidFace src={imgs[1]} transform={`rotateY(180deg) translateZ(${H}px)`} opacity={0.97} />
          <PolaroidFace src={imgs[2]} transform={`rotateY(90deg) translateZ(${H}px)`} opacity={0.95} />
          <PolaroidFace src={imgs[3]} transform={`rotateY(-90deg) translateZ(${H}px)`} opacity={0.95} />
          <PolaroidFace src={imgs[4]} transform={`rotateX(90deg) translateZ(${H}px)`} opacity={0.92} />
          <PolaroidFace src={imgs[5]} transform={`rotateX(-90deg) translateZ(${H}px)`} opacity={0.92} />
        </motion.div>
      </div>
      <svg width={CUBE_SIZE * 0.6} height={44} style={{ display: "block", marginTop: 0 }} overflow="visible">
        <line x1="20%" y1="0" x2="50%" y2="100%" stroke="rgba(201,162,74,0.7)" strokeWidth="1.4" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(201,162,74,0.7)" strokeWidth="1.4" />
        <line x1="80%" y1="0" x2="50%" y2="100%" stroke="rgba(201,162,74,0.7)" strokeWidth="1.4" />
      </svg>
      <div className="font-handwriting text-center text-[#f4eee6]" style={{
        background: "rgba(20,10,0,0.82)", border: "1.5px solid rgba(201,162,74,0.55)",
        borderRadius: 5, padding: "6px 16px 7px", fontSize: 14, letterSpacing: "0.02em",
        boxShadow: "0 0 12px rgba(255,177,94,0.5), 0 4px 12px rgba(0,0,0,0.6)",
        maxWidth: CUBE_SIZE * 0.95, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      }}>
        {onCaptionChange ? <InlineEditableText value={caption} onChange={onCaptionChange} /> : caption}
      </div>
    </div>
  );
}

/* ───────────── Lightbox ───────────── */
function PhotoLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {url && (
        <motion.div key="cubes-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md" onClick={onClose}>
          <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={22} /></button>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="relative p-3 bg-[#efe6d3] shadow-[0_40px_80px_rgba(0,0,0,0.7)] rounded-sm" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Memory" className="max-w-[88vw] max-h-[78vh] object-contain block" />
            <div className="absolute -inset-[3px] border border-[#c9a24a]/60 pointer-events-none rounded-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ───────────── Section ───────────── */
type Img = { id: string; displayUrl?: string; url?: string };
interface Props {
  images: Img[]; title: string; description: string; content?: Record<string, unknown>;
  onTitleChange?: (v: string) => void; onDescriptionChange?: (v: string) => void; onContentChange?: (key: string, v: string) => void;
}

export default function BirthdayCubes({ images, title, description, content, onTitleChange, onDescriptionChange, onContentChange }: Props) {
  const displaySlot1 = useMemo<Img[]>(() => {
    const own = images.filter((i) => i.displayUrl || i.url);
    return own.length ? own : PLACEHOLDERS.map((src, i) => ({ id: `p1-${i}`, displayUrl: src }));
  }, [images]);
  const allUrls = useMemo(() => {
    const urls = displaySlot1.map((img) => img.displayUrl || img.url || "");
    while (urls.length < 6) urls.push(PLACEHOLDERS[urls.length % PLACEHOLDERS.length]);
    return urls;
  }, [displaySlot1]);
  const FLOAT_POSITIONS = [8, 24, 42, 60, 78];
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      {/* ───── SECTION 1: Floating Glowing Lantern Cubes ───── */}
      <section className="relative h-screen overflow-hidden font-serif text-[#f4eee6]">
        {/* Background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url('/images/birthday_night_sky_v2.jpg')`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0" style={{ backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", background: "rgba(20,10,5,0.45)" }} />
          <div className="absolute inset-0 mix-blend-multiply" style={{ background: "linear-gradient(180deg, rgba(120,70,30,0.35), rgba(60,30,10,0.55))" }} />
          {/* dissolve into the shared night above and into the seam below */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #140a05 0%, rgba(20,10,5,0.6) 10%, rgba(20,10,5,0) 28%, rgba(20,10,5,0) 70%, rgba(20,10,5,0.85) 92%, #140a05 100%)" }} />
        </div>

        {/* Hero title */}
        <div
          className="absolute left-4 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
          style={{ width: "clamp(180px, 40vw, 480px)" }}
        >
          <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4 text-[#e6c56d]/85 font-sans"><span className="w-8 h-[1px] bg-[#c9a24a]" /> Chapter I · Floating cubes</p>
          <h1
            className="font-serif font-black tracking-tight leading-[0.92] text-[#f4eee6] whitespace-pre-wrap"
            style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)", textShadow: "0 4px 32px rgba(0,0,0,0.9), 0 0 60px rgba(255,177,94,0.2)" }}
          >
            {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
          </h1>
          <p
            className="font-serif italic text-[#d9cbb8]/85 whitespace-pre-wrap mt-4 leading-relaxed"
            style={{ fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)" }}
          >
            {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
          </p>
        </div>

        {/* Floating lantern cubes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {displaySlot1.slice(0, 5).map((img: Img, i: number) => {
            const duration = 45 + (i % 3) * 6;
            const delay = -(i * (duration / 5));
            const leftPos = FLOAT_POSITIONS[i];
            const scaleVal = 1 + (-120 + (i % 5) * 60) / 1600;
            const faceUrls = Array.from({ length: 6 }, (_, fi) => allUrls[(i + fi) % allUrls.length]);
            const visibilityClass = i >= 4 ? "hidden lg:block" : i >= 3 ? "hidden sm:block" : "block";

            return (
              <motion.div
                key={img.id}
                onClick={() => setOpen(faceUrls[0])}
                className={`absolute flex flex-col items-center pointer-events-auto cursor-pointer ${visibilityClass}`}
                style={{ left: `${leftPos}%`, top: "100vh", scale: scaleVal }}
                animate={{ y: [0, "-160vh"], x: [0, 25, -25, 0], rotateZ: [-1.5, 1.5, -1, 1, -1.5] }}
                transition={{
                  y: { duration, repeat: Infinity, ease: "linear", delay },
                  x: { duration: duration * 0.9, repeat: Infinity, ease: "easeInOut", delay },
                  rotateZ: { duration: duration * 0.75, repeat: Infinity, ease: "easeInOut", delay },
                }}
              >
                <div className="flex flex-col items-center sm:!transform-none" style={{ transform: "scale(0.6)", transformOrigin: "bottom center" }}>
                  <GlowingLanternCube
                    imgs={faceUrls}
                    caption={(typeof content?.[`caption_${i}`] === "string" && (content[`caption_${i}`] as string).trim()) ? (content[`caption_${i}`] as string) : DEFAULT_CAPTIONS_S1[i % DEFAULT_CAPTIONS_S1.length]}
                    speed={12 + (i % 4) * 2}
                    initialRotation={(i * 72) % 360}
                    onCaptionChange={onContentChange ? (val) => onContentChange(`caption_${i}`, val) : undefined}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom decorative */}
        <div className="absolute bottom-10 left-8 text-[#d9cbb8]/60 font-serif uppercase tracking-[0.2em] text-[0.6rem] leading-loose z-50 pointer-events-none hidden sm:block">
          Some<br />Memories<br />Never<br />Fade
        </div>
        <div className="absolute bottom-14 right-10 text-[#e6c56d] font-handwriting text-2xl md:text-3xl z-50 rotate-[-5deg] pointer-events-none">
          High<br />on<br />Moments ♡
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 text-[#d9cbb8]/60 cursor-pointer">
          <Mouse size={20} className="mb-2" />
          <span className="text-[9px] tracking-[0.3em] uppercase">Scroll Down</span>
          <div className="mt-3 w-[1px] h-10 bg-gradient-to-b from-[#d9cbb8]/40 to-transparent" />
        </div>
      </section>
      <PhotoLightbox url={open} onClose={close} />
    </>
  );
}
