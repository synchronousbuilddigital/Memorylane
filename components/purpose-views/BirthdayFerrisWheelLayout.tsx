"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";

/* ─── A brass-and-walnut ferris wheel on a lakeside boardwalk. Click a cabin to bring it round. ─── */
const WHEEL_RADIUS = 430;
const NUM_GONDOLAS = 16;
const GONDOLA_W = 110;
const GONDOLA_H = 175;
const LED_COUNT = 64;
const SPOKE_COUNT = 16;
const WHEEL_SIZE = WHEEL_RADIUS * 2 + 180;
const FRAME_H = 320;

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511795409834-ef04bbd61622",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1469474968028-56623f02e42e",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1501785888041-af3ef285b470",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1464349095431-e9a21285b5f3",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1609234656388-0ff363383899",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1513151233558-d860c5398176",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1475503572774-15a45e5d60b9",
];

/* Shared palette (the same brass / walnut / cream the rest of the site uses) */
const BRASS = "#c9a24a", BRASS_LIGHT = "#e6c56d", BRASS_DARK = "#8a6a1e", BRASS_DEEP = "#5a4412";
const WALNUT = "#3b1f0c", WALNUT_LIGHT = "#5c3616", NIGHT = "#140a05";
const BULB = "rgba(255,201,138,"; // + alpha)

interface CardItem { id: string; displayUrl: string; title?: string; }
interface Props {
  title: string;
  description: string;
  cards: CardItem[];
  onTitleChange?: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
  isEditing?: boolean;
  sectionRef?: React.RefObject<HTMLDivElement>;
}

const CHAPTERS = ["Lanterns", "The Gift", "The Wheel", "Wishing Tree"];

function GondolaItem({ card, index, isAct, wheelRot, onClick }: { card: CardItem, index: number, isAct: boolean, wheelRot: MotionValue<number>, onClick: () => void }) {
  const angle = (index / NUM_GONDOLAS) * 360;
  // Counter-rotate the wheel's spin and this cabin's position angle so the cabin hangs upright
  const zCounterRot = useTransform(wheelRot, (v) => -v - angle);

  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) rotate(${angle}deg) translateX(${WHEEL_RADIUS - 20}px)`, zIndex: isAct ? 30 : 20, transformStyle: "preserve-3d" }}>
      <motion.div style={{ rotate: zCounterRot, transformStyle: "preserve-3d" }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        {/* counters the parent's tilt so the cabin always faces the camera */}
        <motion.div
          animate={isAct ? { scale: 1.8, y: -20, rotateX: 5, rotateY: 42 } : { scale: 1, y: 0, rotateX: 5, rotateY: 42 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ width: GONDOLA_W, height: GONDOLA_H, position: "relative", cursor: "pointer", transformStyle: "preserve-3d" }}
          whileHover={!isAct ? { scale: 1.15 } : {}}
        >
          {/* pendulum swing */}
          <motion.div
            animate={{ rotateZ: [-5, 5, -5] }}
            transition={{ duration: 3 + (index % 4) * 0.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "100%", height: "100%", transformOrigin: "top center", display: "flex", flexDirection: "column", alignItems: "center", transformStyle: "preserve-3d" }}
          >
            {/* cabin: walnut with a brass rail */}
            <div style={{
              width: "100%", height: 135,
              background: `linear-gradient(145deg, ${WALNUT_LIGHT}, ${WALNUT})`,
              padding: 4,
              border: isAct ? `1px solid ${BRASS_LIGHT}` : `1px solid rgba(201,162,74,0.45)`,
              borderRadius: 6, position: "relative",
              boxShadow: isAct ? `0 0 35px ${BULB}0.55), 0 15px 30px rgba(0,0,0,0.8)` : "0 8px 20px rgba(0,0,0,0.6)",
              transform: "translateZ(55px)",
              marginTop: 40,
            }}>
              {/* hanging bars */}
              <div style={{ position: "absolute", top: -40, left: 10, width: 2, height: 40, background: `linear-gradient(180deg, ${BRASS_LIGHT}, ${BRASS_DARK})`, boxShadow: "1px 1px 3px rgba(0,0,0,0.8)" }} />
              <div style={{ position: "absolute", top: -40, right: 10, width: 2, height: 40, background: `linear-gradient(180deg, ${BRASS_LIGHT}, ${BRASS_DARK})`, boxShadow: "1px 1px 3px rgba(0,0,0,0.8)" }} />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.displayUrl || (card as any).url} alt="memory" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2, opacity: isAct ? 1 : 0.92, filter: isAct ? "contrast(1.05)" : "sepia(0.2) brightness(0.95)" }} />
              {/* glass reflection */}
              <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 18, background: "linear-gradient(135deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0) 45%,rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function BirthdayFerrisWheelLayout({
  title, description, cards,
  onTitleChange, onDescriptionChange,
  isEditing, sectionRef,
}: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const wheelRot = useMotionValue(0);
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = sectionRef ?? ownRef;
  void isEditing;

  // The wheel is drawn at a fixed size and scaled to whatever pane it gets, so it is never cropped
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const byH = (height * 0.86) / (WHEEL_SIZE + FRAME_H - 40);
      const byW = (width * 0.62) / WHEEL_SIZE;
      setScale(Math.max(0.28, Math.min(0.62, byH, byW)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  // Spin slowly; bring a clicked cabin round to the front
  useEffect(() => {
    let controls: { stop: () => void } | undefined;
    if (activeIdx === null) {
      controls = animate(wheelRot, [wheelRot.get(), wheelRot.get() + 360], { duration: 45, ease: "linear", repeat: Infinity });
    } else {
      const targetAngle = 360 - (activeIdx / NUM_GONDOLAS) * 360;
      let current = wheelRot.get() % 360;
      if (current < 0) current += 360;
      let diff = targetAngle - current;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;
      controls = animate(wheelRot, wheelRot.get() + diff, { type: "spring", stiffness: 40, damping: 15 });
    }
    return () => controls?.stop();
  }, [activeIdx, wheelRot]);

  const safeCards = Array.from({ length: NUM_GONDOLAS }, (_, i) => cards[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] });
  const aboard = Math.min(cards.length, NUM_GONDOLAS);
  const strut = `linear-gradient(90deg,${WALNUT},${BRASS},${BRASS_DARK},${WALNUT})`;

  return (
    <section ref={ref} className="relative w-full h-screen overflow-hidden font-sans" style={{ background: NIGHT }} onClick={() => setActiveIdx(null)}>
      {/* Lakeside backdrop, warmed to the site's palette */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ferris-wheel-bg-clean.jpg" alt="" className="w-full h-full object-cover" style={{ filter: "sepia(0.45) saturate(0.7) brightness(0.8)" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(20,10,5,0.92) 0%, rgba(20,10,5,0.55) 32%, rgba(20,10,5,0.15) 60%, rgba(20,10,5,0.35) 100%)` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(20,10,5,0.35) 0%, transparent 35%, rgba(20,10,5,0.75) 100%)` }} />
        {/* warm pool of light behind the wheel */}
        <div className="absolute" style={{ left: "38%", top: "10%", width: "60%", height: "80%", background: `radial-gradient(ellipse at center, ${BULB}0.22) 0%, transparent 60%)` }} />
      </div>

      {/* Drifting embers */}
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.div key={`dust-${i}`}
          style={{ position: "absolute", left: `${(i * 13.71) % 100}%`, top: `${(i * 9.37) % 100}%`, width: 2 + (i % 4), height: 2 + (i % 4), borderRadius: "50%", background: `${BULB}0.75)`, boxShadow: `0 0 10px ${BULB}0.7)`, filter: `blur(${i % 3}px)`, zIndex: 1 }}
          animate={{ opacity: [0.1, 0.65, 0.1], y: [0, -30 - (i % 20), 0], x: [0, (i % 20) - 10, 0] }}
          transition={{ duration: 4 + (i % 6), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}

      {/* ── LEFT: words ── */}
      <div className="absolute left-6 sm:left-10 md:left-14 top-1/2 -translate-y-1/2 z-30 max-w-[34%] md:max-w-[26%]" onClick={(e) => e.stopPropagation()}>
        <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4" style={{ color: BRASS_LIGHT, opacity: 0.85 }}>
          <span className="w-8 h-[1px]" style={{ background: BRASS }} /> Chapter III · The wheel
        </p>
        <h2 className="font-serif font-black tracking-tight leading-[0.95] text-[#f4eee6] whitespace-pre-wrap" style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.8rem)", textShadow: "0 6px 30px rgba(0,0,0,0.85)" }}>
          {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
        </h2>
        <p className="font-serif italic mt-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(217,203,184,0.85)" }}>
          {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
        </p>

        <div className="mt-6 space-y-1.5">
          {["Places", "People", "Moments", "Forever"].map((kw) => (
            <div key={kw} className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: "rgba(217,203,184,0.55)" }}>{kw}</div>
          ))}
        </div>

        {/* brass ticket */}
        <div className="mt-7 inline-block rounded-xl px-5 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.6)]" style={{ background: "linear-gradient(135deg,#efe6d3,#e3d5b6)", border: `1px solid ${BRASS}` }}>
          <div className="text-[9px] tracking-[0.45em] uppercase font-bold" style={{ color: BRASS_DARK }}>Memories aboard</div>
          <div className="font-serif font-black text-2xl mt-0.5 tabular-nums" style={{ color: "#1c1917" }}>{String(aboard).padStart(2, "0")} <span className="text-base font-bold" style={{ color: BRASS_DARK }}>/ {NUM_GONDOLAS}</span></div>
          <div className="text-[9px] tracking-[0.3em] uppercase font-semibold mt-0.5" style={{ color: "rgba(90,77,65,0.7)" }}>cabins filled</div>
        </div>
      </div>

      {/* ── RIGHT: chapters ── */}
      <div className="hidden md:flex absolute right-[2%] top-1/2 -translate-y-1/2 z-30 flex-col items-start gap-3">
        {CHAPTERS.map((c, i) => {
          const active = i === 2;
          return (
            <div key={c} className="flex items-center gap-2.5">
              <div className="rounded-full transition-all" style={{ width: active ? 9 : 4, height: active ? 9 : 4, background: active ? BRASS_LIGHT : "rgba(201,162,74,0.35)", boxShadow: active ? `0 0 10px ${BULB}0.7)` : "none" }} />
              <span className="tracking-[0.12em] uppercase" style={{ fontSize: active ? 11 : 9, fontWeight: active ? 700 : 500, color: active ? BRASS_LIGHT : "rgba(201,162,74,0.45)" }}>
                {["I", "II", "III", "IV"][i]} · {c}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── WHEEL ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ left: "22%", perspective: 2000, paddingBottom: "1%" }}>
        <div style={{ transform: `rotateY(-42deg) rotateX(-5deg) scale(${scale})`, transformStyle: "preserve-3d", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: WHEEL_SIZE, height: WHEEL_SIZE, transformStyle: "preserve-3d" }}>
            <motion.div style={{ position: "absolute", inset: 0, rotate: wheelRot, transformStyle: "preserve-3d" }}>
              {/* rim */}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `24px solid ${BRASS}`, boxShadow: `0 0 0 4px rgba(230,197,109,0.5), 0 0 0 28px rgba(40,20,8,0.97), 0 0 150px ${BULB}0.25), inset 0 0 40px rgba(0,0,0,0.65)`, background: "conic-gradient(from 0deg,rgba(201,162,74,0.18),rgba(92,54,22,0.4),rgba(201,162,74,0.18))" }} />
              {/* depth rings */}
              <div style={{ position: "absolute", inset: -40, borderRadius: "50%", border: "20px solid rgba(59,31,12,0.85)", transform: "translateZ(-30px)" }} />
              <div style={{ position: "absolute", inset: -80, borderRadius: "50%", border: "16px solid rgba(40,20,8,0.9)", transform: "translateZ(-60px)" }} />
              <div style={{ position: "absolute", inset: "2.4%", borderRadius: "50%", border: "12px solid rgba(92,54,22,0.85)", boxShadow: "inset 0 5px 16px rgba(0,0,0,0.62)", transform: "translateZ(5px)" }} />
              <div style={{ position: "absolute", inset: "7.5%", borderRadius: "50%", border: "5px solid rgba(201,162,74,0.3)", transform: "translateZ(10px)" }} />
              <div style={{ position: "absolute", inset: "14%", borderRadius: "50%", border: "2px solid rgba(201,162,74,0.14)", transform: "translateZ(15px)" }} />

              {/* rim bulbs */}
              {Array.from({ length: LED_COUNT }).map((_, i) => (
                <div key={`led-${i}`} style={{ position: "absolute", top: "50%", left: "50%", width: WHEEL_RADIUS * 2 - 4, height: 1, transform: `translate(-50%,-50%) rotate(${(i / LED_COUNT) * 360}deg)` }}>
                  <motion.div style={{ position: "absolute", right: -4, top: -2, width: 5, height: 5, borderRadius: "50%", background: "#fff1c8", boxShadow: `0 0 8px 3px ${BULB}0.8)` }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.5 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                  />
                </div>
              ))}

              {/* spokes */}
              {Array.from({ length: SPOKE_COUNT }).map((_, i) => (
                <div key={`spoke-${i}`} style={{ position: "absolute", top: "50%", left: "50%", width: WHEEL_RADIUS - 14, height: 6, marginTop: -3, transformOrigin: "0 50%", transform: `rotate(${(i / SPOKE_COUNT) * 360}deg)`, background: "linear-gradient(90deg,rgba(230,197,109,0.9) 0%,rgba(201,162,74,0.62) 55%,rgba(110,79,26,0.3) 100%)", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }}>
                  {Array.from({ length: 8 }).map((_, li) => (
                    <motion.div key={`sl-${li}`}
                      style={{ position: "absolute", left: `${(li + 1) * (100 / 9)}%`, top: "50%", transform: "translate(-50%,-50%)", width: 6, height: 6, borderRadius: "50%", background: "#fff1c8", boxShadow: `0 0 6px 3px ${BULB}0.7)` }}
                      animate={{ opacity: [0.35, 1, 0.38] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: li * 0.15 + i * 0.08 }}
                    />
                  ))}
                </div>
              ))}

              {safeCards.map((card, i) => (
                <GondolaItem key={card.id} card={card} index={i} isAct={activeIdx === i} wheelRot={wheelRot} onClick={() => setActiveIdx(activeIdx === i ? null : i)} />
              ))}
            </motion.div>

            {/* hub */}
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) translateZ(40px)",
              width: 140, height: 140, borderRadius: "50%",
              background: `radial-gradient(circle at 38% 34%,#f6e29a 0%,${BRASS} 34%,${BRASS_DARK} 72%,${BRASS_DEEP} 100%)`,
              border: `6px solid rgba(230,197,109,0.75)`,
              boxShadow: `0 0 50px ${BULB}0.6), 0 0 100px ${BULB}0.3), inset 0 4px 12px rgba(255,240,210,0.25)`,
              zIndex: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div className="font-serif font-bold text-center" style={{ fontSize: 13, lineHeight: 1.38, color: "#f4eee6", letterSpacing: "0.04em", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>Our<br />Memories</div>
              <div style={{ fontSize: 20, marginTop: 4, color: "#f4eee6", textShadow: `0 0 8px ${BULB}0.5)` }}>♡</div>
            </div>
          </div>

          {/* A-frame */}
          <div style={{ position: "relative", width: 480, height: FRAME_H, marginTop: -20, transformStyle: "preserve-3d", transform: "translateZ(-20px)" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%) translateZ(-40px)", width: 440, height: 16, background: `linear-gradient(180deg,${BRASS} 0%,${WALNUT_LIGHT} 100%)`, borderRadius: 8, boxShadow: "0 6px 22px rgba(0,0,0,0.6)" }} />
            {[-1, 1].map((s) => (
              <div key={s} style={{ position: "absolute", top: 12, [s < 0 ? "left" : "right"]: "18%", width: 22, height: 300, background: strut, transformOrigin: "top center", transform: `rotate(${s * 14.5}deg) translateZ(-50px)`, borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.55)" }}>
                {Array.from({ length: 8 }).map((_, li) => (
                  <motion.div key={li} style={{ position: "absolute", top: `${10 + li * 12}%`, left: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "#fff1c8", boxShadow: `0 0 12px 6px ${BULB}0.6)` }}
                    animate={{ opacity: [0.38, 1, 0.4] }}
                    transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: li * 0.14 + (s > 0 ? 0.42 : 0) }}
                  />
                ))}
              </div>
            ))}
            <div style={{ position: "absolute", top: "28%", left: "14%", right: "14%", height: 16, background: strut, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.45)", transform: "translateZ(-48px)" }} />
            <div style={{ position: "absolute", top: "60%", left: "10%", right: "10%", height: 16, background: strut, borderRadius: 8, transform: "translateZ(-48px)" }} />
            <div style={{ position: "absolute", bottom: 0, left: "4%", width: 90, height: 18, background: `linear-gradient(90deg,#2a160a,${BRASS_DARK})`, borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", transform: "translateZ(-45px)" }} />
            <div style={{ position: "absolute", bottom: 0, right: "4%", width: 90, height: 18, background: `linear-gradient(90deg,${BRASS_DARK},#2a160a)`, borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", transform: "translateZ(-45px)" }} />
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-30 flex items-center gap-2 text-white/50 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold">
        <span>Click a cabin to bring it round</span>
        <div className="w-8 h-[1px] bg-white/30" />
      </div>
    </section>
  );
}
