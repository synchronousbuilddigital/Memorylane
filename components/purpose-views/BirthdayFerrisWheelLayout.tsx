"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";

/* ─── Constants ─── */
const WHEEL_RADIUS = 430;
const NUM_GONDOLAS = 16;
const GONDOLA_W = 110;
const GONDOLA_H = 175;
const LED_COUNT = 64;
const SPOKE_COUNT = 16;
const WHEEL_SIZE = WHEEL_RADIUS * 2 + 180;

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1530103862676-de88b4db8ba4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1558636508-e0969431e4d2?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1682687219973-3145b2855a0e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800",
];

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

function GondolaItem({ card, index, isAct, wheelRot, onClick }: { card: CardItem, index: number, isAct: boolean, wheelRot: MotionValue<number>, onClick: () => void }) {
  const angle = (index / NUM_GONDOLAS) * 360;
  
  // Magic 3D Math: We counter-rotate both the wheel's spin AND the gondola's position angle on the wheel!
  // This completely aligns the gondola's local coordinate system with the wheel's parent container BEFORE the 42-degree tilt is applied.
  const zCounterRot = useTransform(wheelRot, (v) => -v - angle);

  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) rotate(${angle}deg) translateX(${WHEEL_RADIUS - 20}px)`, zIndex: isAct ? 30 : 20, transformStyle: "preserve-3d" }}>
      {/* This div neutralizes the Z rotation */}
      <motion.div
        style={{ rotate: zCounterRot, transformStyle: "preserve-3d" }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        {/* This div perfectly counters the parent's 3D tilt, so the cabin ALWAYS faces the camera, behaving like real gravity! */}
        <motion.div
          animate={isAct ? { scale: 1.8, y: -20, rotateX: 5, rotateY: 42 } : { scale: 1, y: 0, rotateX: 5, rotateY: 42 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            width: GONDOLA_W, height: GONDOLA_H, position: "relative",
            cursor: "pointer",
            transformStyle: "preserve-3d"
          }}
          whileHover={!isAct ? { scale: 1.15 } : {}}
        >
          {/* Pendulum Swing Physics Layer */}
          <motion.div
            animate={{ rotateZ: [-5, 5, -5] }}
            transition={{
              duration: 3 + (index % 4) * 0.5, // slight variation in swing duration per cabin (3s to 4.5s)
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: "100%", height: "100%",
              transformOrigin: "top center",
              display: "flex", flexDirection: "column", alignItems: "center",
              transformStyle: "preserve-3d"
            }}
          >
            {/* Cabin (Theme Style) */}
            <div style={{
              width: "100%", height: 135, // 175px container - 40px ropes
              background: "linear-gradient(145deg, rgba(40,10,30,0.95), rgba(15,5,15,0.95))", // Dark theme matching background
              padding: "4px", // Uniform thin border
              border: isAct ? "1px solid rgba(255,216,64,0.9)" : "1px solid rgba(255,216,64,0.3)", // Gold border matching Memory Pass
              borderRadius: "6px", position: "relative",
              boxShadow: isAct ? "0 0 35px rgba(255,216,64,0.7),0 15px 30px rgba(0,0,0,0.8)" : "0 8px 20px rgba(0,0,0,0.6)",
              transform: "translateZ(55px)",
              marginTop: "40px" // Push cabin down to make room for ropes
            }}>
              {/* Hanging Ropes (Absolutely positioned to guarantee perfect alignment) */}
              <div style={{ position: "absolute", top: -40, left: 10, width: 2, height: 40, background: "linear-gradient(180deg, #FFD840, #B8860B)", boxShadow: "1px 1px 3px rgba(0,0,0,0.8)" }} />
              <div style={{ position: "absolute", top: -40, right: 10, width: 2, height: 40, background: "linear-gradient(180deg, #FFD840, #B8860B)", boxShadow: "1px 1px 3px rgba(0,0,0,0.8)" }} />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.displayUrl || (card as any).url} alt="memory" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "2px", opacity: isAct ? 1 : 0.9, filter: isAct ? "contrast(1.05)" : "sepia(0.2) brightness(0.95)" }} />
              {/* Glass Reflection */}
              <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 18, background: "linear-gradient(135deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0) 45%,rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
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

  // Animate the wheel
  useEffect(() => {
    let controls: any;
    if (activeIdx === null) {
      controls = animate(wheelRot, [wheelRot.get(), wheelRot.get() + 360], {
        duration: 45, // 45 seconds for a majestic but visible spin
        ease: "linear",
        repeat: Infinity,
      });
    } else {
      const targetAngle = 360 - (activeIdx / NUM_GONDOLAS) * 360;
      let current = wheelRot.get() % 360;
      if (current < 0) current += 360;
      let diff = targetAngle - current;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;
      
      controls = animate(wheelRot, wheelRot.get() + diff, {
        type: "spring",
        stiffness: 40,
        damping: 15,
      });
    }
    return () => controls?.stop();
  }, [activeIdx, wheelRot]);

  const safeCards = Array.from({ length: NUM_GONDOLAS }, (_, i) => {
    return cards[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative", width: "100%", height: "100vh",
        overflow: "hidden",
        fontFamily: "system-ui,-apple-system,sans-serif",
        background: "#050819",
      }}
    >
      {/* ── PHOTOREALISTIC BOKEH BACKGROUND ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/ferris-wheel-bg-clean.jpg" 
          alt="Clean Scenery Background" 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
        {/* Soft shadow only on the left side to ensure text is readable, right side is perfectly clear */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(15,5,10,0.8) 0%, rgba(15,5,10,0.3) 30%, transparent 60%)" }} />
      </div>

      {/* Floating Golden Dust Particles */}
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div key={`dust-${i}`}
          style={{ 
            position: "absolute", 
            left: `${(i * 13.71) % 100}%`, 
            top: `${(i * 9.37) % 100}%`, 
            width: 2 + (i % 5), 
            height: 2 + (i % 5), 
            borderRadius: "50%", 
            background: "rgba(255, 216, 64, 0.7)", 
            boxShadow: "0 0 12px rgba(255, 216, 64, 0.8)",
            filter: `blur(${(i % 3)}px)`,
            zIndex: 1 
          }}
          animate={{ 
            opacity: [0.1, 0.7, 0.1], 
            y: [0, -30 - (i % 20), 0],
            x: [0, (i % 20) - 10, 0]
          }}
          transition={{ duration: 4 + (i % 6), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}

      {/* ── LEFT PANEL ── */}
      <div style={{ position: "absolute", left: "5%", top: "45%", transform: "translateY(-50%)", zIndex: 25, maxWidth: "25%" }}>
        {/* Cursive heading */}
        <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontStyle: "italic", fontSize: "clamp(2rem,3.5vw,3.5rem)", color: "#fff", lineHeight: 1.2, textShadow: "0 4px 30px rgba(0,0,0,0.9)", marginBottom: 30 }}>
          <InlineEditableText value={title} onChange={onTitleChange ?? (() => {})} />
          <div style={{ fontSize: "1.5em", marginTop: 8, color: "rgba(255,216,64,0.9)" }}>♡</div>
        </div>
        {/* Keywords */}
        {["PLACES", "PEOPLE", "MOMENTS", "FOREVER"].map((kw, i) => (
          <div key={i} style={{ fontSize: 11, letterSpacing: "0.4em", color: "rgba(220,188,135,0.8)", fontWeight: 700, marginBottom: 8 }}>{kw}</div>
        ))}
        {/* Memory Pass card */}
        <div style={{ marginTop: 35, background: "linear-gradient(135deg,rgba(100,25,60,0.95),rgba(30,5,20,0.98))", border: "1px solid rgba(200,155,48,0.5)", borderRadius: 12, padding: "16px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.6)", maxWidth: 220 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,216,64,0.7)", fontWeight: 700, marginBottom: 8 }}>Memory Pass</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "0.08em" }}>{String(Math.min(cards.length, NUM_GONDOLAS)).padStart(2, "0")} / {String(NUM_GONDOLAS).padStart(2, "0")}</div>
          <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(220,188,120,0.5)", marginTop: 4, textTransform: "uppercase" }}>Memories</div>
        </div>
      </div>

      {/* ── RIGHT TIMELINE ── */}
      <div style={{ position: "absolute", right: "2%", top: "50%", transform: "translateY(-50%)", zIndex: 25, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 13 }}>
        <div style={{ width: 1, height: 18, background: "rgba(200,155,48,0.28)", marginLeft: 3, marginBottom: 2 }} />
        {[2022, 2023, 2024, 2025, 2026].map((yr) => {
          const active = yr === 2024;
          return (
            <div key={yr} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: active ? 9 : 4, height: active ? 9 : 4, borderRadius: "50%", background: active ? "#FFD840" : "rgba(200,155,48,0.38)", boxShadow: active ? "0 0 10px rgba(255,216,64,0.65)" : "none", transition: "all 0.3s" }} />
              <span style={{ fontSize: active ? 12 : 10, color: active ? "#FFD840" : "rgba(200,155,48,0.4)", fontWeight: active ? 700 : 400, letterSpacing: "0.08em" }}>{yr}</span>
            </div>
          );
        })}
      </div>

      {/* ── WHEEL + SUPPORT (CENTERED) ── */}
      <div style={{
        position: "absolute", inset: 0, left: "20%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 15,
        perspective: "2000px",
        paddingBottom: "2%",
      }}>
        {/* MASSIVE 3D TILT (The 2.5D Magic) */}
        {/* Adjusted scale down to 0.65 so the bigger wheel fits nicely */}
        <div style={{ transform: "rotateY(-42deg) rotateX(-5deg) scale(0.65)", transformStyle: "preserve-3d", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* WHEEL CONTAINER */}
          <div style={{ position: "relative", width: WHEEL_SIZE, height: WHEEL_SIZE, transformStyle: "preserve-3d" }}>

            {/* ROTATING GROUP */}
            <motion.div style={{ position: "absolute", inset: 0, rotate: wheelRot, transformStyle: "preserve-3d" }}>

              {/* Outer metallic rim */}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "24px solid #F59E0B", boxShadow: "0 0 0 4px rgba(255,215,58,0.55),0 0 0 28px rgba(55,38,6,0.97),0 0 150px rgba(236,72,153,0.35),inset 0 0 40px rgba(0,0,0,0.65)", background: "conic-gradient(from 0deg,rgba(245,158,11,0.2),rgba(157,36,73,0.4),rgba(245,158,11,0.2))", transform: "translateZ(0px)" }} />
              
              {/* Depth rings (gives 3D cylinder feel) */}
              <div style={{ position: "absolute", inset: "-40px", borderRadius: "50%", border: "20px solid rgba(80,25,45,0.8)", transform: "translateZ(-30px)" }} />
              <div style={{ position: "absolute", inset: "-80px", borderRadius: "50%", border: "16px solid rgba(40,10,25,0.9)", transform: "translateZ(-60px)" }} />
              
              <div style={{ position: "absolute", top: "2.4%", left: "2.4%", right: "2.4%", bottom: "2.4%", borderRadius: "50%", border: "12px solid rgba(130,40,70,0.82)", boxShadow: "inset 0 5px 16px rgba(0,0,0,0.62)", transform: "translateZ(5px)" }} />
              <div style={{ position: "absolute", top: "7.5%", left: "7.5%", right: "7.5%", bottom: "7.5%", borderRadius: "50%", border: "5px solid rgba(175,138,48,0.3)", boxShadow: "0 0 12px rgba(255,200,55,0.08)", transform: "translateZ(10px)" }} />
              <div style={{ position: "absolute", top: "14%", left: "14%", right: "14%", bottom: "14%", borderRadius: "50%", border: "2px solid rgba(175,138,48,0.14)", transform: "translateZ(15px)" }} />

              {/* RIM LEDS */}
              {Array.from({ length: LED_COUNT }).map((_, i) => {
                const a = (i / LED_COUNT) * 360;
                return (
                  <div key={`led-${i}`} style={{ position: "absolute", top: "50%", left: "50%", width: WHEEL_RADIUS * 2 - 4, height: 1, transform: `translate(-50%,-50%) rotate(${a}deg)` }}>
                    <motion.div style={{ position: "absolute", right: -4, top: -2, width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px 3px rgba(255,216,64,0.8)" }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                    />
                  </div>
                );
              })}

              {/* SPOKES */}
              {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
                const a = (i / SPOKE_COUNT) * 360;
                const numSL = 8;
                return (
                  <div key={`spoke-${i}`} style={{ position: "absolute", top: "50%", left: "50%", width: WHEEL_RADIUS - 14, height: 6, marginTop: -3, transformOrigin: "0 50%", transform: `rotate(${a}deg)`, background: "linear-gradient(90deg,rgba(255,215,58,0.9) 0%,rgba(200,152,46,0.62) 55%,rgba(115,80,12,0.3) 100%)", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }}>
                    {Array.from({ length: numSL }).map((_, li) => (
                      <motion.div key={`sl-${li}`}
                        style={{ position: "absolute", left: `${(li + 1) * (100 / (numSL + 1))}%`, top: "50%", transform: "translate(-50%,-50%)", width: 6, height: 6, borderRadius: "50%", background: "#FFD840", boxShadow: "0 0 6px 3px rgba(255,216,64,0.72)" }}
                        animate={{ opacity: [0.35, 1, 0.38] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: li * 0.15 + i * 0.08 }}
                      />
                    ))}
                  </div>
                );
              })}

              {/* GONDOLAS */}
              {safeCards.map((card, i) => (
                <GondolaItem 
                  key={card.id} 
                  card={card} 
                  index={i} 
                  isAct={activeIdx === i} 
                  wheelRot={wheelRot} 
                  onClick={() => setActiveIdx(activeIdx === i ? null : i)} 
                />
              ))}
            </motion.div>

            {/* CENTRE HUB — static */}
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) translateZ(40px)",
              width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle at 38% 34%,#FFEC6E 0%,#C49A22 34%,#7B5412 72%,#3a2605 100%)",
              border: "6px solid rgba(255,218,58,0.75)",
              boxShadow: "0 0 50px rgba(255,216,64,0.7),0 0 100px rgba(255,178,48,0.38),inset 0 4px 12px rgba(255,255,200,0.22)",
              zIndex: 18,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 13, color: "rgba(255,252,220,0.92)", textAlign: "center", lineHeight: 1.38, fontFamily: "Georgia,serif", fontWeight: 700, letterSpacing: "0.04em", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                Our<br />Memories
              </div>
              <div style={{ fontSize: 20, marginTop: 4, color: "rgba(255,242,180,0.85)", textShadow: "0 0 8px rgba(255,216,64,0.5)" }}>♡</div>
            </div>
          </div>

          {/* SUPPORT A-FRAME */}
          <div style={{ position: "relative", width: 480, height: 320, marginTop: -20, transformStyle: "preserve-3d", transform: "translateZ(-20px)" }}>
            {/* Top axle bar */}
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%) translateZ(-40px)", width: 440, height: 16, background: "linear-gradient(180deg,#F59E0B 0%,#9d2449 100%)", borderRadius: 8, boxShadow: "0 6px 22px rgba(0,0,0,0.6)" }} />
            {/* LEFT LEG */}
            <div style={{ position: "absolute", top: 12, left: "18%", width: 22, height: 300, background: "linear-gradient(90deg,#4a1525,#F59E0B,#D97706,#4a1525)", transformOrigin: "top center", transform: "rotate(-14.5deg) translateZ(-50px)", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.55)", overflow: "visible" }}>
              {Array.from({ length: 8 }).map((_, li) => (
                <motion.div key={li} style={{ position: "absolute", top: `${10 + li * 12}%`, left: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "#FFD840", boxShadow: "0 0 12px 6px rgba(255,216,64,0.62)" }}
                  animate={{ opacity: [0.38, 1, 0.4] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: li * 0.14 }}
                />
              ))}
            </div>
            {/* RIGHT LEG */}
            <div style={{ position: "absolute", top: 12, right: "18%", width: 22, height: 300, background: "linear-gradient(90deg,#4a1525,#F59E0B,#D97706,#4a1525)", transformOrigin: "top center", transform: "rotate(14.5deg) translateZ(-50px)", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.55)", overflow: "visible" }}>
              {Array.from({ length: 8 }).map((_, li) => (
                <motion.div key={li} style={{ position: "absolute", top: `${10 + li * 12}%`, left: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "#FFD840", boxShadow: "0 0 12px 6px rgba(255,216,64,0.62)" }}
                  animate={{ opacity: [0.38, 1, 0.4] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: li * 0.14 + 0.42 }}
                />
              ))}
            </div>
            {/* Cross brace upper */}
            <div style={{ position: "absolute", top: "28%", left: "14%", right: "14%", height: 16, background: "linear-gradient(90deg,#4a1525,#F59E0B,#D97706,#4a1525)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.45)", transform: "translateZ(-48px)" }} />
            {/* Cross brace lower */}
            <div style={{ position: "absolute", top: "60%", left: "10%", right: "10%", height: 16, background: "linear-gradient(90deg,#4a1525,#F59E0B,#D97706,#4a1525)", borderRadius: 8, transform: "translateZ(-48px)" }} />
            {/* Base feet */}
            <div style={{ position: "absolute", bottom: 0, left: "4%", width: 90, height: 18, background: "linear-gradient(90deg,#2a0a15,#D97706)", borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", transform: "translateZ(-45px)" }} />
            <div style={{ position: "absolute", bottom: 0, right: "4%", width: 90, height: 18, background: "linear-gradient(90deg,#D97706,#2a0a15)", borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", transform: "translateZ(-45px)" }} />
          </div>
        </div>

        {/* DRAG TO EXPLORE */}
        <div style={{ position: "absolute", bottom: "3.5%", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, zIndex: 22 }}>
          <div style={{ width: 24, height: 40, border: "2px solid rgba(200,155,48,0.38)", borderRadius: 12, position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6 }}>
            <motion.div style={{ width: 4, height: 8, borderRadius: 2, background: "rgba(200,155,48,0.7)" }}
              animate={{ y: [0, 14, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(200,155,48,0.6)", fontWeight: 700 }}>DRAG TO EXPLORE</span>
        </div>
      </div>
    </section>
  );
}
